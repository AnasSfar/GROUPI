import { DayOfWeek, TeachingMode } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsUUID, Matches, Min } from 'class-validator';

/** Ch.10.4 : un créneau récurrent du planning hebdomadaire du groupe. */
export class GroupScheduleDto {
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime doit être au format HH:mm' })
  startTime!: string;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsOptional()
  @IsUUID()
  teachingLocationId?: string;

  /**
   * RM-GRP-007 : mode d'enseignement propre à ce créneau. Omis (ou non fourni) = hérite du mode
   * du groupe (`Group.teachingMode`) ; permet un groupe multi-modal (ex. un créneau en présentiel
   * et un autre en ligne).
   */
  @IsOptional()
  @IsEnum(TeachingMode)
  teachingMode?: TeachingMode;
}
