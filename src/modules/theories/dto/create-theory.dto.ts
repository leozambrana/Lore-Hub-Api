import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsOptional,
  IsObject,
  ValidateIf,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateTheoryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @ValidateIf((o) => o.wikiUrl !== '')
  @IsString()
  @IsUrl()
  wikiUrl?: string;

  @IsOptional()
  @IsObject()
  wikiMetadata?: any;

  @IsString()
  @IsNotEmpty()
  gameId: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  wikiItemIds?: string[];
}
