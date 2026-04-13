import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { UpdateUserDto } from '../dto';
import { SupabaseService } from 'src/modules/supabase/supabase.service';

@Injectable()
export class UsersService {
  private readonly ALLOWED_DOMAIN =
    process.env.PUBLIC_SUPABASE_URL ||
    'https://ntfcwkqquybdqqyvumql.supabase.co';

  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
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
    if (data.avatarUrl) {
      this.validateAvatarUrl(data.avatarUrl);
    }
    return await this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    // 1. Buscar usuário atual para deletar avatar antigo se existir
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // 2. Fazer upload do novo avatar
    const avatarUrl = await this.supabase.uploadFile('avatars', file);

    // 3. Deletar avatar antigo se for do supabase (evitar lixo)
    if (user?.avatarUrl) {
      await this.supabase.deleteFile('avatars', user.avatarUrl);
    }

    // 4. Atualizar no banco
    return await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
  }
}
