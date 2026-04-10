import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentsService } from '../services';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { SupabaseAuthGuard } from '../../auth/guards';

@Controller('theories/:theoryId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // GET /theories/:theoryId/comments — lista comentários paginados
  @Get()
  findAll(
    @Param('theoryId') theoryId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.commentsService.findByTheory(theoryId, page, limit);
  }

  // POST /theories/:theoryId/comments — cria comentário (ou reply via parentId)
  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(
    @Param('theoryId') theoryId: string,
    @Body() dto: CreateCommentDto,
    @Request() req: any,
  ) {
    return this.commentsService.create(theoryId, req.user.id, dto);
  }

  // DELETE /theories/:theoryId/comments/:commentId — remove comentário
  @Delete(':commentId')
  @UseGuards(SupabaseAuthGuard)
  remove(@Param('commentId') commentId: string, @Request() req: any) {
    return this.commentsService.remove(commentId, req.user.id, req.user.role);
  }
}

