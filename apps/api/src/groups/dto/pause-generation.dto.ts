import { IsDateString, IsOptional } from 'class-validator';

/**
 * RM-GRP-009/030 : interruption temporaire de la génération automatique des séances d'un groupe
 * (vacances, absence du Professeur...) — ne modifie jamais le planning hebdomadaire ni les
 * inscriptions actives. `from`/`until` sont indépendamment optionnels ; passer explicitement
 * `null` annule la borne correspondante (et donc tout ou partie de la pause en cours).
 * `@IsOptional()` de class-validator ignore la validation quand la valeur est `null` OU
 * `undefined`, ce qui permet ce double usage (champ omis = inchangé, `null` = borne effacée).
 */
export class PauseGenerationDto {
  @IsOptional()
  @IsDateString()
  from?: string | null;

  @IsOptional()
  @IsDateString()
  until?: string | null;
}
