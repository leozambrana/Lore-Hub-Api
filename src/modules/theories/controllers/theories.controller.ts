import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
  Request,
} from '@nestjs/common';
import { TheoriesService } from '../services';
import { CreateTheoryDto, UpdateTheoryDto } from '../dto';
import { SupabaseAuthGuard } from '../../auth/guards';
import { VotesService } from '../../votes/services/votes.service';

@Controller('theories')
export class TheoriesController {
  constructor(
    private readonly theoriesService: TheoriesService,
    private readonly votesService: VotesService,
  ) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(@Body() createTheoryDto: CreateTheoryDto, @Req() req: any) {
    // req.user exists because of SupabaseAuthGuard
    return this.theoriesService.create(createTheoryDto, req.user.id);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('gameId') gameId?: string,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
  ) {
    return this.theoriesService.findAll(page, limit, gameId, sort, search);
  }

  @Get('system-stats')
  getSystemStats() {
    return this.theoriesService.getSystemStats();
  }

  // Rotas estáticas ANTES de ':id' para evitar conflito de parâmetro
  @Get('my-votes')
  @UseGuards(SupabaseAuthGuard)
  async getMyVotesBatch(
    @Query('ids') ids: string,
    @Request() req: any,
  ): Promise<Record<string, 'UP' | 'DOWN' | null>> {
    const theoryIds = ids ? ids.split(',').filter(Boolean) : [];
    return this.votesService.getMyVotesBatch(theoryIds, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.theoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateTheoryDto: UpdateTheoryDto,
    @Req() req: any,
  ) {
    return this.theoriesService.update(
      id,
      updateTheoryDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.theoriesService.remove(id, req.user.id, req.user.role);
  }
}
