import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateParentProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  city?: string;
}
