import { IsString, MinLength } from 'class-validator';

/** L'Administrateur invité fixe lui-même son mot de passe et ses informations personnelles. */
export class AcceptAdministratorInvitationDto {
  @IsString()
  token!: string;

  // RM-SEC-012 : mot de passe Administrateur — exigence renforcée à 16 caractères minimum.
  @MinLength(16)
  password!: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsString()
  @MinLength(1)
  phone!: string;
}
