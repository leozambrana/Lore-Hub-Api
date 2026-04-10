import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VotesService } from '../services/votes.service';
import { ToggleVoteDto } from '../dto/vote.dto';
import { SupabaseAuthGuard } from '../../auth/guards';

@Controller('theories')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  // POST /theories/:theoryId/votes — cria/atualiza/remove voto
  @Post(':theoryId/votes')
  @UseGuards(SupabaseAuthGuard)
  async toggleVote(
    @Param('theoryId') theoryId: string,
    @Body() dto: ToggleVoteDto,
    @Request() req: any,
  ) {
    return this.votesService.toggleVote(theoryId, req.user.id, dto.type);
  }

  // GET /theories/:theoryId/votes/me — voto do usuário em UMA teoria
  @Get(':theoryId/votes/me')
  @UseGuards(SupabaseAuthGuard)
  async getMyVote(@Param('theoryId') theoryId: string, @Request() req: any) {
    const vote = await this.votesService.getMyVote(theoryId, req.user.id);
    return { type: vote?.type || null };
  }
}
