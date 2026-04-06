import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SupabaseAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      console.error('AuthGuard Error:', info?.message || 'User not found');
      throw err || new UnauthorizedException('Token inválido ou ausente');
    }
    return user;
  }
}
