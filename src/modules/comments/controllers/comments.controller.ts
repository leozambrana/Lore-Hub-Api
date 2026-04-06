import { Controller } from '@nestjs/common';
import { CommentsService } from '../services';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}
}
