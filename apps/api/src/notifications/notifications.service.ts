import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Activity, ActivityPriority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

/** RM-NOT-013 : fenêtre de regroupement des notifications informatives. */
const GROUPING_WINDOW_MS = 5 * 60_000;
/** RM-NOT-014 : au-delà de 24h, un réenvoi n'a plus grand intérêt (information périmée). */
const RETRY_WINDOW_MS = 24 * 60 * 60_000;

export interface NotifyInput {
  recipientUserId: string;
  /** Code métier libre (ex. "SES_EXCEPTIONAL_CREATED") — voir le commentaire du modèle `Activity`. */
  type: string;
  priority: ActivityPriority;
  title: string;
  body?: string;
  refType?: string;
  refId?: string;
  /**
   * Ch.18.9/RM-NOT-008/009 : le canal e-mail n'est utilisé que pour Important/Critique.
   * Fourni par l'appelant, déjà typé (ex. `() => this.email.sendEnrollmentAccepted(...)`) — ce
   * service ignore tout des templates métier, il applique seulement la règle de canal.
   */
  sendEmail?: () => Promise<void>;
}

/**
 * Ch.18 : point d'entrée unique du centre d'activités. Couvre en une seule méthode les 3 concepts
 * du référentiel (§18.12) — l'Activité est toujours créée (RM-NOT-004), l'e-mail n'est envoyé que
 * si la priorité l'exige (RM-NOT-008/009) et son succès est reflété sur la même ligne
 * (`emailSentAt`) plutôt que dans une table séparée.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async notify(input: NotifyInput): Promise<Activity> {
    if (input.priority === 'INFORMATION') {
      const grouped = await this.tryGroupInformationalActivity(input);
      if (grouped) return grouped;
    }

    const activity = await this.prisma.activity.create({
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

    if (input.priority !== 'INFORMATION' && input.sendEmail) {
      // Hors chemin critique (Ch.24) : un échec d'envoi ne doit jamais annuler l'action qui a
      // déclenché la notification — seule la ligne d'Activity déjà créée en garde la trace.
      input
        .sendEmail()
        .then(() => this.prisma.activity.update({ where: { id: activity.id }, data: { emailSentAt: new Date() } }))
        .catch((err: Error) => {
          this.logger.error(`Échec d'envoi e-mail pour l'activité ${activity.id} : ${err.message}`);
          void this.prisma.activity
            .update({ where: { id: activity.id }, data: { emailError: err.message } })
            .catch(() => {});
        });
    }

    return activity;
  }

  /**
   * RM-NOT-013 : "les événements identiques sont regroupés sur une période de 5 minutes pour les
   * notifications informatives". Choix retenu — le plus simple à intégrer proprement sans nouvelle
   * colonne dédiée : si une `Activity` du même `type`, pour le même destinataire, existe déjà et a
   * été créée il y a moins de 5 minutes, on ne crée pas de nouvelle ligne ; on met à jour son `body`
   * avec un préfixe compteur ("(xN) ..."). `createdAt` n'est jamais modifié, donc le tri RM-NOT-005
   * (plus récent en premier) reste correct — le regroupement ne fait pas "remonter" artificiellement
   * une activité ancienne. `readAt` est réinitialisé à `null` : un nouvel événement vient d'être
   * regroupé dedans, l'utilisateur doit pouvoir le remarquer même s'il avait déjà lu le précédent.
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

  /** RM-NOT-005 : classées de la plus récente à la plus ancienne. */
  async listMine(userId: string, filter?: 'all' | 'unread' | 'archived') {
    return this.prisma.activity.findMany({
      where: {
        userId,
        ...(filter === 'unread' ? { readAt: null } : {}),
        ...(filter === 'archived' ? { archivedAt: { not: null } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.activity.count({ where: { userId, readAt: null } });
  }

  /** RM-NOT-011 : marquer comme lu ne modifie jamais le reste de l'historique. */
  async markRead(userId: string, id: string): Promise<Activity> {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity || activity.userId !== userId) {
      throw new NotFoundException('Activité introuvable');
    }
    if (activity.readAt) {
      return activity;
    }
    return this.prisma.activity.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    return this.prisma.activity.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /**
   * RM-NOT-010 : "les activités peuvent être archivées mais jamais supprimées" — l'archivage n'est
   * qu'un marquage (`archivedAt`), la ligne reste en base et reste consultable via le filtre
   * `archived` de `listMine`. Idempotent, comme `markRead`.
   */
  async archive(userId: string, id: string): Promise<Activity> {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity || activity.userId !== userId) {
      throw new NotFoundException('Activité introuvable');
    }
    if (activity.archivedAt) {
      return activity;
    }
    return this.prisma.activity.update({ where: { id }, data: { archivedAt: new Date() } });
  }

  /**
   * RM-NOT-014 : "les notifications critiques font l'objet d'une tentative de réenvoi en cas
   * d'échec de délivrance". Cible les `Activity` `CRITICAL` dont l'e-mail initial a échoué
   * (`emailError` renseigné, `emailSentAt` toujours vide), créées il y a moins de 24h. Reproduit la
   * même sémantique que l'envoi initial dans `notify()` (succès -> `emailSentAt`, échec ->
   * `emailError` mis à jour, jamais d'exception propagée à l'appelant — Ch.24, un échec d'envoi ne
   * doit jamais bloquer un job). Contrairement à l'appel initial, ce service ne connaît plus le
   * template métier d'origine : la closure `sendEmail` fournie à `notify()` n'est jamais persistée.
   * Le réenvoi utilise donc un message générique reprenant le titre/corps déjà stockés sur
   * l'`Activity` (`EmailService.sendCriticalActivityRetry`), plutôt que de dupliquer chaque template
   * métier ici.
   */
  async retryFailedCriticalEmails(now = new Date()): Promise<{ retried: number; succeeded: number }> {
    const since = new Date(now.getTime() - RETRY_WINDOW_MS);
    const failed = await this.prisma.activity.findMany({
      where: { priority: 'CRITICAL', emailError: { not: null }, emailSentAt: null, createdAt: { gte: since } },
      include: { user: { select: { email: true } } },
    });

    let succeeded = 0;
    for (const activity of failed) {
      if (!activity.user.email) continue;
      try {
        await this.email.sendCriticalActivityRetry(activity.user.email, activity.title, activity.body ?? activity.title);
        await this.prisma.activity.update({ where: { id: activity.id }, data: { emailSentAt: new Date(), emailError: null } });
        succeeded++;
      } catch (err) {
        this.logger.error(`Nouvel échec de réenvoi pour l'activité ${activity.id} : ${(err as Error).message}`);
        await this.prisma.activity
          .update({ where: { id: activity.id }, data: { emailError: (err as Error).message } })
          .catch(() => {});
      }
    }
    return { retried: failed.length, succeeded };
  }
}
