import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

/** RM-PAR-003 : seuls nom/prénom (et date de naissance) sont modifiables ici — le reste passe par la situation scolaire (Ch.7). */
export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
