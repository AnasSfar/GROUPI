import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  /** Auto-inscription réservée aux Professeurs et Parents (Ch.3.3-3.5 : Admin/SuperAdmin ne s'auto-créent jamais) */
  @IsIn(['TEACHER', 'PARENT'])
  role!: 'TEACHER' | 'PARENT';

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  phone!: string;

  @IsString()
  city!: string;

  /** RM-TPR-001 : le profil minimum d'un Professeur inclut au moins une matière, dès la création du compte. */
  @ValidateIf((o) => o.role === 'TEACHER')
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une matière est requise pour un compte Professeur' })
  @IsUUID('4', { each: true })
  subjectIds!: string[];

  /** RM-TPR-001 : le profil minimum d'un Professeur inclut au moins un niveau, dès la création du compte. */
  @ValidateIf((o) => o.role === 'TEACHER')
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins un niveau scolaire est requis pour un compte Professeur' })
  @IsUUID('4', { each: true })
  schoolLevelIds!: string[];

  /** Ch.9.5, ERR-SEC-013 : l'acceptation des conditions d'utilisation est obligatoire à l'inscription. */
  @IsBoolean()
  acceptTerms!: boolean;
}
