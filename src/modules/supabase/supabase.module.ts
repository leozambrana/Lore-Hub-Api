import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { StorageProvider } from './storage.provider';

@Global()
@Module({
  providers: [SupabaseService, StorageProvider],
  exports: [SupabaseService, StorageProvider],
})
export class SupabaseModule {}
