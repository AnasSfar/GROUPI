import { IsOptional, IsString, MinLength } from 'class-validator';

/** Utilisé pour suspend/disable — RM-CYC-029 : chaque transition doit enregistrer un motif. */
export class AccountActionDto {
  @IsString()
  @MinLength(3)
  reason!: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
