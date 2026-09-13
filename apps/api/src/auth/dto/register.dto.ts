import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

/**
 * Avenant 01, Ch. A.2/D.2 : l'auto-inscription en libre-service n'existe plus que pour le
 * Professeur — un Parent n'entre dans GROUPI que via le lien d'invitation d'un Professeur
 * (`ParentInvitationsService.accept`, Ch. A.3.3). Avenant 01, Ch. I.1 : plus de champ e-mail.
 */
export class RegisterDto {
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  /** Identifiant unique du compte (Ch. I.1). */
  @IsString()
  @MinLength(1)
  phone!: string;

  @IsString()
  city!: string;

  /** RM-TPR-001 : au moins une matière est requise à la création du profil Professeur. */
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une matiere est requise pour un compte Professeur' })
  @IsUUID('4', { each: true })
  subjectIds!: string[];

  /** RM-TPR-002 : au moins un niveau scolaire est requis à la création du profil Professeur. */
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins un niveau scolaire est requis pour un compte Professeur' })
  @IsUUID('4', { each: true })
  schoolLevelIds!: string[];

  /** Ch.9.5, ERR-SEC-013 : acceptation obligatoire à l'inscription. */
  @IsBoolean()
  acceptTerms!: boolean;
}
