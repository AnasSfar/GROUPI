import { DayOfWeek } from '@prisma/client';
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
}
