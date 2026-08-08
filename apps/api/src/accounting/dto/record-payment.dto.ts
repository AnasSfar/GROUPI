import { IsISO8601, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

/** Ch.15.10 : le Professeur enregistre manuellement chaque paiement reçu (RM-CPT-011/018). */
export class RecordPaymentDto {
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  amount!: number;

  /** RM-CPT-023 : indicatif uniquement, aucune valeur imposée par le référentiel. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;

  /** Date d'effet du paiement — par défaut la date de l'enregistrement. */
  @IsOptional()
  @IsISO8601()
  effectiveDate?: string;

  /** Seance reglee par ce paiement, quand le suivi se fait seance par seance. */
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
