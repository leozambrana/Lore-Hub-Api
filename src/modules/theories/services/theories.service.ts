import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateTheoryDto, UpdateTheoryDto } from '../dto';

@Injectable()
export class TheoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createTheoryDto: CreateTheoryDto, userId: string) {
    // Verificar se o game existe
    const gameExists = await this.prisma.game.findUnique({
      where: { id: createTheoryDto.gameId },
    });
    if (!gameExists) {
      throw new NotFoundException(
        'Jogo vinculado a esta teoria não foi encontrado.',
      );
    }

    return this.prisma.theory.create({
      data: {
        title: createTheoryDto.title,
        content: createTheoryDto.content,
        wikiUrl: createTheoryDto.wikiUrl,
        wikiMetadata: createTheoryDto.wikiMetadata ?? undefined,
        gameId: createTheoryDto.gameId,
        userId,
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
        game: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 10, gameId?: string) {
    const skip = (page - 1) * limit;

    // Se gameId for fornecido, filtra; caso contrário envia tudo
    const where = gameId ? { gameId } : {};

    const [data, total] = await Promise.all([
      this.prisma.theory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          game: { select: { id: true, title: true, slug: true } },
          _count: { select: { comments: true, votes: true } },
        },
      }),
      this.prisma.theory.count({ where }),
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
    const theory = await this.prisma.theory.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        game: { select: { id: true, title: true, slug: true, imageUrl: true } },
        _count: { select: { comments: true, votes: true } },
      },
    });

    if (!theory) {
      throw new NotFoundException('Teoria não encontrada.');
    }

    return theory;
  }

  async update(
    id: string,
    updateTheoryDto: UpdateTheoryDto,
    userId: string,
    userRole: string,
  ) {
    const theory = await this.findOne(id);

    if (theory.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para editar esta teoria.',
      );
    }

    if (updateTheoryDto.gameId && updateTheoryDto.gameId !== theory.gameId) {
      const gameExists = await this.prisma.game.findUnique({
        where: { id: updateTheoryDto.gameId },
      });
      if (!gameExists) {
        throw new NotFoundException('Novo jogo da teoria não encontrado.');
      }
    }

    // Excluir gameId se não quiser transferir entre jogos, mas aqui permitimos.
    return this.prisma.theory.update({
      where: { id },
      data: {
        title: updateTheoryDto.title,
        content: updateTheoryDto.content,
        wikiUrl: updateTheoryDto.wikiUrl,
        wikiMetadata: updateTheoryDto.wikiMetadata ?? undefined,
        gameId: updateTheoryDto.gameId,
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const theory = await this.findOne(id);

    if (userRole !== 'ADMIN') {
      if (theory.userId !== userId) {
        throw new ForbiddenException(
          'Você não tem permissão para deletar esta teoria.',
        );
      }

      const hasEngagement =
        (theory._count?.comments ?? 0) > 0 || (theory._count?.votes ?? 0) > 0;
      if (hasEngagement) {
        throw new BadRequestException(
          'Atenção: Esta teoria já possui comentários e/ou votações. Para retirá-la, contate um administrador.',
        );
      }
    }

    return this.prisma.theory.delete({
      where: { id },
    });
  }
}
