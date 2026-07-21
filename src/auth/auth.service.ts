import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from './auth.cookies';
import { accessSecret, refreshSecret } from './auth.constants';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  tokens: AuthTokens;
  user: { id: string; email: string };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email,
      passwordHash,
      refreshTokenHash: null,
    });
    await this.usersRepository.save(user);

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return this.issueTokens(user);
  }

  /**
   * Обновление пары токенов по refresh-токену из куки.
   * Проверяем не только подпись, но и совпадение с хешем в БД —
   * это позволяет отзывать сессии и ловит переиспользование старого токена.
   */
  async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh-токен отсутствует');
    }

    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Refresh-токен недействителен или истёк');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Сессия не найдена, войдите заново');
    }

    if (!this.refreshTokenMatches(refreshToken, user.refreshTokenHash)) {
      // Токен подписан верно, но в БД лежит другой — вероятно,
      // используется старый токен. Обрываем сессию целиком.
      user.refreshTokenHash = null;
      await this.usersRepository.save(user);
      throw new UnauthorizedException('Сессия истекла, войдите заново');
    }

    return this.issueTokens(user);
  }

  /**
   * Разлогин по refresh-токену, а не по access-токену: access может уже
   * протухнуть, но выйти из аккаунта пользователь должен в любом случае.
   */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret(),
      });
      await this.usersRepository.update(
        { id: payload.sub },
        { refreshTokenHash: null },
      );
    } catch {
      // Токен невалиден — сессии в БД всё равно нет, просто чистим куки
    }
  }

  async findById(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return { id: user.id, email: user.email };
  }

  /** Генерирует новую пару токенов и сохраняет хеш refresh-токена в БД. */
  private async issueTokens(user: User): Promise<AuthResult> {
    const payload = { sub: user.id, email: user.email };

    // jti — уникальный id токена. Без него два токена, выпущенные в одну
    // секунду, совпадут побайтово (payload и iat одинаковы), и ротация
    // refresh-токена перестанет работать.
    const accessToken = await this.jwtService.signAsync(
      { ...payload, jti: randomUUID() },
      { secret: accessSecret(), expiresIn: ACCESS_TOKEN_TTL },
    );

    const refreshToken = await this.jwtService.signAsync(
      { ...payload, jti: randomUUID() },
      { secret: refreshSecret(), expiresIn: REFRESH_TOKEN_TTL },
    );

    user.refreshTokenHash = this.hashRefreshToken(refreshToken);
    await this.usersRepository.save(user);

    return {
      tokens: { accessToken, refreshToken },
      user: { id: user.id, email: user.email },
    };
  }

  /**
   * Для refresh-токена используем SHA-256, а не bcrypt. Причины:
   * 1) bcrypt обрезает вход до 72 байт, а JWT длиннее — два разных токена
   *    с одинаковым началом дали бы одинаковый хеш, и ротация сломалась бы;
   * 2) bcrypt нужен для паролей с низкой энтропией, а токен и так случаен.
   */
  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Сравнение за постоянное время — защита от timing-атак. */
  private refreshTokenMatches(token: string, storedHash: string): boolean {
    const tokenHash = Buffer.from(this.hashRefreshToken(token), 'hex');
    const expected = Buffer.from(storedHash, 'hex');

    if (tokenHash.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(tokenHash, expected);
  }
}
