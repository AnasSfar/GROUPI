import { IsUUID } from 'class-validator';

/** Ch.12.5 : le Parent sélectionne l'enfant concerné et le groupe souhaité. */
export class CreateEnrollmentDto {
  @IsUUID()
  studentId!: string;

  @IsUUID()
  groupId!: string;
}
