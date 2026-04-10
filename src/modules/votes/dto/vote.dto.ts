import { IsEnum, IsNotEmpty } from 'class-validator';

export class ToggleVoteDto {
  @IsNotEmpty()
  @IsEnum(['UP', 'DOWN'])
  type: 'UP' | 'DOWN';
}
