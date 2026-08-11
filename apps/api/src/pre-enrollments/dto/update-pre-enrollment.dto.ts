import { IsOptional, IsUUID } from 'class-validator';

/** RM-PRE-031/ERR-PRE-018 : modification par le Parent, uniquement tant qu'aucune proposition n'a
 *  été envoyée — seuls le niveau visé et la matière (les critères de compatibilité RM-PRE-008
 *  encore ouverts à ce stade) peuvent être changés ; élève/Professeur/année restent figés
 *  (les modifier reviendrait à créer une autre préinscription, cf. RM-PRE-025). */
export class UpdatePreEnrollmentDto {
  @IsOptional()
  @IsUUID()
  schoolLevelId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;
}
