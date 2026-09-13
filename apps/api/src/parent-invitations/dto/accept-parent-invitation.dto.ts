import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

/**
 * Avenant 01, Ch. A.3.3 : un seul DTO pour les deux cas (nouveau Parent / Parent déjà connecté) —
 * la validation contextuelle (quels champs sont réellement requis selon que l'appelant est
 * authentifié ou non) est faite dans `ParentInvitationsService.accept()`, pas ici via
 * `class-validator` (l'état d'authentification n'est pas un champ du corps de la requête).
 *
 * Cas 1 — nouveau Parent (RM-INV-007) : `phone`/`firstName`/`lastName`/`city`/`password`/
 * `acceptTerms` requis, jamais d'e-mail (Ch. I).
 * Cas 2 — Parent déjà connecté : ces champs sont ignorés.
 *
 * Enfant : soit `studentId` (rattache/ajoute un enfant déjà déclaré par ce Parent — cas 2
 * uniquement, A.3.3 dernier §), soit les champs `student*`/`schoolId`/`schoolLevelId` (nouvel
 * enfant, Ch. 7).
 */
export class AcceptParentInvitationDto {
  // --- Cas 1 : création du compte Parent ---
  @IsOptional()
  @IsString()
  @MinLength(1)
  phone?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;

  // --- Enfant : rattachement d'un enfant déjà existant (cas 2 uniquement) ---
  @IsOptional()
  @IsUUID()
  studentId?: string;

  // --- Enfant : création d'un nouvel enfant (Ch. 7) ---
  @IsOptional()
  @IsString()
  @MinLength(1)
  studentFirstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  studentLastName?: string;

  @IsOptional()
  @IsDateString()
  studentDateOfBirth?: string;

  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsOptional()
  @IsUUID()
  schoolLevelId?: string;

  @IsOptional()
  @IsString()
  schoolClass?: string;
}
