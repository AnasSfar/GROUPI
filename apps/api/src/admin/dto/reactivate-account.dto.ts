import { IsOptional, IsString } from 'class-validator';

export class ReactivateAccountDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
