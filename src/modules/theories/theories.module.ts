import { Module } from '@nestjs/common';
import { TheoriesController } from './controllers';
import { TheoriesService } from './services';

@Module({
  controllers: [TheoriesController],
  providers: [TheoriesService],
})
export class TheoriesModule {}
