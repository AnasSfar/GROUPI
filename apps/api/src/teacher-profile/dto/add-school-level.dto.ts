import { IsUUID } from 'class-validator';

export class AddSchoolLevelDto {
  @IsUUID()
  schoolLevelId!: string;
}
