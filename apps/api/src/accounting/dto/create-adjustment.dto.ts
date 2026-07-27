import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';
import { AccountingEntryDirection, AdjustmentReason } from '@prisma/client';

/**
 * PERM-CPT-006 : ajustement comptable créé par le Professeur, dans la fenêtre de 48h suivant la
 * séance concernée (RM-CPT-019). `sessionId` sert à la fois de référence métier et de borne
 * temporelle (réutilise `computeLockDeadline`/`isLockable` de `sessions.service.ts`).
 */
export class CreateAdjustmentDto {
  @IsUUID()
  sessionId!: string;

  @IsEnum(AccountingEntryDirection)
  direction!: AccountingEntryDirection;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  amount!: number;

  @IsEnum(AdjustmentReason)
  reason!: AdjustmentReason;

  /** ERR-CPT-010 : justification obligatoire. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reasonNote!: string;
}
