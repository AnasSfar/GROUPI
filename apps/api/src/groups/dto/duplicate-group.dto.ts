import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

/**
 * Ch.10.11/RM-GRP-015/027/037 : duplication d'un groupe. Matière et niveau sont toujours copiés à
 * l'identique depuis le groupe source (jamais choisis ici) ; seule l'année académique peut être
 * explicitement précisée si elle diffère de celle du groupe source. Le nom peut être personnalisé,
 * sinon le nom du groupe source suffixé « (copie) » est utilisé par défaut.
 */
export class DuplicateGroupDto {
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
