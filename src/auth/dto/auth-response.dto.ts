import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: 'ca2b8578-3eef-439b-b8d7-8767c8cf2ccb' })
  id: string;

  @ApiProperty({ example: 'anna@mail.com' })
  email: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserDto })
  user: UserDto;
}
