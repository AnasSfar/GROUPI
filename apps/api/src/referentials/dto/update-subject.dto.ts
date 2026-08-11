import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

/** RM-REF-011 : renommage / activation-désactivation d'une matière — jamais de suppression
 * physique (RM-REF-007/008), seul `isActive` bascule. */
export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
