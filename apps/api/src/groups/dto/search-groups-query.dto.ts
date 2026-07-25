import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SearchGroupsQueryDto {
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @IsOptional()
  @IsUUID()
  schoolLevelId?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
