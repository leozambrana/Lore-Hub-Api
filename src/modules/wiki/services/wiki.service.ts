import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateWikiItemDto, UpdateWikiItemDto } from '../dto';
import { WikiCategory, UserRole } from '@prisma/client';
import { StorageProvider } from '../../supabase/storage.provider';

@Injectable()
export class WikiService {
  constructor(
    private prisma: PrismaService,
    private storageProvider: StorageProvider,
  ) {}

  async create(data: CreateWikiItemDto, userId: string) {
    return await this.prisma.wikiItem.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async uploadImage(id: string, userId: string, file: Express.Multer.File) {
    const item = await this.findOne(id);

    // Verifica permissão (apenas dono ou admin)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === UserRole.ADMIN;

    if (item.userId !== userId && !isAdmin) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar este item.',
      );
    }

    const imageUrl = await this.storageProvider.uploadWikiImage(
      item.id,
      item.category,
      file,
    );

    return await this.prisma.wikiItem.update({
      where: { id: item.id },
      data: { imageUrl },
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 12,
    gameId?: string,
    category?: WikiCategory,
    search?: string,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      ...(gameId && { gameId }),
      ...(category && { category }),
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.wikiItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          game: { select: { title: true } },
          user: { select: { username: true, id: true } },
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
        user: { select: { username: true, id: true } },
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

  async update(id: string, data: UpdateWikiItemDto, userId: string) {
    const item = await this.findOne(id);

    // Proteção: Apenas dono ou Admin
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const isAdmin = userData?.role === UserRole.ADMIN;

    if (item.userId && item.userId !== userId && !isAdmin) {
      throw new ForbiddenException(
        'Você não tem permissão para editar este item.',
      );
    }

    if (data.imageUrl && item.imageUrl && data.imageUrl !== item.imageUrl) {
      await this.storageProvider.deleteFileByUrl('wiki', item.imageUrl);
    }

    return await this.prisma.wikiItem.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const item = await this.findOne(id);

    // Proteção: Apenas dono ou Admin
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const isAdmin = userData?.role === UserRole.ADMIN;

    if (item.userId && item.userId !== userId && !isAdmin) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este item.',
      );
    }

    if (item.imageUrl) {
      await this.storageProvider.deleteFileByUrl('wiki', item.imageUrl);
    }

    return await this.prisma.wikiItem.delete({
      where: { id },
    });
  }
}
