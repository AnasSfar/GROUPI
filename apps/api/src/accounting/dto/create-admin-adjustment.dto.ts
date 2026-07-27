import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';
import { AccountingEntryDirection, AdjustmentReason } from '@prisma/client';

/**
 * Ch.15.8/RM-CPT-020 : ajustement administratif — hors délai des 48h, ou sur un compte/période
 * verrouillé. `sessionId` reste optionnel (un ADMIN_ADJUSTMENT n'est pas nécessairement lié à une
 * séance précise, contrairement à l'ADJUSTMENT du Professeur).
 */
export class CreateAdminAdjustmentDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsEnum(AccountingEntryDirection)
  direction!: AccountingEntryDirection;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  amount!: number;

  @IsEnum(AdjustmentReason)
  reason!: AdjustmentReason;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reasonNote!: string;
}
