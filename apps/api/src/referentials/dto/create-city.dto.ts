import { IsString, MinLength } from 'class-validator';

/** RM-REF-011 : création directe d'une ville par un Administrateur habilité (REF_CREATE). */
export class CreateCityDto {
  @IsString()
  @MinLength(1)
  name!: string;
}
