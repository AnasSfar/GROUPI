import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AbsenceBillingPolicy, TeachingMode, VisibilityWhenFull } from '@prisma/client';
import { GroupScheduleDto } from './group-schedule.dto';

/** Ch.10.3 : paramètres définis par le Professeur à la création d'un groupe. */
export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsUUID()
  subjectId!: string;

  @IsUUID()
  schoolLevelId!: string;

  @IsUUID()
  academicYearId!: string;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsNumber()
  @Min(0)
  publicPrice!: number;

  @IsEnum(TeachingMode)
  teachingMode!: TeachingMode;

  @IsEnum(AbsenceBillingPolicy)
  absenceBillingPolicy!: AbsenceBillingPolicy;

  @IsOptional()
  @IsInt()
  @Min(1)
  abandonmentThreshold?: number;

  /** RM-CPT-022 : seuil (en nombre de séances au tarif appliqué) au-delà duquel un solde débiteur est "important". */
  @IsOptional()
  @IsInt()
  @Min(1)
  debtAlertThresholdSessions?: number;

  @IsEnum(VisibilityWhenFull)
  visibilityWhenFull!: VisibilityWhenFull;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  /** Avenant 04 : un groupe n'a qu'un seul créneau récurrent (amende RM-GRP-007). */
  @ValidateNested({ each: true })
  @Type(() => GroupScheduleDto)
  @ArrayMinSize(1, { message: 'Le planning ne peut pas être vide (ERR-GRP-007)' })
  @ArrayMaxSize(1, { message: 'Un groupe ne peut avoir qu’un seul créneau de planning (Avenant 04)' })
  schedules!: GroupScheduleDto[];
}
