import { IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';

/** PERM-CPT-002 : correction d'un paiement — réalisée par écriture inverse + nouvelle écriture (RM-CPT-029). */
export class CorrectPaymentDto {
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reasonNote!: string;
}
