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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { WikiService } from '../services';
import { CreateWikiItemDto, UpdateWikiItemDto } from '../dto';
import { WikiCategory } from '@prisma/client';
import { SupabaseAuthGuard } from '../../auth/guards';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../../auth/decorators/get-user.decorator';

@Controller('wiki')
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(
    @Body() createWikiItemDto: CreateWikiItemDto,
    @GetUser('id') userId: string,
  ) {
    return this.wikiService.create(createWikiItemDto, userId);
  }

  @Post(':id/image')
  @UseGuards(SupabaseAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser('id') userId: string,
  ) {
    return this.wikiService.uploadImage(id, userId, file);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('gameId') gameId?: string,
    @Query('category') category?: WikiCategory,
    @Query('search') search?: string,
  ) {
    return this.wikiService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 12,
      gameId,
      category,
      search,
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
    @GetUser('id') userId: string,
  ) {
    return this.wikiService.update(id, updateWikiItemDto, userId);
  }

  @Delete(':id')
  @UseGuards(SupabaseAuthGuard)
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.wikiService.remove(id, userId);
  }
}
