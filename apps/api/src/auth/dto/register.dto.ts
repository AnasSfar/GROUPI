import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class InitialStudentDto {
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

export class RegisterDto {
  /** Optional complementary contact address, unique when provided. */
  @ValidateIf((o) => !!o.email)
  @IsEmail()
  email?: string;

  @MinLength(8)
  password!: string;

  /** Self-registration is only available for teachers and parents. */
  @IsIn(['TEACHER', 'PARENT'])
  role!: 'TEACHER' | 'PARENT';

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  /** Required login identifier and profile contact phone. */
  @IsString()
  @MinLength(1)
  phone!: string;

  @IsString()
  city!: string;

  /** A teacher must select at least one subject at account creation. */
  @ValidateIf((o) => o.role === 'TEACHER')
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une matiere est requise pour un compte Professeur' })
  @IsUUID('4', { each: true })
  subjectIds!: string[];

  /** A teacher must select at least one school level at account creation. */
  @ValidateIf((o) => o.role === 'TEACHER')
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins un niveau scolaire est requis pour un compte Professeur' })
  @IsUUID('4', { each: true })
  schoolLevelIds!: string[];

  /** A parent declares at least one child and the initial school situation at registration. */
  @ValidateIf((o) => o.role === 'PARENT')
  @IsObject()
  @ValidateNested()
  @Type(() => InitialStudentDto)
  initialStudent!: InitialStudentDto;

  /** Terms acceptance is mandatory at registration. */
  @IsBoolean()
  acceptTerms!: boolean;
}
