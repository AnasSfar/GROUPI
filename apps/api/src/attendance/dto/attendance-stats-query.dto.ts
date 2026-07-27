import { IsIn, IsOptional } from 'class-validator';

/** Ch.14.9/RM-ATT-018 : les trois périodes de calcul des statistiques d'assiduité. */
export type AttendanceStatsPeriod = 'GROUP' | 'ACADEMIC_YEAR' | 'LAST_30_DAYS';

export class AttendanceStatsQueryDto {
  @IsOptional()
  @IsIn(['GROUP', 'ACADEMIC_YEAR', 'LAST_30_DAYS'])
  period?: AttendanceStatsPeriod;
}
