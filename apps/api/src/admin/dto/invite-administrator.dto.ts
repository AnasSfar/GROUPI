import { ArrayMinSize, IsArray, IsEmail, IsString } from 'class-validator';

/** RM-CYC-022, PERM-ACC-001 : un Administrateur est invité exclusivement par le Super Administrateur. */
export class InviteAdministratorDto {
  @IsEmail()
  email!: string;

  /** Ch.3.4 : permissions accordées individuellement dès la création. */
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une permission doit être accordée' })
  @IsString({ each: true })
  permissions!: string[];
}
