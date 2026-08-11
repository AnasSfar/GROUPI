import { TeachingMode } from '@prisma/client';
import { IsEnum } from 'class-validator';

/** Ch.13.6 : passage exceptionnel du mode d'enseignement d'une séance précise. */
export class SetTeachingModeDto {
  @IsEnum(TeachingMode)
  teachingMode!: TeachingMode;
}
