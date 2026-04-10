import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) {}

  async toggleVote(theoryId: string, userId: string, type: 'UP' | 'DOWN') {
    const theory = await this.prisma.theory.findUnique({
      where: { id: theoryId },
    });
    if (!theory) throw new NotFoundException('Teoria não encontrada.');

    const existingVote = await this.prisma.vote.findUnique({
      where: { userId_theoryId: { userId, theoryId } },
    });

    // A trigger no banco cuidará de atualizar a coluna 'upvotes' da tabela 'Theory'
    if (existingVote) {
      if (existingVote.type === type) {
        // Mesmo voto: Remove (Toggle)
        await this.prisma.vote.delete({ where: { id: existingVote.id } });
        return { status: 'REMOVED', type: null };
      } else {
        // Voto diferente: Atualiza
        await this.prisma.vote.update({
          where: { id: existingVote.id },
          data: { type },
        });
        return { status: 'UPDATED', type };
      }
    } else {
      // Sem voto: Cria novo
      await this.prisma.vote.create({
        data: { type, userId, theoryId },
      });
      return { status: 'CREATED', type };
    }
  }

  async getMyVote(theoryId: string, userId: string) {
    const vote = await this.prisma.vote.findUnique({
      where: { userId_theoryId: { userId, theoryId } },
    });
    return vote;
  }

  /**
   * Busca os votos do usuário para múltiplas teorias em uma única query.
   * Retorna um mapa: { [theoryId]: 'UP' | 'DOWN' }
   * Teorias sem voto não aparecem no mapa (ausência = null).
   */
  async getMyVotesBatch(
    theoryIds: string[],
    userId: string,
  ): Promise<Record<string, 'UP' | 'DOWN'>> {
    if (theoryIds.length === 0) return {};

    const votes = await this.prisma.vote.findMany({
      where: {
        userId,
        theoryId: { in: theoryIds },
      },
      select: {
        theoryId: true,
        type: true,
      },
    });

    return votes.reduce(
      (acc, vote) => {
        acc[vote.theoryId] = vote.type as 'UP' | 'DOWN';
        return acc;
      },
      {} as Record<string, 'UP' | 'DOWN'>,
    );
  }
}
