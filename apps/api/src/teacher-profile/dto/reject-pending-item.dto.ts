import { IsString, MinLength } from 'class-validator';

export class RejectPendingItemDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}
