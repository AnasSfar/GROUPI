import { IsNumber, Min } from 'class-validator';

/** Ch.12.8/RM-INS-019 : modification du tarif personnalisé d'une inscription active. */
export class UpdateEnrollmentPriceDto {
  @IsNumber()
  @Min(0)
  customPrice!: number;
}
