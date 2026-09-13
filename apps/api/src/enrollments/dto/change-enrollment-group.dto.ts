import { IsUUID } from 'class-validator';

/** Avenant 02 : changement de groupe décidé par le Professeur, sans confirmation Parent. */
export class ChangeEnrollmentGroupDto {
  @IsUUID()
  targetGroupId!: string;
}
