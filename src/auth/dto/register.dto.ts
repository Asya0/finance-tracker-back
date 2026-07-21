import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'anna@mail.com', description: 'Email пользователя' })
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @ApiProperty({
    example: 'secret123',
    minLength: 6,
    description: 'Пароль, минимум 6 символов',
  })
  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не короче 6 символов' })
  password: string;
}
