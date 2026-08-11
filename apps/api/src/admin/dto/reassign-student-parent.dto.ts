import { IsUUID } from 'class-validator';

/** RM-ACC-016 : réaffectation d'un Élève à un nouveau compte Parent. */
export class ReassignStudentParentDto {
  @IsUUID()
  newParentUserId!: string;
}
