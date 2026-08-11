import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GroupAnnouncement } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

export type EffectiveStatus = 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'DELETED';

/** RM-COM-016 : conservation légale de 7 ans à compter de la clôture (ici l'archivage du groupe). */
const RETENTION_YEARS = 7;

/**
 * Ch.19.4 : "statut effectif" calculé à la lecture, jamais stocké — même principe que
 * `computeLockDeadline`/`isLockable` pour le verrouillage des séances (sessions.service.ts).
 */
export function computeEffectiveStatus(a: {
  publishAt: Date;
  expiresAt: Date | null;
  deletedAt: Date | null;
}): EffectiveStatus {
  if (a.deletedAt) return 'DELETED';
  const now = new Date();
  if (a.publishAt > now) return 'SCHEDULED';
  if (a.expiresAt && a.expiresAt <= now) return 'EXPIRED';
  return 'PUBLISHED';
}

@Injectable()
export class GroupAnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async loadOwnedGroup(teacherId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException("Ce groupe n'appartient pas à votre compte");
    }
    return group;
  }

  /** ERR-COM-001/006 : un Parent ne peut consulter que les annonces d'un groupe où il a un élève. */
  private async assertParentInGroup(parentId: string, groupId: string): Promise<void> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { groupId, student: { parentId } },
    });
    if (!enrollment) {
      throw new ForbiddenException("Vous n'avez aucune inscription dans ce groupe (ERR-COM-001/006)");
    }
  }

  private async activeParentUserIds(groupId: string): Promise<string[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { groupId, status: 'ACTIVE' },
      select: { student: { select: { parentId: true } } },
    });
    return [...new Set(enrollments.map((e) => e.student.parentId))];
  }

  private async withReadStats(announcement: GroupAnnouncement) {
    const [reads, activeParents] = await Promise.all([
      this.prisma.groupAnnouncementRead.findMany({ where: { announcementId: announcement.id } }),
      this.activeParentUserIds(announcement.groupId),
    ]);
    const readParentIds = new Set(reads.map((r) => r.parentId));
    return {
      ...announcement,
      effectiveStatus: computeEffectiveStatus(announcement),
      readCount: readParentIds.size,
      totalParents: activeParents.length,
      unreadParents: activeParents.filter((id) => !readParentIds.has(id)),
    };
  }

  /** Ch.19.4/ERR-COM-003/007 : création, publication immédiate ou programmée. */
  async createForGroup(teacherId: string, groupId: string, dto: CreateAnnouncementDto) {
    const group = await this.loadOwnedGroup(teacherId, groupId);
    if (group.status === 'ARCHIVED') {
      throw new BadRequestException('Groupe archivé : annonce impossible (ERR-COM-003)');
    }

    let publishAt = new Date();
    if (dto.scheduled) {
      if (!dto.publishAt) {
        throw new BadRequestException('Une date de publication est requise pour une annonce programmée (ERR-COM-007)');
      }
      publishAt = new Date(dto.publishAt);
      if (publishAt <= new Date()) {
        throw new BadRequestException('La date de publication programmée doit être dans le futur (ERR-COM-007)');
      }
    }

    const announcement = await this.prisma.groupAnnouncement.create({
      data: {
        groupId,
        createdById: teacherId,
        title: dto.title,
        body: dto.body,
        publishAt,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    // NOT-COM-003 : uniquement en cas de publication immédiate — une annonce programmée ne notifie
    // qu'à sa parution effective (NOT-COM-006), prise en charge par `TemporalJobsService`.
    if (!dto.scheduled) {
      const parentIds = await this.activeParentUserIds(groupId);
      for (const parentId of parentIds) {
        await this.notifications.notify({
          recipientUserId: parentId,
          type: 'COM_ANNOUNCEMENT_CREATED',
          priority: 'IMPORTANT',
          title: 'Nouvelle annonce de groupe',
          body: `${group.name} : ${dto.title}`,
          refType: 'GroupAnnouncement',
          refId: announcement.id,
        });
      }
    }

    return this.withReadStats(announcement);
  }

  async listForTeacher(teacherId: string, groupId: string) {
    await this.loadOwnedGroup(teacherId, groupId);
    const announcements = await this.prisma.groupAnnouncement.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(announcements.map((a) => this.withReadStats(a)));
  }

  /**
   * RM-COM-013 : le Super Administrateur peut consulter les annonces de n'importe quel groupe dans
   * le cadre d'une procédure d'assistance/audit — lecture seule, aucune vérification de propriété
   * (contrairement à `listForTeacher`), jamais exposé pour la création/modification/suppression.
   */
  async listForSuperAdmin(groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    const announcements = await this.prisma.groupAnnouncement.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(announcements.map((a) => this.withReadStats(a)));
  }

  /** Ch.19.4 : côté Parent, seules les annonces effectivement publiées et non expirées sont visibles. */
  async listForParent(parentUserId: string, groupId: string) {
    await this.assertParentInGroup(parentUserId, groupId);
    const now = new Date();
    const announcements = await this.prisma.groupAnnouncement.findMany({
      where: {
        groupId,
        deletedAt: null,
        publishAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { publishAt: 'desc' },
    });
    return announcements.map((a) => ({ ...a, effectiveStatus: computeEffectiveStatus(a) }));
  }

  private async loadOwnedAnnouncement(teacherId: string, id: string): Promise<GroupAnnouncement> {
    const announcement = await this.prisma.groupAnnouncement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Annonce introuvable');
    }
    await this.loadOwnedGroup(teacherId, announcement.groupId);
    return announcement;
  }

  /** RM-COM-… (§19.4) : modifiable tant que non expirée et pas encore lue par tous les Parents actifs. */
  async update(teacherId: string, id: string, dto: UpdateAnnouncementDto) {
    const announcement = await this.loadOwnedAnnouncement(teacherId, id);
    if (computeEffectiveStatus(announcement) === 'EXPIRED') {
      throw new BadRequestException('Annonce expirée : modification interdite (ERR-COM-005)');
    }
    const withStats = await this.withReadStats(announcement);
    if (withStats.totalParents > 0 && withStats.unreadParents.length === 0) {
      throw new BadRequestException('Annonce déjà lue par tous les Parents : modification refusée (§19.4)');
    }

    const updated = await this.prisma.groupAnnouncement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.expiresAt !== undefined ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null } : {}),
      },
    });

    // NOT-COM-004
    const parentIds = await this.activeParentUserIds(announcement.groupId);
    for (const parentId of parentIds) {
      await this.notifications.notify({
        recipientUserId: parentId,
        type: 'COM_ANNOUNCEMENT_UPDATED',
        priority: 'IMPORTANT',
        title: 'Annonce de groupe mise à jour',
        body: `${updated.title}`,
        refType: 'GroupAnnouncement',
        refId: updated.id,
      });
    }

    return this.withReadStats(updated);
  }

  /** RM-COM-014 : suppression logique uniquement, historique conservé. */
  async remove(teacherId: string, id: string) {
    await this.loadOwnedAnnouncement(teacherId, id);
    return this.prisma.groupAnnouncement.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** RM-COM-011 : seule la première lecture est enregistrée. */
  async markRead(parentUserId: string, id: string): Promise<{ readAt: Date }> {
    const announcement = await this.prisma.groupAnnouncement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Annonce introuvable');
    }
    await this.assertParentInGroup(parentUserId, announcement.groupId);

    await this.prisma.groupAnnouncementRead.createMany({
      data: [{ announcementId: id, parentId: parentUserId }],
      skipDuplicates: true,
    });
    const read = await this.prisma.groupAnnouncementRead.findUniqueOrThrow({
      where: { announcementId_parentId: { announcementId: id, parentId: parentUserId } },
    });
    return { readAt: read.readAt };
  }

  /**
   * RM-COM-016 : politique de conservation légale de 7 ans — passé ce délai, suppression physique
   * (seule dérogation à RM-COM-014, qui interdit la suppression physique en usage courant/métier).
   * `Group` ne porte pas de champ `archivedAt` dédié : `updatedAt` est utilisé comme meilleure
   * approximation disponible de la date de bascule vers `ARCHIVED` (aucune autre écriture n'est
   * censée avoir lieu sur un groupe archivé). Appelée mensuellement par `TemporalJobsService`.
   * Les lectures (`GroupAnnouncementRead`) sont purgées avant les annonces pour respecter la
   * contrainte de clé étrangère.
   */
  async purgeOldAnnouncements(now = new Date()): Promise<number> {
    const cutoff = new Date(now);
    cutoff.setFullYear(cutoff.getFullYear() - RETENTION_YEARS);
    const stale = await this.prisma.groupAnnouncement.findMany({
      where: { group: { status: 'ARCHIVED', updatedAt: { lte: cutoff } } },
      select: { id: true },
    });
    if (stale.length === 0) {
      return 0;
    }
    const ids = stale.map((a) => a.id);
    await this.prisma.$transaction([
      this.prisma.groupAnnouncementRead.deleteMany({ where: { announcementId: { in: ids } } }),
      this.prisma.groupAnnouncement.deleteMany({ where: { id: { in: ids } } }),
    ]);
    return ids.length;
  }
}
