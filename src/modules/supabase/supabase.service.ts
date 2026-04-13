import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor() {
    this.supabase = createClient(
      process.env.PUBLIC_SUPABASE_URL ||
        'https://ntfcwkqquybdqqyvumql.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || '',
    );
  }

  async uploadFile(bucket: string, file: Express.Multer.File): Promise<string> {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      this.logger.error(
        `Erro ao subir arquivo para ${bucket}: ${error.message}`,
      );
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  async deleteFile(bucket: string, url: string) {
    if (!url) return;

    try {
      // Extrai o nome do arquivo da URL pública
      const parts = url.split('/');
      const fileName = parts.pop();
      console.log('parts and filename', parts, fileName);
      if (fileName) {
        console.log('storage', await this.supabase.storage.getBucket(bucket));
        const { error } = await this.supabase.storage
          .from(bucket)
          .remove([fileName]);

        console.log('error', error);

        if (error) {
          this.logger.error(
            `Erro ao deletar arquivo ${fileName} do bucket ${bucket}: ${error.message}`,
          );
        } else {
          this.logger.log(
            `Arquivo ${fileName} excluído com sucesso do bucket ${bucket}.`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        'Falha ao processar deleção de imagem no Supabase.',
        error,
      );
    }
  }
}
