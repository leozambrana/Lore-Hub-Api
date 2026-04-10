import { Game } from '@prisma/client';

type GameWithRelations = Game & {
  _count?: { theories: number };
  theories?: any[];
};

export const GameMapper = {
  toHttp: (game: GameWithRelations | null) => {
    if (!game) return null;

    return {
      id: game.id,
      title: game.title,
      slug: game.slug,
      imageUrl: game.imageUrl,
      status: game.status,
      createdAt: game.createdAt,
      stats: {
        theories: game._count?.theories || 0,
      },
      // Se theories vierem preenchidas (como no findBySlug), também mapeamos
      ...(game.theories && { theories: game.theories }),
    };
  },

  toHttpArray: (games: GameWithRelations[]) => {
    return games.map(GameMapper.toHttp);
  },
};
