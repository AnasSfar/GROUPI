import { IsOptional, IsUUID } from 'class-validator';
import { CreateExportDto } from './create-export.dto';

/**
 * Ch.17.4 : "le Super Administrateur peut exporter toutes les données disponibles" — `teacherId`
 * permet au Super Admin de scoper un export normalement réservé au Professeur (GROUPS/STUDENTS/...)
 * sur un Professeur précis ; laissé vide, la portée est globale (tous Professeurs). Un Admin
 * (non Super Admin) reste limité à `ADMIN_STATISTICS` quel que soit ce champ (voir `ExportsService`).
 */
export class CreateAdminExportDto extends CreateExportDto {
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
