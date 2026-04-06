import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateProfile(supabaseUser: { sub: string; email: string }) {
    return await this.prisma.user.upsert({
      where: { id: supabaseUser.sub },
      update: {},
      create: {
        id: supabaseUser.sub,
        email: supabaseUser.email,
        username:
          supabaseUser.email.split('@')[0] + Math.floor(Math.random() * 1000),
      },
    });
  }
}
