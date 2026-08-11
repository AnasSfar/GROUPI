import { IsOptional, IsString, MinLength } from 'class-validator';

/** RM-TPR-012 : dépôt facultatif et non vérifié en V1 — pas d'upload binaire, cf. teacher-profile.service.ts. */
export class CreateDiplomaDto {
  @IsString()
  @MinLength(1)
  fileName!: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}
