import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseAuthGuard } from '../../auth/guards';
import { UsersService } from '../services';
import { UpdateUserDto } from '../dto';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return req.user;
  }

  @Patch('me')
  updateProfile(@Req() req: any, @Body() data: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.id, data);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadAvatar(req.user.id, file);
  }
}
