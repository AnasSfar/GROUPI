import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { TeachingMode } from '@prisma/client';

export class SearchGroupsQueryDto {
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  schoolLevelId?: string;

  @IsOptional()
  @IsString()
  city?: string;

  /** RM-INS-007 : recherche par nom (ou partie du nom) du Professeur. */
  @IsOptional()
  @IsString()
  teacherName?: string;

  /** RM-INS-007 : filtre par mode d'enseignement du groupe. */
  @IsOptional()
  @IsIn(['PRESENTIAL', 'ONLINE'])
  teachingMode?: TeachingMode;
}
