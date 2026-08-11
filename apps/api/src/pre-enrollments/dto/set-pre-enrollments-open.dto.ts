import { IsBoolean } from 'class-validator';

/** RM-PRE-005/015, PERM-PRE-006 : le Professeur ouvre/ferme les préinscriptions groupe par groupe. */
export class SetPreEnrollmentsOpenDto {
  @IsBoolean()
  open!: boolean;
}
