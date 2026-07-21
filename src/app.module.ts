import { existsSync, mkdirSync } from 'node:fs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './users/user.entity';

const DATA_DIR = 'data';
const SQLITE_FILE = `${DATA_DIR}/app.db`;

function databaseOptions(): TypeOrmModuleOptions {
  const shared = {
    entities: [User],
    synchronize: true,
  };

  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      ...shared,
    };
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  return {
    type: 'sqljs',
    location: SQLITE_FILE,
    autoSave: true,
    ...shared,
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseOptions()),
    AuthModule,
  ],
})
export class AppModule {}
