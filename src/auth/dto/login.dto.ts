import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'anna@mail.com', description: 'Email пользователя' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @ApiProperty({ example: 'secret123', description: 'Пароль' })
  @IsString()
  password: string;
}
