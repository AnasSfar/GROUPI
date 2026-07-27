import { ExportFormat } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class FulfillDataPortabilityDto {
  /** 17.4 dernier § : "format structuré et couramment utilisé" — CSV par défaut. */
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}
