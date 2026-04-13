import { PartialType } from '@nestjs/mapped-types';
import { CreateWikiItemDto } from './create-wiki-item.dto';

export class UpdateWikiItemDto extends PartialType(CreateWikiItemDto) {}
