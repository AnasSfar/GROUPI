import { IsDateString, IsInt, IsOptional, Matches, Min } from 'class-validator';

/**
 * Ch.13.3/13.8 : le report annule (POSTPONED) la séance initiale et crée une nouvelle séance
 * PLANIFIEE à la date choisie. Le lieu et le mode d'enseignement ne sont pas modifiables ici —
 * seule une nouvelle date/heure (et, éventuellement, une nouvelle durée) est demandée.
 */
export class PostponeSessionDto {
  @IsDateString()
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime doit être au format HH:mm' })
  startTime!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}
