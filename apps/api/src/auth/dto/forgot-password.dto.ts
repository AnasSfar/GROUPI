import { IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  /** RM-SEC-001 : adresse e-mail ou numéro de téléphone — l'identifiant choisi à l'inscription. */
  @IsString()
  @MinLength(1)
  identifier!: string;
}
