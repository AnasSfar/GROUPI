import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

/** RM-REF-011 : renommage / activation-désactivation d'un niveau scolaire — jamais de suppression
 * physique (RM-REF-007/008), seul `isActive` bascule. */
export class UpdateSchoolLevelDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
