import { IsString, MinLength } from 'class-validator';

/** RM-REF-011 : création directe d'une matière par un Administrateur habilité (REF_CREATE) —
 * pas de workflow de demande Parent pour ce référentiel (contrairement à School, Ch.6.7). */
export class CreateSubjectDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  code!: string;
}
