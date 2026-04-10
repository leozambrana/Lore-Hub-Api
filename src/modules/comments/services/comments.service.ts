import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';
import { CreateCommentDto } from '../dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByTheory(theoryId: string, page: number = 1, limit: number = 20) {
    const theory = await this.prisma.theory.findUnique({
      where: { id: theoryId },
    });
    if (!theory) throw new NotFoundException('Teoria não encontrada.');

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { theoryId, parentId: null }, // apenas comentários raiz
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, username: true, avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.comment.count({ where: { theoryId, parentId: null } }),
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

  async create(theoryId: string, userId: string, dto: CreateCommentDto) {
    const theory = await this.prisma.theory.findUnique({
      where: { id: theoryId },
    });
    if (!theory) throw new NotFoundException('Teoria não encontrada.');

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent || parent.theoryId !== theoryId) {
        throw new NotFoundException(
          'Comentário pai não encontrado nesta teoria.',
        );
      }
    }

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        theoryId,
        userId,
        parentId: dto.parentId ?? null,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  async remove(commentId: string, userId: string, userRole: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comentário não encontrado.');

    if (comment.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Você não tem permissão para deletar este comentário.',
      );
    }

    return this.prisma.comment.delete({ where: { id: commentId } });
  }
}
