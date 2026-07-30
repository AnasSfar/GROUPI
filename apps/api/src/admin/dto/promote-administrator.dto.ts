import { ArrayMinSize, IsArray, IsString } from 'class-validator';

/** Ch.3.4 : promotion d'un compte Professeur/Parent existant vers le rôle Administrateur. */
export class PromoteAdministratorDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une permission doit être accordée' })
  @IsString({ each: true })
  permissions!: string[];
}
