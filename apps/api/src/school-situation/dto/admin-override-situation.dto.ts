import { IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

/** RM-SCH-014/017 : correction exceptionnelle d'une situation clôturée par un Administrateur autorisé
 * — tous les champs métier sont optionnels (seuls ceux fournis sont corrigés), `reason` est
 * obligatoire (tracée dans le journal d'audit). */
export class AdminOverrideSituationDto {
  @IsOptional()
  @IsUUID()
  schoolLevelId?: string;

  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsOptional()
  @IsString()
  schoolClass?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
