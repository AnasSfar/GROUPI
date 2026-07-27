import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Activity, ActivityPriority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

  async notify(input: NotifyInput): Promise<Activity> {
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

  /** RM-NOT-005 : classées de la plus récente à la plus ancienne. */
  async listMine(userId: string, filter?: 'all' | 'unread') {
    return this.prisma.activity.findMany({
      where: { userId, ...(filter === 'unread' ? { readAt: null } : {}) },
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
}
