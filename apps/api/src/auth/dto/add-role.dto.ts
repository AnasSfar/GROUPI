import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

/**
 * RM-ACC-002 : un compte existant (Professeur ou Parent) peut acquérir le second rôle métier sans
 * créer un nouveau compte. Mêmes champs obligatoires qu'à l'inscription (`RegisterDto`), à
 * l'exception de l'e-mail/mot de passe/CGU déjà connus pour ce compte.
 */
export class AddRoleDto {
  /** Le rôle métier à ajouter — jamais ADMIN/SUPER_ADMIN, qui ne s'obtiennent que via promotion. */
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

  /** RM-TPR-001 : au moins une matière est requise pour le profil Professeur ajouté. */
  @ValidateIf((o) => o.role === 'TEACHER')
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une matière est requise pour devenir Professeur' })
  @IsUUID('4', { each: true })
  subjectIds!: string[];

  /** RM-TPR-001 : au moins un niveau scolaire est requis pour le profil Professeur ajouté. */
  @ValidateIf((o) => o.role === 'TEACHER')
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins un niveau scolaire est requis pour devenir Professeur' })
  @IsUUID('4', { each: true })
  schoolLevelIds!: string[];
}
