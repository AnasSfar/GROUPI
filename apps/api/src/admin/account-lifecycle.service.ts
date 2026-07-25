import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

interface TransitionMeta {
  ipAddress?: string;
}

@Injectable()
export class AccountLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(status?: UserStatus) {
    return this.prisma.user.findMany({
      where: status ? { status } : undefined,
      select: {
        id: true,
        email: true,
        status: true,
        roles: true,
        createdAt: true,
        teacherProfile: { select: { firstName: true, lastName: true } },
        parentProfile: { select: { firstName: true, lastName: true } },
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

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: {
          status: toStatus,
          ...(revokesSessions ? { tokenVersion: { increment: 1 } } : {}),
        },
        select: { id: true, email: true, status: true, roles: true, updatedAt: true },
      });

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
  }
}
