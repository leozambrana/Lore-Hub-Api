import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users';
import { JwtStrategy } from './strategies';

@Module({
  imports: [PassportModule, UsersModule],
  providers: [JwtStrategy],
  exports: [JwtStrategy],
})
export class AuthModule {}
