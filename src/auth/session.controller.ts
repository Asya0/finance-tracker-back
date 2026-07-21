import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from './auth.cookies';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';
import { AuthResponseDto, UserDto } from './dto/auth-response.dto';

@ApiTags('Сессия')
@Controller('auth')
export class SessionController {
  constructor(private readonly authService: AuthService) {}

  /** Выдаёт новую пару токенов по refresh-куке и ротирует её. */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'Обновление токенов',
    description:
      'Читает refreshToken из куки и выдаёт новую пару токенов. Старый refresh-токен ' +
      'после этого недействителен: повторное его использование обрывает всю сессию.',
  })
  @ApiResponse({ status: 200, description: 'Токены обновлены', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh-токен отсутствует, истёк или уже был использован' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    const { tokens, user } = await this.authService.refresh(refreshToken);
    setAuthCookies(res, tokens);
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'Выход',
    description:
      'Отзывает сессию в базе и удаляет куки. Работает даже с истёкшим access-токеном.',
  })
  @ApiResponse({ status: 200, description: 'Сессия завершена' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req.cookies?.[REFRESH_TOKEN_COOKIE]);
    clearAuthCookies(res);
    return { success: true };
  }

  /** Текущий пользователь — фронт дёргает его для восстановления сессии. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Текущий пользователь',
    description: 'Требует действующий accessToken в куке.',
  })
  @ApiResponse({ status: 200, description: 'Данные пользователя', type: UserDto })
  @ApiResponse({ status: 401, description: 'Access-токен отсутствует или истёк' })
  me(@Req() req: AuthenticatedRequest) {
    return this.authService.findById(req.user.id);
  }
}
