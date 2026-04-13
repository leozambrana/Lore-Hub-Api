import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateTheoryDto, UpdateTheoryDto } from '../dto';
import { ScraperService } from '../../scraper/scraper.service';

@Injectable()
export class TheoriesService {
  constructor(
    private prisma: PrismaService,
    private scraperService: ScraperService,
  ) {}

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

    // Enriquece com metadados da wiki se URL fornecida
    let wikiMetadata = createTheoryDto.wikiMetadata ?? undefined;
    if (createTheoryDto.wikiUrl) {
      wikiMetadata = (await this.scraperService.scrapeUrl(
        createTheoryDto.wikiUrl,
      )) as any;
    }

    return this.prisma.theory.create({
      data: {
        title: createTheoryDto.title,
        content: createTheoryDto.content,
        wikiUrl: createTheoryDto.wikiUrl,
        wikiMetadata,
        gameId: createTheoryDto.gameId,
        userId,
        wikiReferences: {
          create: createTheoryDto.wikiItemIds?.map((id) => ({
            wikiItem: { connect: { id } },
          })),
        },
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

  async findAll(
    page: number = 1,
    limit: number = 10,
    gameId?: string,
    sort: string = 'recent',
    search: string = '',
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (gameId) where.gameId = gameId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') {
      orderBy = { upvotes: 'desc' };
    } else if (sort === 'discussed') {
      orderBy = { comments: { _count: 'desc' } };
    }

    const [data, total] = await Promise.all([
      this.prisma.theory.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          game: { select: { id: true, title: true, slug: true } },
          wikiReferences: {
            include: {
              wikiItem: true,
            },
          },
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
        wikiReferences: {
          include: {
            wikiItem: true,
          },
        },
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

    // Se a wikiUrl mudou ou é nova, dispara o scraper
    let wikiMetadata = updateTheoryDto.wikiMetadata ?? undefined;
    if (updateTheoryDto.wikiUrl && updateTheoryDto.wikiUrl !== theory.wikiUrl) {
      wikiMetadata = (await this.scraperService.scrapeUrl(
        updateTheoryDto.wikiUrl,
      )) as any;
    }

    // Excluir gameId se não quiser transferir entre jogos, mas aqui permitimos.
    return this.prisma.theory.update({
      where: { id },
      data: {
        title: updateTheoryDto.title,
        content: updateTheoryDto.content,
        wikiUrl: updateTheoryDto.wikiUrl,
        wikiMetadata,
        gameId: updateTheoryDto.gameId,
        wikiReferences: updateTheoryDto.wikiItemIds
          ? {
              deleteMany: {},
              create: updateTheoryDto.wikiItemIds.map((id) => ({
                wikiItem: { connect: { id } },
              })),
            }
          : undefined,
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

  async getSystemStats() {
    const totalTheories = await this.prisma.theory.count();
    const totalGames = await this.prisma.game.count();

    const topTheorists = await this.prisma.user.findMany({
      take: 5,
      where: { theories: { some: {} } },
      orderBy: {
        theories: { _count: 'desc' },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        _count: { select: { theories: true, votes: true } },
      },
    });

    return { totalTheories, totalGames, topTheorists };
  }
}
