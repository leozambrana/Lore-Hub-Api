import { Module } from '@nestjs/common';
import { GamesController } from './controllers';
import { GamesService } from './services';

@Module({
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
