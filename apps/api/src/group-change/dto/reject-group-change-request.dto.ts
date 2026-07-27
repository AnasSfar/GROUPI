import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectGroupChangeRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
