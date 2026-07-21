import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { LoginController } from './login.controller';
import { RegistrationController } from './registration.controller';
import { SessionController } from './session.controller';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule.register({})],
  controllers: [RegistrationController, LoginController, SessionController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
