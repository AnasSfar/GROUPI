import { IsDateString, IsString, MinLength } from 'class-validator';

/** PERM-REF-001 : création d'un référentiel — ici une nouvelle année académique (Ch.23). */
export class CreateAcademicYearDto {
  @IsString()
  @MinLength(1)
  label!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;
}
