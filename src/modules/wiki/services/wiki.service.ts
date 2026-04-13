import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateWikiItemDto, UpdateWikiItemDto } from '../dto';
import { WikiCategory } from '@prisma/client';

@Injectable()
export class WikiService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateWikiItemDto) {
    return await this.prisma.wikiItem.create({
      data,
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 12,
    gameId?: string,
    category?: WikiCategory,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      ...(gameId && { gameId }),
      ...(category && { category }),
    };

    const [data, total] = await Promise.all([
      this.prisma.wikiItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          game: { select: { title: true } },
        },
      }),
      this.prisma.wikiItem.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.wikiItem.findUnique({
      where: { id },
      include: {
        game: true,
        theories: {
          include: {
            theory: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Item da Wiki com ID ${id} não encontrado.`);
    }

    return item;
  }

  async update(id: string, data: UpdateWikiItemDto) {
    await this.findOne(id);
    return await this.prisma.wikiItem.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return await this.prisma.wikiItem.delete({
      where: { id },
    });
  }
}
