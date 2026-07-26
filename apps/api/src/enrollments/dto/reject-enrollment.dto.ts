import { IsOptional, IsString } from 'class-validator';

/**
 * Ch.12.7 : en cas de refus, le Professeur peut ajouter un commentaire explicatif.
 * NB : le schéma `Enrollment` (hors scope de ce chantier, voir mission) ne porte pas de colonne
 * dédiée pour ce commentaire — il est accepté ici pour respecter le contrat d'API mais n'est pas
 * persisté au-delà du refus (à ajouter avec l'historique complet, Ch.12.13, dans un futur chantier).
 */
export class RejectEnrollmentDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
