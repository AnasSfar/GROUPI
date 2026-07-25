import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTeachingLocationDto {
  @IsString()
  @MinLength(1)
  label!: string;

  @IsOptional()
  @IsString()
  address?: string;
}
