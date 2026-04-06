import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';

@Injectable()
export class TheoriesService {
  constructor(private prisma: PrismaService) {}
}
