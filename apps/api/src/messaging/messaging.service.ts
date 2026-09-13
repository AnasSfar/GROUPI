import { Injectable, Logger } from '@nestjs/common';
import { Activity, ActivityPriority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationChannel } from './notification-channel';

/** RM-NOT-013 : fenêtre de regroupement des notifications informatives. */
const GROUPING_WINDOW_MS = 5 * 60_000;

export interface NotifyInput {
  recipientUserId: string;
  /** Code métier libre (ex. "SES_EXCEPTIONAL_CREATED") — voir le commentaire du modèle `Activity`. */
  type: string;
  priority: ActivityPriority;
  title: string;
  body?: string;
  refType?: string;
  refId?: string;
}

/**
 * Avenant 01, Ch. I.4/I.7 : point d'entrée UNIQUE de toute notification métier (RM-NOT-051 —
 * "tous les déclencheurs métier passent par le MessagingService (façade NotificationChannel) ;
 * aucun appel direct à un fournisseur"). Remplace l'ancien couplage `NotificationsService` ->
 * `EmailService` (Ch.18 V1.0) : le paramètre `sendEmail` de `NotifyInput` a disparu, tout comme
 * `EmailService`/le module `email/` (RM-SEC-052, supprimés).
 *
 * En V1.1 (décision #7, option A), seul `NotificationChannel.IN_APP` est routé : chaque appel crée
 * (ou regroupe, RM-NOT-013) une ligne `Activity` — jamais d'envoi externe (RM-NOT-050, "aucun canal
 * gratuit"). `NotificationChannel.WHATSAPP`/`SMS` existent déjà dans le type pour documenter la
 * cible future (Ch. I.6, options B/C : `WhatsAppService`/`SmsService`) sans qu'aucun appelant de
 * `notify()` n'ait jamais à changer — seul le corps de cette méthode évoluera pour router aussi ces
 * canaux selon la priorité (RM-NOT-052 : la priorité reste portée par `Activity.priority` même
 * quand un seul canal est actif, précisément pour permettre ce routage futur).
 *
 * `NotificationsService` (centre d'activités, lecture/marquage/archivage) délègue son écriture à ce
 * service plutôt que de dupliquer cette logique — voir `NotificationsService.notify`.
 */
@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Canaux effectivement routés en V1.1 — RM-NOT-050 : toujours au moins `IN_APP`, jamais désactivable. */
  private readonly activeChannels: readonly NotificationChannel[] = [NotificationChannel.IN_APP];

  async notify(input: NotifyInput): Promise<Activity> {
    if (!this.activeChannels.includes(NotificationChannel.IN_APP)) {
      // Ne peut pas arriver en V1.1 (RM-NOT-050) — garde-fou explicite pour l'évolution Ch.I.6, où
      // `activeChannels` pourrait un jour être piloté par une préférence utilisateur.
      this.logger.warn(`Canal IN_APP inactif : notification "${input.type}" perdue pour ${input.recipientUserId}`);
    }

    if (input.priority === 'INFORMATION') {
      const grouped = await this.tryGroupInformationalActivity(input);
      if (grouped) return grouped;
    }

    // WHATSAPP/SMS (Ch.I.6, options B/C) : router ici selon `input.priority` (IMPORTANT/CRITICAL)
    // une fois `WhatsAppService`/`SmsService` branchés — aucun appelant de `notify()` n'a à changer.

    return this.prisma.activity.create({
      data: {
        userId: input.recipientUserId,
        type: input.type,
        priority: input.priority,
        title: input.title,
        body: input.body,
        refType: input.refType,
        refId: input.refId,
      },
    });
  }

  /**
   * RM-NOT-013 : "les événements identiques sont regroupés sur une période de 5 minutes pour les
   * notifications informatives". Si une `Activity` du même `type`, pour le même destinataire, existe
   * déjà et a été créée il y a moins de 5 minutes, on ne crée pas de nouvelle ligne ; on met à jour
   * son `body` avec un préfixe compteur ("(xN) ..."). `createdAt` n'est jamais modifié (RM-NOT-005,
   * tri par plus récent en premier reste correct). `readAt` est réinitialisé à `null` : un nouvel
   * événement vient d'être regroupé dedans, l'utilisateur doit pouvoir le remarquer même s'il avait
   * déjà lu le précédent.
   */
  private async tryGroupInformationalActivity(input: NotifyInput): Promise<Activity | null> {
    const since = new Date(Date.now() - GROUPING_WINDOW_MS);
    const existing = await this.prisma.activity.findFirst({
      where: { userId: input.recipientUserId, type: input.type, priority: 'INFORMATION', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });
    if (!existing) return null;

    const match = /^\(x(\d+)\)\s/.exec(existing.body ?? '');
    const count = (match ? Number(match[1]) : 1) + 1;
    const baseBody = match ? existing.body!.slice(match[0].length) : (existing.body ?? existing.title);

    return this.prisma.activity.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        body: `(x${count}) ${baseBody}`,
        refType: input.refType ?? existing.refType,
        refId: input.refId ?? existing.refId,
        readAt: null,
      },
    });
  }
}
