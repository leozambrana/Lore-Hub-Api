import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WikiService } from '../services';
import { CreateWikiItemDto, UpdateWikiItemDto } from '../dto';
import { WikiCategory } from '@prisma/client';
import { SupabaseAuthGuard } from '../../auth/guards';

@Controller('wiki')
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(@Body() createWikiItemDto: CreateWikiItemDto) {
    return this.wikiService.create(createWikiItemDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('gameId') gameId?: string,
    @Query('category') category?: WikiCategory,
  ) {
    return this.wikiService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 12,
      gameId,
      category,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wikiService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SupabaseAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateWikiItemDto: UpdateWikiItemDto,
  ) {
    return this.wikiService.update(id, updateWikiItemDto);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  remove(@Param('id') id: string) {
    return this.wikiService.remove(id);
  }
}
