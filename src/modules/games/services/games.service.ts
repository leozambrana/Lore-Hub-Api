import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateGameDto, UpdateGameDto } from '../dto';
import { SupabaseService } from '../../supabase/supabase.service';

import { GameMapper } from '../mappers/game.mapper';

@Injectable()
export class GamesService {
  private readonly ALLOWED_DOMAIN =
    process.env.PUBLIC_SUPABASE_URL ||
    'https://ntfcwkqquybdqqyvumql.supabase.co';

  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) {}

  private validateImageUrl(url?: string) {
    if (url && !url.startsWith(this.ALLOWED_DOMAIN)) {
      throw new BadRequestException(
        'URL de imagem não permitida. Use o domínio oficial do Supabase LoreHub.',
      );
    }
  }

  async findAll(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const whereCondition: any = { status: 'APPROVED' };
    if (search) {
      whereCondition.title = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.game.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { theories: true },
          },
        },
      }),
      this.prisma.game.count({ where: whereCondition }),
    ]);

    const lastPage = Math.ceil(total / limit) || 1;

    return {
      data: GameMapper.toHttpArray(data),
      meta: {
        total,
        page,
        lastPage,
      },
    };
  }

  async findPending() {
    const data = await this.prisma.game.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
    return GameMapper.toHttpArray(data);
  }

  async findOneBySlug(slug: string) {
    const game = await this.prisma.game.findUnique({
      where: { slug },
      include: { theories: true },
    });
    return GameMapper.toHttp(game);
  }

  async approve(id: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('Franquia não encontrada.');

    const updated = await this.prisma.game.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
    return GameMapper.toHttp(updated);
  }

  async create(data: CreateGameDto) {
    this.validateImageUrl(data.imageUrl);
    const created = await this.prisma.game.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });
    return GameMapper.toHttp(created);
  }

  async update(id: string, data: UpdateGameDto) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('Franquia não encontrada.');

    if (data.imageUrl) {
      this.validateImageUrl(data.imageUrl);
    }

    const updated = await this.prisma.game.update({
      where: { id },
      data,
    });
    return GameMapper.toHttp(updated);
  }

  async remove(id: string) {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: { _count: { select: { theories: true } } },
    });

    if (!game) throw new NotFoundException('Franquia não encontrada.');

    if (game._count.theories > 0) {
      throw new BadRequestException(
        'Não é possível excluir uma franquia que possui teorias vinculadas. Remova as teorias primeiro.',
      );
    }

    // Armazenamos a URL antes da exclusão do registro
    const imageUrl = game.imageUrl;

    // Primeiro: Excluímos o registro no Banco de Dados
    const deletedGame = await this.prisma.game.delete({
      where: { id },
    });
    console.log('imageUrl', imageUrl);
    // Segundo: Após o sucesso no BD, limpamos o Storage (Background)
    if (imageUrl) {
      // Usamos o serviço global do Supabase para limpar o bucket
      await this.supabaseService.deleteFile('game-images', imageUrl);
    }

    return GameMapper.toHttp(deletedGame);
  }
}
