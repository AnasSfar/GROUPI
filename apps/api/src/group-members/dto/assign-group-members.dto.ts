import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

/** Avenant 01, Ch. C.3 — affectation multi-élèves depuis la salle d'attente vers un groupe standard. */
export class AssignGroupMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  studentIds!: string[];

  /** Ch.12.9 : mode de paiement habituel, indicatif — jamais bloquant. */
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  /** Ch.10.8/10.9 : tarif personnalisé, sinon tarif public du groupe (même règle qu'à l'acceptation
   *  d'une inscription classique, RM-GRP-022). Appliqué identiquement à tous les élèves affectés dans
   *  cet appel. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  customPrice?: number;
}
