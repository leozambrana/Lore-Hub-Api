import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import { SupabaseAuthGuard, RolesGuard } from '../../auth/guards';

import { GamesService } from '../services';
import { CreateGameDto, UpdateGameDto } from '../dto';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(@Body() createGameDto: CreateGameDto) {
    return this.gamesService.create(createGameDto);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return await this.gamesService.findAll(page, limit);
  }

  @Get('review/pending')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findPending() {
    return this.gamesService.findPending();
  }

  @Get(':slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.gamesService.findOneBySlug(slug);
  }

  @Patch(':id/approve')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('ADMIN')
  approve(@Param('id') id: string) {
    return this.gamesService.approve(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto) {
    return this.gamesService.update(id, updateGameDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.gamesService.remove(id);
  }
}
