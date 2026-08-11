import { IsDateString } from 'class-validator';

/** Ch.11.7/11.8, RM-PRE-008/009/010 : envoi groupé d'une proposition à toutes les préinscriptions
 *  compatibles avec un groupe, avec une date limite de réponse commune. */
export class ProposeAllPreEnrollmentsDto {
  @IsDateString()
  expiresAt!: string;
}
