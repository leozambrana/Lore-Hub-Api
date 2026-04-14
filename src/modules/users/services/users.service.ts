import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { UpdateUserDto } from '../dto';
import { StorageProvider } from 'src/modules/supabase/storage.provider';

@Injectable()
export class UsersService {
  private readonly ALLOWED_DOMAIN =
    process.env.PUBLIC_SUPABASE_URL ||
    'https://ntfcwkqquybdqqyvumql.supabase.co';

  constructor(
    private prisma: PrismaService,
    private storageProvider: StorageProvider,
  ) {}

  private validateAvatarUrl(url?: string) {
    if (url && !url.startsWith(this.ALLOWED_DOMAIN)) {
      throw new BadRequestException(
        'URL de avatar não permitida. Use o domínio oficial do Supabase LoreHub.',
      );
    }
  }

  async getOrCreateProfile(supabaseUser: { sub: string; email: string }) {
    return await this.prisma.user.upsert({
      where: { id: supabaseUser.sub },
      update: {},
      create: {
        id: supabaseUser.sub,
        email: supabaseUser.email,
        username:
          supabaseUser.email.split('@')[0] + Math.floor(Math.random() * 1000),
      },
    });
  }

  async updateProfile(userId: string, data: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (data.avatarUrl) {
      this.validateAvatarUrl(data.avatarUrl);

      // Se o avatar mudou, limpamos o antigo via StorageProvider
      if (user?.avatarUrl && user.avatarUrl !== data.avatarUrl) {
        await this.storageProvider.deleteFileByUrl('avatars', user.avatarUrl);
      }
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    // 1. O StorageProvider já cuida da limpeza e nomenclatura {userId}/profile.{ext}
    const avatarUrl = await this.storageProvider.uploadAvatar(userId, file);

    // 2. Atualizar no banco
    return await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
  }
}
