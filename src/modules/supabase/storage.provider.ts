import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extname } from 'path';

@Injectable()
export class StorageProvider {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(StorageProvider.name);

  constructor() {
    this.supabase = createClient(
      process.env.PUBLIC_SUPABASE_URL ||
        'https://ntfcwkqquybdqqyvumql.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || '',
    );
  }

  private getExtension(mimetype: string, originalName: string): string {
    const ext = extname(originalName).toLowerCase();
    if (ext) return ext;

    // Fallback based on common mimetypes
    const mimeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
    };
    return mimeMap[mimetype] || '.bin';
  }

  private async deleteFolderContents(bucket: string, prefix: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(prefix);
    if (error) return;
    if (data && data.length > 0) {
      const filesToRemove = data.map((x) => `${prefix}/${x.name}`);
      await this.supabase.storage.from(bucket).remove(filesToRemove);
    }
  }

  private async upload(
    bucket: string,
    path: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const folder = path.substring(0, path.lastIndexOf('/'));
    const baseName = path.split('/').pop()?.split('.')[0];

    if (folder && baseName) {
      const { data: existingFiles } = await this.supabase.storage
        .from(bucket)
        .list(folder);
      if (existingFiles) {
        const toDelete = existingFiles
          .filter((f) => f.name.split('.')[0] === baseName)
          .map((f) => `${folder}/${f.name}`);
        if (toDelete.length > 0) {
          await this.supabase.storage.from(bucket).remove(toDelete);
        }
      }
    } else if (baseName) {
      // Arquivo no root do bucket
      const { data: existingFiles } = await this.supabase.storage
        .from(bucket)
        .list();
      if (existingFiles) {
        const toDelete = existingFiles
          .filter((f) => f.name.split('.')[0] === baseName)
          .map((f) => f.name);
        if (toDelete.length > 0) {
          await this.supabase.storage.from(bucket).remove(toDelete);
        }
      }
    }

    // 2. Upload
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      this.logger.error(
        `Erro no upload para ${bucket}/${path}: ${error.message}`,
      );
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  async uploadWikiImage(
    itemId: string,
    category: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = this.getExtension(file.mimetype, file.originalname);
    const path = `${category.toLowerCase()}/${itemId}${ext}`;
    return this.upload('wiki', path, file);
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = this.getExtension(file.mimetype, file.originalname);
    const path = `${userId}/profile${ext}`;
    return this.upload('avatars', path, file);
  }

  async uploadGameCover(
    gameSlug: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = this.getExtension(file.mimetype, file.originalname);
    const path = `covers/${gameSlug}${ext}`;
    return this.upload('game', path, file);
  }

  async uploadTheoryAttachment(
    theoryId: string,
    fileId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const ext = this.getExtension(file.mimetype, file.originalname);
    const path = `${theoryId}/attachments/${fileId}${ext}`;
    return this.upload('theories', path, file);
  }

  async deleteFileByUrl(bucket: string, url: string) {
    if (!url) return;
    try {
      const bucketMarker = `/public/${bucket}/`;
      const bucketIndex = url.indexOf(bucketMarker);
      if (bucketIndex !== -1) {
        const filePath = url.substring(bucketIndex + bucketMarker.length);
        await this.supabase.storage.from(bucket).remove([filePath]);
      }
    } catch {
      this.logger.error(`Falha ao deletar arquivo via URL: ${url}`);
    }
  }
}
