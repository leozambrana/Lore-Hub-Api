import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
    host_whitelist: ['ntfcwkqquybdqqyvumql.supabase.co'],
  })
  @IsOptional()
  avatarUrl?: string;
}
