import { IsOptional, IsUUID } from 'class-validator';

/** Ch.11.5 : le Professeur filtre ses préinscriptions reçues par année académique. */
export class ListMineQueryDto {
  @IsOptional()
  @IsUUID()
  academicYearId?: string;
}
