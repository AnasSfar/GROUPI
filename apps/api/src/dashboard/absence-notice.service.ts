import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAbsenceNoticeDto } from './dto/create-absence-notice.dto';

/**
 * Ch.16.4/RM-DSH-006 : signalement par le Parent de l'absence prévisible de son enfant, avant le
 * début d'une séance. Ne touche jamais `Attendance` — voir le commentaire du modèle `AbsenceNotice`
 * dans le schéma Prisma pour la justification complète (simplification du délai, notamment).
 */
@Injectable()
export class AbsenceNoticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
  ) {}

  private toView(notice: {
    id: string;
    sessionId: string;
    studentId: string;
    reason: string | null;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: notice.id,
      sessionId: notice.sessionId,
      studentId: notice.studentId,
      reason: notice.reason,
      comment: notice.comment,
      createdAt: notice.createdAt,
      updatedAt: notice.updatedAt,
    };
  }

  /**
   * RM-ATT-016/020/ERR-ATT-007 : le référentiel prévoit un signalement "jusqu'à 24 heures avant" la
   * séance comme USAGE PRÉVU, mais RM-ATT-020 est clair — ce signalement n'est qu'une information
   * transmise au Professeur, jamais un acte bloquant. ERR-ATT-007 confirme explicitement qu'un
   * signalement fait après le début théorique de la séance reste ACCEPTÉ ("Signalement accepté
   * mais statut laissé à la discrétion du Professeur") : il n'y a donc ni rejet automatique après
   * le début, ni fenêtre stricte de 24h imposée en amont (ça bloquerait un cas que le référentiel
   * veut au contraire laisser passer). Ancien comportement corrigé : ce service rejetait tout
   * signalement passé le début théorique de la séance (ERR-DSH-007, Annexe catalogue erreurs
   * Ch.16) — ce code catalogue concerne le tableau de bord (Ch.16) et est en tension directe avec
   * ERR-ATT-007/RM-ATT-016/020 (Ch.14) sur ce point précis ; on retient ici l'interprétation Ch.14,
   * plus récente et plus spécifique à la présence. Seul reste un rejet si la séance n'existe plus
   * "à signaler" (PLANNED est le seul statut qui accepte encore un signalement — COMPLETED/LOCKED/
   * CANCELLED/POSTPONED en sont tous exclus, POSTPONED étant remplacée par une nouvelle séance et
   * LOCKED n'étant atteignable qu'après COMPLETED). Un second appel avant ce point corrige le
   * signalement précédent (upsert) plutôt que d'en créer un doublon.
   */
  async create(parentId: string, sessionId: string, dto: CreateAbsenceNoticeDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { group: { select: { id: true, name: true, teacherId: true, teacher: { select: { id: true } } } } },
    });
    if (!session) {
      throw new NotFoundException('Séance introuvable');
    }

    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student || student.parentId !== parentId) {
      throw new ForbiddenException("Cet élève n'appartient pas à votre compte");
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { groupId: session.groupId, studentId: dto.studentId, status: 'ACTIVE' },
    });
    if (!enrollment) {
      throw new BadRequestException("Élève non inscrit activement à ce groupe");
    }

    if (session.status !== 'PLANNED') {
      throw new BadRequestException('Cette séance ne peut plus recevoir de signalement (ERR-ATT-019)');
    }

    const notice = await this.prisma.absenceNotice.upsert({
      where: { sessionId_studentId: { sessionId, studentId: dto.studentId } },
      create: {
        sessionId,
        studentId: dto.studentId,
        enrollmentId: enrollment.id,
        parentId,
        reason: dto.reason,
        comment: dto.comment,
      },
      update: { reason: dto.reason, comment: dto.comment },
    });

    // RM-DSH-006 : "le Professeur reçoit une notification immédiate" — pas de code NOT-DSH dédié
    // dans le référentiel pour ce déclencheur précis (voir EmailService.sendAbsenceNoticeReported).
    const teacherUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: session.group.teacherId },
      select: { email: true },
    });
    await this.notifications.notify({
      recipientUserId: session.group.teacherId,
      type: 'DSH_ABSENCE_NOTICE',
      priority: 'IMPORTANT',
      title: 'Absence signalée par un Parent',
      body: `${student.firstName} ${student.lastName} — absence prévisible signalée pour la séance du ${session.date.toLocaleDateString('fr-FR')} à ${session.startTime} (groupe "${session.group.name}").`,
      refType: 'Session',
      refId: session.id,
      sendEmail: () =>
        this.email.sendAbsenceNoticeReported(
          teacherUser.email,
          `${student.firstName} ${student.lastName}`,
          session.group.name,
          session.date,
          session.startTime,
        ),
    });

    return this.toView(notice);
  }

  /** Vue Professeur : signalements reçus pour une séance dont il est propriétaire. */
  async listForSession(teacherId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId }, include: { group: true } });
    if (!session) {
      throw new NotFoundException('Séance introuvable');
    }
    if (session.group.teacherId !== teacherId) {
      throw new ForbiddenException("Cette séance n'appartient pas à votre compte");
    }
    const notices = await this.prisma.absenceNotice.findMany({
      where: { sessionId },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return notices.map((n) => ({ ...this.toView(n), student: n.student }));
  }
}
