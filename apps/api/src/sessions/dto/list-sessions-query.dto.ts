import { SessionStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

/** Ch.13 : filtres optionnels pour la liste des séances d'un groupe. */
export class ListSessionsQueryDto {
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
