import { IsDateString } from 'class-validator';

/** Ch.12.12 : la date effective est choisie par le Professeur à l'acceptation — jamais par le Parent. */
export class AcceptGroupChangeRequestDto {
  @IsDateString()
  effectiveDate!: string;
}
