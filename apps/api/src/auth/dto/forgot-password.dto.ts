import { IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  /** RM-SEC-001 : téléphone (Professeur/Parent, Ch. I.1) ou e-mail (Admin, Ch. H). */
  @IsString()
  @MinLength(1)
  identifier!: string;
}
