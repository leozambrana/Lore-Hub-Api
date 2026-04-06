import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { GamesModule } from './modules/games';
import { TheoriesModule } from './modules/theories';
import { CommentsModule } from './modules/comments';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    GamesModule,
    TheoriesModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
