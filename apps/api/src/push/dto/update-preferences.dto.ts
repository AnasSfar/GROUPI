import { IsArray, IsBoolean, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LEAD_MINUTES_OPTIONS, PUSH_CATEGORIES, PushCategory } from '../push-categories';

class PreferenceEntryDto {
  @IsIn(PUSH_CATEGORIES)
  category!: PushCategory;

  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsIn(LEAD_MINUTES_OPTIONS)
  leadMinutes?: number;
}

export class UpdatePreferencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreferenceEntryDto)
  preferences!: PreferenceEntryDto[];
}
