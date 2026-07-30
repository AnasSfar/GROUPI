import { IsString, MinLength } from 'class-validator';

/** L'Administrateur invité fixe lui-même son mot de passe et ses informations personnelles. */
export class AcceptAdministratorInvitationDto {
  @IsString()
  token!: string;

  @MinLength(8)
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
