import { IsOptional, IsUUID } from 'class-validator';

/** Ch.11.4 : informations demandées au Parent pour manifester son intérêt pour une future année. */
export class CreatePreEnrollmentDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  teacherId!: string;

  @IsUUID()
  schoolLevelId!: string;

  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsUUID()
  academicYearId!: string;
}
