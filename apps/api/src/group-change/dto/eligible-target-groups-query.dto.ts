import { IsUUID } from 'class-validator';

/**
 * Avenant 01, Ch. D.3/D.4 : groupes standard éligibles comme cible d'un changement de groupe pour
 * `enrollmentId` — remplace, pour ce seul besoin, la recherche de groupes supprimée (D.2).
 */
export class EligibleTargetGroupsQueryDto {
  @IsUUID()
  enrollmentId!: string;
}
