import { ArrayMinSize, IsArray, IsString } from 'class-validator';

/** RM-ACC-013 : modification des permissions d'un Administrateur après sa création. */
export class UpdateAdministratorPermissionsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une permission doit être accordée' })
  @IsString({ each: true })
  permissions!: string[];
}
