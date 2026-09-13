/**
 * Avenant 01, Ch. I.4/I.7 (RM-NOT-051) : canaux de diffusion possibles d'une notification métier.
 * Pas un enum Prisma — aucune colonne "canal" n'est persistée en V1.1 (Ch. I.5 : la cible de canal
 * reste documentée au catalogue NOT-*, pas au modèle de données ; RM-NOT-052 : la priorité, elle,
 * reste portée par `Activity.priority`). En V1.1 (décision #7, option A), seul `IN_APP` est routé —
 * `WHATSAPP`/`SMS` sont des cibles préparées pour l'évolution Ch. I.6 (options B/C), sans qu'aucun
 * déclencheur métier n'ait à être réécrit lors de leur activation.
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
}
