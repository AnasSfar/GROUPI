import { IsUUID } from 'class-validator';

/** RM-SUB-012/013 : changement d'offre en cours d'année pour l'abonnement actif du Professeur. */
export class ChangePlanDto {
  @IsUUID()
  newPlanId!: string;
}
