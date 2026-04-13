import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  MinLength,
} from 'class-validator';
import { WikiCategory } from '@prisma/client';

export class CreateWikiItemDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsEnum(WikiCategory, {
    message:
      'Categoria inválida. Use: CHARACTER, ITEM, LOCATION, EVENT ou OTHER',
  })
  category: WikiCategory;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsUUID()
  gameId: string;
}
