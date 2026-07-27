import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Ch.16.4/RM-DSH-006 : motif et commentaire facultatifs, le Parent choisit son élève concerné. */
export class CreateAbsenceNoticeDto {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
