import { IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Avenant 01, Ch. D.4, RM-PAR-024 : le Parent choisit un Professeur parmi ceux auxquels
 * `studentId` est déjà rattaché ou a déjà été inscrit — plus un mini-annuaire de tous les
 * Professeurs validés (retiré, RM-PAR-020), seulement le formulaire de préinscription restreint
 * au périmètre de cet enfant.
 */
export class EligibleTeachersQueryDto {
  @IsUUID()
  studentId!: string;

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
