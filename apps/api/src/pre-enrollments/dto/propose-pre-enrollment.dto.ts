import { IsDateString, IsUUID } from 'class-validator';

/** Ch.11.7/11.8 : le Professeur envoie une proposition liée à un groupe précis, avec une date
 *  limite de réponse pour le Parent. */
export class ProposePreEnrollmentDto {
  @IsUUID()
  groupId!: string;

  @IsDateString()
  expiresAt!: string;
}
