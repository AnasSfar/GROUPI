import { IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

/** Ch.15.10 : saisie d'un paiement séance par séance — la séance vient de l'URL (RM-CPT-011/018). */
export class RecordSessionPaymentDto {
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  amount!: number;

  /** RM-CPT-023 : indicatif uniquement, aucune valeur imposée par le référentiel. */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;
}
