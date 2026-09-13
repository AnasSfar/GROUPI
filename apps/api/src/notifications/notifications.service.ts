import { Injectable, NotFoundException } from '@nestjs/common';
import { Activity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MessagingService, NotifyInput } from '../messaging/messaging.service';

export type { NotifyInput } from '../messaging/messaging.service';

/**
 * Ch.18 : centre d'activités personnel de chaque utilisateur — lecture, marquage lu/non lu,
 * archivage (RM-NOT-004/005/010/011). L'écriture (création d'une `Activity`) est déléguée à
 * `MessagingService` (Avenant 01, Ch. I.4/I.7, RM-NOT-051) : ce service n'appelle plus aucun
 * fournisseur externe lui-même (`EmailService`/le module `email/` ont été retirés) — `notify()` est
 * conservé ici uniquement pour ne pas renommer l'injection dans les ~20 services déclencheurs déjà
 * existants ; le point d'entrée normatif de l'avenant reste `MessagingService.notify`.
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messaging: MessagingService,
  ) {}

  async notify(input: NotifyInput): Promise<Activity> {
    return this.messaging.notify(input);
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

  // Avenant 01, Ch. I.4/I.7 (RM-NOT-050/052) : `retryFailedCriticalEmails` (V1.0) a été retiré —
  // en V1.1 il n'existe plus de canal e-mail à réessayer, le seul canal actif (`IN_APP`) ne connaît
  // pas d'échec de livraison au sens où `EmailService` en connaissait. `Activity.emailSentAt`/
  // `emailError` restent en base (nullable, non lus par le code applicatif) plutôt que de déclencher
  // une nouvelle migration pour les retirer — même décision que pour `User.email` (Ch. I.9).
}
