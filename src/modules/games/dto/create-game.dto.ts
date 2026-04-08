import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateGameDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
    host_whitelist: ['ntfcwkqquybdqqyvumql.supabase.co'],
  })
  @IsOptional()
  imageUrl?: string;
}
