import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * RM-CHG-002 (Ch.20.3) : demande de changement de groupe initiée par le Professeur, symétrique de
 * `CreateGroupChangeRequestDto` (Parent). Contrairement au Parent, le Professeur fixe directement la
 * date d'effet dès la proposition : RM-CHG-010 impose que les deux groupes appartiennent au même
 * Professeur, donc "le Professeur du groupe cible" qui validerait normalement (Ch.20.5) est ici
 * l'initiateur lui-même — voir le commentaire de `GroupChangeService.teacherInitiate`. La validation
 * qui reste réellement nécessaire (RM-CHG-003) est donc celle du Parent, via `confirmTeacherProposal`
 * / `declineTeacherProposal`.
 */
export class TeacherInitiateGroupChangeRequestDto {
  @IsUUID()
  enrollmentId!: string;

  @IsUUID()
  targetGroupId!: string;

  @IsDateString()
  effectiveDate!: string;

  /** Motif facultatif communiqué au Parent dans la notification (non persisté sur l'entité, faute
   *  de champ dédié dans ce chantier — conservé dans `AuditLog.metadata` pour traçabilité). */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
