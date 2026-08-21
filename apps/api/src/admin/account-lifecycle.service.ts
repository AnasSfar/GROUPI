import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

/** RM-CYC-014 : statuts pour lesquels la notification (priorité CRITICAL) est aussi envoyée par e-mail. */
const CRITICAL_EMAIL_STATUSES = new Set<UserStatus>(['SUSPENDED', 'DISABLED', 'ARCHIVED']);

/** RM-CYC-002/003 : seules ces transitions sont autorisées, toute autre est refusée (ERR-CYC-004). */
const ALLOWED_TRANSITIONS: Record<UserStatus, UserStatus[]> = {
  PENDING_VALIDATION: ['ACTIVE'],
  ACTIVE: ['SUSPENDED', 'DISABLED'],
  SUSPENDED: ['ACTIVE', 'DISABLED'],
  DISABLED: ['ARCHIVED'], // Version 2, non exposé par un endpoint pour l'instant
  ARCHIVED: [],
};

const ACTION_BY_STATUS: Record<UserStatus, string> = {
  PENDING_VALIDATION: 'ACCOUNT_PENDING',
  ACTIVE: 'ACCOUNT_ACTIVATED',
  SUSPENDED: 'ACCOUNT_SUSPENDED',
  DISABLED: 'ACCOUNT_DISABLED',
  ARCHIVED: 'ACCOUNT_ARCHIVED',
};

/** RM-CYC-014/032/033 : priorité de la notification envoyée au titulaire du compte selon le nouvel état. */
const NOTIFICATION_PRIORITY_BY_STATUS: Record<UserStatus, 'INFORMATION' | 'IMPORTANT' | 'CRITICAL'> = {
  PENDING_VALIDATION: 'INFORMATION',
  ACTIVE: 'IMPORTANT',
  SUSPENDED: 'CRITICAL',
  DISABLED: 'CRITICAL',
  ARCHIVED: 'CRITICAL',
};

const NOTIFICATION_TITLE_BY_STATUS: Record<UserStatus, string> = {
  PENDING_VALIDATION: 'Compte en attente de validation',
  ACTIVE: 'Votre compte a été activé',
  SUSPENDED: 'Votre compte a été suspendu',
  DISABLED: 'Votre compte a été désactivé',
  ARCHIVED: 'Votre compte a été archivé',
};

interface TransitionMeta {
  ipAddress?: string;
}

@Injectable()
export class AccountLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
  ) {}

  async listUsers(status?: UserStatus) {
    return this.prisma.user.findMany({
      where: status ? { status } : undefined,
      select: {
        id: true,
        email: true,
        status: true,
        roles: true,
        createdAt: true,
        teacherProfile: { select: { firstName: true, lastName: true, phone: true } },
        parentProfile: { select: { firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** RM-CYC-033 : chaque transition est atomique (statut, sessions, jetons, audit ensemble). */
  async transition(
    actorUserId: string,
    targetUserId: string,
    toStatus: UserStatus,
    reason: string,
    comment: string | undefined,
    meta: TransitionMeta = {},
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { teacherProfile: { include: { subjects: true, schoolLevels: true } } },
    });
    if (!target) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // RM-CYC-030 : le Super Administrateur ne peut jamais être suspendu/désactivé/archivé.
    if (target.roles.includes('SUPER_ADMIN')) {
      throw new BadRequestException('Le compte Super Administrateur ne peut pas être modifié');
    }

    const allowed = ALLOWED_TRANSITIONS[target.status] ?? [];
    if (!allowed.includes(toStatus)) {
      // RM-CYC-026 : une tentative de transition refusée reste tracée dans l'audit, même si elle
      // n'a produit aucun changement d'état.
      await this.prisma.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'ACCOUNT_TRANSITION_DENIED',
          targetType: 'User',
          targetId: targetUserId,
          oldValues: { status: target.status },
          newValues: { attemptedStatus: toStatus },
          ipAddress: meta.ipAddress,
        },
      });
      throw new BadRequestException(
        `Transition interdite : ${target.status} -> ${toStatus} (ERR-CYC-004)`,
      );
    }

    // Ch.8.5 : un Professeur ne peut être validé que si son profil a au moins une matière et un niveau.
    if (toStatus === 'ACTIVE' && target.roles.includes('TEACHER')) {
      const subjects = target.teacherProfile?.subjects.length ?? 0;
      const levels = target.teacherProfile?.schoolLevels.length ?? 0;
      if (subjects === 0 || levels === 0) {
        throw new BadRequestException(
          'Profil professeur incomplet : au moins une matière et un niveau scolaire sont requis avant validation',
        );
      }
    }

    const revokesSessions = toStatus === 'SUSPENDED' || toStatus === 'DISABLED';

    const updated = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: {
          status: toStatus,
          ...(revokesSessions ? { tokenVersion: { increment: 1 } } : {}),
        },
        select: { id: true, email: true, status: true, roles: true, updatedAt: true },
      });

      // Ch.5.7 : le statut du profil professionnel suit le statut du compte (ACTIVE -> VALIDATED,
      // SUSPENDED -> SUSPENDED). DISABLED/ARCHIVED n'ont pas d'équivalent dans TeacherProfileStatus
      // et n'ont pas d'incidence pratique puisque le compte ne peut plus se connecter.
      if (target.roles.includes('TEACHER')) {
        if (toStatus === 'ACTIVE') {
          await tx.teacherProfile.update({
            where: { id: targetUserId },
            data: { status: 'VALIDATED' },
          });
        } else if (toStatus === 'SUSPENDED') {
          await tx.teacherProfile.update({
            where: { id: targetUserId },
            data: { status: 'SUSPENDED' },
          });
        }
      }

      // RM-PAR-013 : le compte Parent est validé après vérification par un Administrateur.
      if (target.roles.includes('PARENT') && toStatus === 'ACTIVE') {
        await tx.parentProfile.update({
          where: { id: targetUserId },
          data: { validatedAt: new Date() },
        });
      }

      if (revokesSessions) {
        // RM-CYC-027 : rendre le compte indisponible invalide immédiatement sessions et jetons.
        await tx.userSession.updateMany({
          where: { userId: targetUserId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: ACTION_BY_STATUS[toStatus],
          targetType: 'User',
          targetId: targetUserId,
          oldValues: { status: target.status },
          newValues: { status: toStatus, reason, comment: comment ?? null },
          ipAddress: meta.ipAddress,
        },
      });

      return updated;
    });

    // RM-CYC-014/032/033 : la notification n'est émise qu'une fois le changement d'état et l'audit
    // validés par la transaction ci-dessus — jamais avant, et jamais si la transaction a échoué.
    // Hors chemin critique (Ch.24) : un échec de notification ne doit jamais invalider la transition
    // déjà appliquée.
    const title = NOTIFICATION_TITLE_BY_STATUS[toStatus];
    const body = comment ?? reason;
    const targetEmail = updated.email;
    await this.notifications.notify({
      recipientUserId: targetUserId,
      type: ACTION_BY_STATUS[toStatus],
      priority: NOTIFICATION_PRIORITY_BY_STATUS[toStatus],
      title,
      body,
      refType: 'User',
      refId: targetUserId,
      // RM-CYC-014 : e-mail effectif en plus de l'activité en-app pour les transitions critiques
      // (suspension/désactivation/archivage) — PENDING_VALIDATION/ACTIVE restent notification interne
      // uniquement (priorité non-critique).
      sendEmail: CRITICAL_EMAIL_STATUSES.has(toStatus) && targetEmail
        ? () => this.email.sendAccountStatusChanged(targetEmail, title, body)
        : undefined,
    });

    return updated;
  }
}
