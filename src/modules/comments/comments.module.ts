import { Module } from '@nestjs/common';
import { CommentsController } from './controllers';
import { CommentsService } from './services';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
