import { ExportFormat, ExportType } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';

/** Ch.17.5 : critères de sélection — le sous-ensemble pertinent dépend du rôle et du type d'export. */
export class CreateExportDto {
  @IsEnum(ExportType)
  type!: ExportType;

  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  groupIds?: string[];

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  schoolLevelId?: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  /** RM-EXP-010 : Parent uniquement — année académique en cours ou historique complet. */
  @IsOptional()
  @IsIn(['CURRENT_YEAR', 'ALL'])
  period?: 'CURRENT_YEAR' | 'ALL';
}
