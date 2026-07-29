import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AbsenceBillingPolicy, VisibilityWhenFull } from '@prisma/client';
import { GroupScheduleDto } from './group-schedule.dto';

/** Ch.10.11 : après la 1ère inscription, seuls planning/lieu/tarif/capacité/visibilité restent
 *  modifiables. Cette version MVP verrouille matière/niveau/année dès la création (voir progress.md). */
export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  publicPrice?: number;

  @IsOptional()
  @IsEnum(AbsenceBillingPolicy)
  absenceBillingPolicy?: AbsenceBillingPolicy;

  @IsOptional()
  @IsInt()
  @Min(1)
  abandonmentThreshold?: number;

  /** RM-CPT-022 : seuil (en nombre de séances au tarif appliqué) au-delà duquel un solde débiteur est "important". */
  @IsOptional()
  @IsInt()
  @Min(1)
  debtAlertThresholdSessions?: number;

  @IsOptional()
  @IsEnum(VisibilityWhenFull)
  visibilityWhenFull?: VisibilityWhenFull;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => GroupScheduleDto)
  @ArrayMinSize(1, { message: 'Le planning ne peut pas être vide (ERR-GRP-007)' })
  schedules?: GroupScheduleDto[];

  /**
   * ERR-GRP-016/017 : requis dès lors que la modification du planning touche des séances futures
   * déjà planifiées (statut PLANIFIEE/REPORTEE). `true` = conserver ces séances telles quelles,
   * `false` = les supprimer pour qu'elles soient régénérées depuis le nouveau planning.
   */
  @IsOptional()
  @IsBoolean()
  keepFutureSessions?: boolean;
}
