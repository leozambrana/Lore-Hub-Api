import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { GamesModule } from './modules/games';
import { TheoriesModule } from './modules/theories';
import { CommentsModule } from './modules/comments';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { VotesModule } from './modules/votes/votes.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    GamesModule,
    TheoriesModule,
    CommentsModule,
    SupabaseModule,
    VotesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
