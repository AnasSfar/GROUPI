import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

/** RM-REF-011 : renommage / activation-désactivation d'une ville — jamais de suppression
 * physique (RM-REF-007/008), seul `isActive` bascule. */
export class UpdateCityDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
