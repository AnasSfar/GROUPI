import { PreEnrollmentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

/** RM-PRE-029 : filtres basiques pour la consultation Administrateur de l'ensemble des préinscriptions. */
export class AdminListPreEnrollmentsQueryDto {
  @IsOptional()
  @IsEnum(PreEnrollmentStatus)
  status?: PreEnrollmentStatus;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}
