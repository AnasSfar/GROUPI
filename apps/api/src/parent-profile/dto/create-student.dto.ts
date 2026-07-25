import { IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

/** Ch.6.5 : nom/prénom + niveau/établissement/classe initiaux (donnent lieu à la 1ère situation scolaire, Ch.7). */
export class CreateStudentDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsUUID()
  schoolLevelId!: string;

  @IsUUID()
  schoolId!: string;

  @IsOptional()
  @IsString()
  schoolClass?: string;
}
