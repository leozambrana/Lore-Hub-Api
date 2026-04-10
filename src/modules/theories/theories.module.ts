import { Module } from '@nestjs/common';
import { TheoriesController } from './controllers';
import { TheoriesService } from './services';
import { VotesModule } from '../votes/votes.module';

@Module({
  imports: [VotesModule],
  controllers: [TheoriesController],
  providers: [TheoriesService],
})
export class TheoriesModule {}
