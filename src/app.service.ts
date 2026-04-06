import { Injectable } from '@nestjs/common';
import { PrismaService } from './modules/prisma';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getHello() {
    const usersCount = await this.prisma.user.count();
    return `Hello! We have ${usersCount} users in the database.`;
  }
}
