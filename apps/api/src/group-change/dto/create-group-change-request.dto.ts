import { IsUUID } from 'class-validator';

/** Ch.12.12 : demande de changement de groupe (variante définitive) — le Parent désigne
 *  l'inscription active qu'il souhaite transférer et le groupe cible. */
export class CreateGroupChangeRequestDto {
  @IsUUID()
  enrollmentId!: string;

  @IsUUID()
  targetGroupId!: string;
}
