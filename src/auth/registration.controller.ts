import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { setAuthCookies } from './auth.cookies';

@ApiTags('Авторизация')
@Controller('auth')
export class RegistrationController {
  constructor(private readonly authService: AuthService) {}

  @Post('registration')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Регистрация',
    description:
      'Создаёт пользователя и сразу выдаёт сессию: ставит куки accessToken и refreshToken.',
  })
  @ApiResponse({ status: 201, description: 'Пользователь создан', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Некорректный email или короткий пароль' })
  @ApiResponse({ status: 409, description: 'Email уже занят' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, user } = await this.authService.register(dto);
    setAuthCookies(res, tokens);
    return { user };
  }
}
