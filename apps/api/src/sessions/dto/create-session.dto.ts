import { TeachingMode } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Matches, Min } from 'class-validator';

/** Ch.13.10 : séance exceptionnelle — gérée exactement comme une séance générée automatiquement. */
export class CreateSessionDto {
  @IsDateString()
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime doit être au format HH:mm' })
  startTime!: string;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsEnum(TeachingMode)
  teachingMode!: TeachingMode;

  @IsOptional()
  @IsUUID()
  teachingLocationId?: string;
}
