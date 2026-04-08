import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateGameDto, UpdateGameDto } from '../dto';
import { SupabaseService } from '../../supabase/supabase.service';

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

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.game.findMany({
        where: { status: 'APPROVED' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.game.count({ where: { status: 'APPROVED' } }),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        lastPage,
      },
    };
  }

  async findPending() {
    return await this.prisma.game.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneBySlug(slug: string) {
    return await this.prisma.game.findUnique({
      where: { slug },
      include: { theories: true },
    });
  }

  async approve(id: string) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('Franquia não encontrada.');

    return await this.prisma.game.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async create(data: CreateGameDto) {
    this.validateImageUrl(data.imageUrl);
    return await this.prisma.game.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });
  }

  async update(id: string, data: UpdateGameDto) {
    const game = await this.prisma.game.findUnique({ where: { id } });
    if (!game) throw new NotFoundException('Franquia não encontrada.');

    if (data.imageUrl) {
      this.validateImageUrl(data.imageUrl);
    }

    return await this.prisma.game.update({
      where: { id },
      data,
    });
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

    return deletedGame;
  }
}
