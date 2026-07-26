import { IsNumber, IsOptional, Min } from 'class-validator';

/** Ch.12.8 : le Professeur peut définir un tarif personnalisé dès l'acceptation. */
export class AcceptEnrollmentDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  customPrice?: number;
}
