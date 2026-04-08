import { PartialType } from '@nestjs/mapped-types';
import { CreateTheoryDto } from './create-theory.dto';

export class UpdateTheoryDto extends PartialType(CreateTheoryDto) {}
