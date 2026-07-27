import { AttendanceStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

/**
 * Ch.14.4/RM-ATT-004 : statuts autorisés à la saisie — `NON_RENSEIGNEE`/`VERROUILLEE` ne sont
 * jamais des valeurs saisissables (ERR-ATT-015), donc absentes de l'enum `AttendanceStatus`
 * exposé ici (voir le commentaire sur le modèle `Attendance` du schéma Prisma).
 */
export class SetAttendanceDto {
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  /** ERR-ATT-016/017/022 : requis et borné uniquement lorsque `status = LATE` (vérifié en service). */
  @IsOptional()
  @IsInt()
  @Min(1)
  lateDuration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  /** Motif de correction (Ch.14.8) — sans effet lors de la toute première saisie. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
