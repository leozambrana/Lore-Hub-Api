import { Module } from '@nestjs/common';
import { WikiService } from './services';
import { WikiController } from './controllers';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  controllers: [WikiController],
  providers: [WikiService],
  exports: [WikiService],
})
export class WikiModule {}
