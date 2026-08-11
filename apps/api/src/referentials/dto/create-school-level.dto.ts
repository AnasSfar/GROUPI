import { IsInt, IsString, Min, MinLength } from 'class-validator';

/** RM-REF-011 : création directe d'un niveau scolaire par un Administrateur habilité (REF_CREATE). */
export class CreateSchoolLevelDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  code!: string;

  /** Ordre d'affichage (Ch.23.5) — ex. tri primaire → collège → lycée. */
  @IsInt()
  @Min(1)
  order!: number;
}
