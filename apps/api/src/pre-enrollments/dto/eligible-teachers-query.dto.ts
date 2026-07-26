import { IsOptional, IsString, IsUUID } from 'class-validator';

/** Ch.11.4 : le Parent choisit un Professeur parmi les comptes validés — pas encore d'annuaire
 *  public dédié (hors périmètre Ch.11), cet endpoint expose une recherche minimale dans le
 *  seul but d'alimenter le formulaire de préinscription. */
export class EligibleTeachersQueryDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  schoolLevelId?: string;
}
