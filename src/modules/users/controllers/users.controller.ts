import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../auth/guards';

@Controller('users')
export class UsersController {
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getMe(@Req() req: any) {
    return req.user;
  }
}
