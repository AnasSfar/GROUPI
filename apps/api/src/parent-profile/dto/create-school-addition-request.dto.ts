import { SchoolType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateSchoolAdditionRequestDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(SchoolType)
  type!: SchoolType;

  @IsUUID()
  cityId!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}