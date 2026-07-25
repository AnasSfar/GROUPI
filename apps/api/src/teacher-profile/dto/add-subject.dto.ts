import { IsUUID } from 'class-validator';

export class AddSubjectDto {
  @IsUUID()
  subjectId!: string;
}
