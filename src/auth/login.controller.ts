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
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { setAuthCookies } from './auth.cookies';

@ApiTags('Авторизация')
@Controller('auth')
export class LoginController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Вход',
    description: 'Проверяет пароль и ставит куки accessToken и refreshToken.',
  })
  @ApiResponse({ status: 200, description: 'Вход выполнен', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Неверный email или пароль' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens, user } = await this.authService.login(dto);
    setAuthCookies(res, tokens);
    return { user };
  }
}
