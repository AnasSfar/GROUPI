import { IsOptional, IsString, IsUUID } from 'class-validator';

/** Ch.7.4 : le Parent déclare la nouvelle situation ; GROUPI décide seul si elle est automatique ou soumise à validation. */
export class RequestSituationUpdateDto {
  @IsUUID()
  academicYearId!: string;

  @IsUUID()
  schoolLevelId!: string;

  @IsUUID()
  schoolId!: string;

  @IsOptional()
  @IsString()
  schoolClass?: string;
}
