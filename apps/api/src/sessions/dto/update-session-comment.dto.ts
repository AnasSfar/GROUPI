import { IsOptional, IsString, MaxLength } from 'class-validator';

/** RM-SES-041 : commentaire pédagogique de la séance — chaîne vide/absente efface le commentaire. */
export class UpdateSessionCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  teacherComment?: string;
}
