import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { UsersService } from '../../users/services';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri:
          process.env.SUPABASE_JWKS_URL ||
          'https://ntfcwkqquybdqqyvumql.supabase.co/auth/v1/.well-known/jwks.json',
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer: 'https://ntfcwkqquybdqqyvumql.supabase.co/auth/v1',
      algorithms: ['ES256'],
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.getOrCreateProfile({
      sub: payload.sub,
      email: payload.email,
    });
    return user;
  }
}
