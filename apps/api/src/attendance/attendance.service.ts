import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AbsenceBillingPolicy, ActivityPriority, Attendance, AttendanceStatus, Session } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AccountingService } from '../accounting/accounting.service';
import { computeLockDeadline, isLockable, theoreticalStart } from '../sessions/sessions.service';
import { SetAttendanceDto } from './dto/set-attendance.dto';
import type { AttendanceStatsPeriod } from './dto/attendance-stats-query.dto';

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function todayDateOnly(): Date {
  return dateOnly(new Date());
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Ch.14.4/14.6 : Présent et Retard sont toujours facturés (RM-ATT-005/017). Le sort d'une absence
 * dépend exclusivement de `Group.absenceBillingPolicy` (Ch.10) — champ purement calculé, jamais
 * persisté : la génération d'écritures comptables réelles relève du domaine Comptable (Ch.15,
 * non construit — voir progress.md, "Hors scope"), ce champ ne fait qu'exposer le résultat de la
 * règle de facturation pour permettre à l'UI/aux futurs consommateurs de l'afficher dès maintenant.
 */
function isBillable(status: AttendanceStatus, policy: AbsenceBillingPolicy): boolean {
  if (status === 'PRESENT' || status === 'LATE') return true;
  if (policy === 'ALL_BILLED') return true;
  if (policy === 'NONE_BILLED') return false;
  return status === 'UNEXCUSED_ABSENT'; // EXCUSED_NOT_BILLED : seule l'absence non excusée reste facturée
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Présent',
  LATE: 'Retard',
  EXCUSED_ABSENT: 'Absent excusé',
  UNEXCUSED_ABSENT: 'Absent non excusé',
};

/** Annexe H : NOT-ATT-001/004 (Présent/Retard) sont Information — pas d'e-mail ; NOT-ATT-002/003
 *  (absences) sont Important — e-mail en plus du centre d'activités. */
const ATT_PRIORITY: Record<AttendanceStatus, ActivityPriority> = {
  PRESENT: 'INFORMATION',
  LATE: 'INFORMATION',
  EXCUSED_ABSENT: 'IMPORTANT',
  UNEXCUSED_ABSENT: 'IMPORTANT',
};

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly accounting: AccountingService,
  ) {}

  // ---------------------------------------------------------------------------------------------
  // Rattachement / propriété — chaque module pédagogique duplique son propre contrôle de propriété
  // plutôt que d'importer les services voisins (cf. SessionsService/EnrollmentsService).
  // ---------------------------------------------------------------------------------------------

  private async loadOwnedSession(teacherId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { group: true },
    });
    if (!session) {
      throw new NotFoundException('Séance introuvable');
    }
    if (session.group.teacherId !== teacherId) {
      throw new ForbiddenException("Cette séance n'appartient pas à votre compte (ERR-ATT-011)");
    }
    return session;
  }

  private async loadOwnedGroup(teacherId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { academicYear: true },
    });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException("Ce groupe n'appartient pas à votre compte");
    }
    return group;
  }

  /**
   * Ch.14.7/RM-ATT-029 : verrouillage automatique à l'expiration des 48h — appliqué paresseusement
   * à la lecture, exactement comme l'expiration EXPIRED des Enrollment (aucun job planifié dans ce
   * projet, voir EnrollmentsService.expireIfDue).
   */
  private async lockIfDue<T extends Session>(session: T): Promise<T> {
    if (session.status !== 'COMPLETED' || !isLockable(session)) {
      return session;
    }
    const lockedAt = computeLockDeadline(session) ?? new Date();
    await this.prisma.session.update({ where: { id: session.id }, data: { status: 'LOCKED', lockedAt } });
    return { ...session, status: 'LOCKED', lockedAt };
  }

  private toAttendanceView(attendance: Attendance, policy: AbsenceBillingPolicy) {
    return {
      id: attendance.id,
      status: attendance.status,
      statusLabel: STATUS_LABELS[attendance.status],
      lateDuration: attendance.lateDuration,
      comment: attendance.comment,
      recordedAt: attendance.recordedAt,
      recordedById: attendance.recordedById,
      modifiedAt: attendance.modifiedAt,
      billable: isBillable(attendance.status, policy),
    };
  }

  private toSessionView<T extends Session>(session: T) {
    return {
      id: session.id,
      groupId: session.groupId,
      date: session.date,
      startTime: session.startTime,
      durationMinutes: session.durationMinutes,
      status: session.status,
      lockDeadline: computeLockDeadline(session),
      locked: session.status === 'LOCKED',
    };
  }

  // --- Saisie (vue Professeur) ---------------------------------------------------------------

  /**
   * Ch.14.3 : élèves éligibles à la saisie de présence pour une séance — inscriptions ACTIVE du
   * groupe. Simplification assumée (comme le reste du domaine Pédagogique) : `Enrollment` ne porte
   * pas de plage de dates propre, donc "actif à la date de la séance" est approximé par le statut
   * ACTIVE courant plutôt que par un historique de statuts.
   */
  async list(teacherId: string, sessionId: string) {
    const session = await this.lockIfDue(await this.loadOwnedSession(teacherId, sessionId));

    const [enrollments, attendances] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { groupId: session.groupId, status: 'ACTIVE' },
        include: { student: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { student: { lastName: 'asc' } },
      }),
      this.prisma.attendance.findMany({ where: { sessionId } }),
    ]);
    const byStudent = new Map(attendances.map((a) => [a.studentId, a]));
    const policy = session.group.absenceBillingPolicy;

    return {
      session: this.toSessionView(session),
      entries: enrollments.map((e) => {
        const a = byStudent.get(e.studentId);
        return {
          enrollmentId: e.id,
          student: e.student,
          attendance: a ? this.toAttendanceView(a, policy) : null,
        };
      }),
    };
  }

  /** Ch.14.3/14.4/14.7 : saisie initiale ou correction (progressive, un élève à la fois). */
  async setOne(teacherId: string, sessionId: string, studentId: string, dto: SetAttendanceDto) {
    const session = await this.lockIfDue(await this.loadOwnedSession(teacherId, sessionId));

    if (session.status === 'CANCELLED') {
      throw new BadRequestException('Séance annulée : saisie impossible (ERR-ATT-003)');
    }
    if (session.status === 'POSTPONED') {
      throw new BadRequestException('Séance reportée : saisie impossible sur cette occurrence (ERR-ATT-003)');
    }
    if (session.status === 'LOCKED') {
      throw new BadRequestException('Présence verrouillée : modification refusée (ERR-ATT-001/ERR-ATT-014)');
    }
    if (theoreticalStart(session) > new Date()) {
      throw new BadRequestException('Séance non encore commencée : saisie refusée (ERR-ATT-004)');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { groupId: session.groupId, studentId },
    });
    if (!enrollment) {
      throw new BadRequestException("Élève non inscrit au groupe (ERR-ATT-002)");
    }
    if (enrollment.status === 'SUSPENDED') {
      throw new BadRequestException('Inscription suspendue : présence impossible (ERR-ATT-012)');
    }
    if (enrollment.status === 'ARCHIVED') {
      throw new BadRequestException('Inscription archivée : présence impossible (ERR-ATT-013)');
    }
    if (enrollment.status !== 'ACTIVE') {
      throw new BadRequestException('Élève non inscrit activement au groupe (ERR-ATT-002)');
    }

    if (dto.status === 'LATE') {
      if (dto.lateDuration === undefined) {
        throw new BadRequestException('Durée de retard requise pour le statut Retard (ERR-ATT-022)');
      }
      if (dto.lateDuration <= 0) {
        throw new BadRequestException('Retard négatif ou nul refusé (ERR-ATT-016)');
      }
      if (dto.lateDuration > session.durationMinutes) {
        throw new BadRequestException('Retard supérieur à la durée de la séance (ERR-ATT-017)');
      }
    }
    const lateDuration = dto.status === 'LATE' ? dto.lateDuration! : null;

    const group = await this.prisma.group.findUniqueOrThrow({ where: { id: session.groupId } });

    const existing = await this.prisma.attendance.findUnique({
      where: { sessionId_studentId: { sessionId, studentId } },
    });

    const attendance = await this.prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.attendance.update({
            where: { id: existing.id },
            data: {
              status: dto.status,
              lateDuration,
              comment: dto.comment,
              modifiedAt: new Date(),
            },
          })
        : await tx.attendance.create({
            data: {
              sessionId,
              studentId,
              enrollmentId: enrollment.id,
              status: dto.status,
              lateDuration,
              comment: dto.comment,
              recordedAt: new Date(),
              recordedById: teacherId,
            },
          });

      await tx.attendanceHistory.create({
        data: {
          attendanceId: saved.id,
          previousStatus: existing?.status ?? null,
          previousLateDuration: existing?.lateDuration ?? null,
          newStatus: dto.status,
          newLateDuration: lateDuration,
          reason: dto.reason,
          changedById: teacherId,
        },
      });

      return saved;
    });

    return this.toAttendanceView(attendance, group.absenceBillingPolicy);
  }

  /**
   * EVT-ATT-018 : avant la validation définitive, le Professeur peut remettre une présence à
   * NON_RENSEIGNEE. Autorisé uniquement tant que la séance n'a pas été validée (PLANNED) — une fois
   * validée (COMPLETED/LOCKED), RM-ATT-011 s'applique et plus aucune présence n'est supprimée.
   */
  async reset(teacherId: string, sessionId: string, studentId: string) {
    const session = await this.loadOwnedSession(teacherId, sessionId);
    if (session.status !== 'PLANNED') {
      throw new BadRequestException(
        'Séance déjà validée : la présence ne peut plus être supprimée, seule une correction est autorisée (RM-ATT-011)',
      );
    }
    const attendance = await this.prisma.attendance.findUnique({
      where: { sessionId_studentId: { sessionId, studentId } },
    });
    if (!attendance) {
      throw new NotFoundException('Présence inexistante (ERR-ATT-020)');
    }
    await this.prisma.$transaction([
      this.prisma.attendanceHistory.deleteMany({ where: { attendanceId: attendance.id } }),
      this.prisma.attendance.delete({ where: { id: attendance.id } }),
    ]);
    return { studentId, reset: true };
  }

  /** Ch.14.3/RM-ATT-027 : validation définitive — exige un statut pour chaque élève actif. */
  async validate(teacherId: string, sessionId: string) {
    const session = await this.lockIfDue(await this.loadOwnedSession(teacherId, sessionId));

    if (session.status === 'COMPLETED' || session.status === 'LOCKED') {
      throw new BadRequestException('Présence déjà validée : nouvelle validation impossible (ERR-ATT-005)');
    }
    if (session.status === 'CANCELLED') {
      throw new BadRequestException('Séance annulée : validation impossible (ERR-ATT-003)');
    }
    if (session.status === 'POSTPONED') {
      throw new BadRequestException('Séance reportée : validation impossible sur cette occurrence (ERR-ATT-003)');
    }
    if (theoreticalStart(session) > new Date()) {
      throw new BadRequestException('Séance non encore commencée : validation refusée (ERR-ATT-004)');
    }

    const [eligible, attendances] = await Promise.all([
      this.prisma.enrollment.findMany({ where: { groupId: session.groupId, status: 'ACTIVE' } }),
      this.prisma.attendance.findMany({ where: { sessionId }, select: { studentId: true } }),
    ]);
    const covered = new Set(attendances.map((a) => a.studentId));
    const missing = eligible.filter((e) => !covered.has(e.studentId));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Tous les élèves doivent recevoir un statut avant validation (${missing.length} manquant(s), RM-ATT-027)`,
      );
    }

    await this.prisma.session.update({ where: { id: sessionId }, data: { status: 'COMPLETED' } });

    // NOT-ATT-001/002/003/004 : une Activity par élève dans tous les cas (RM-NOT-004) ; l'e-mail
    // n'est envoyé que pour les absences (Important), pas pour Présent/Retard (Information) —
    // correction assumée par rapport au comportement précédent qui envoyait un e-mail systématique.
    const notified = await this.prisma.attendance.findMany({
      where: { sessionId },
      include: {
        student: {
          select: { firstName: true, lastName: true, parentId: true, parent: { select: { user: { select: { email: true } } } } },
        },
      },
    });
    for (const a of notified) {
      const label = STATUS_LABELS[a.status];
      const priority = ATT_PRIORITY[a.status];
      await this.notifications.notify({
        recipientUserId: a.student.parentId,
        type: `ATT_${a.status}`,
        priority,
        title: 'Présence enregistrée',
        body: `${a.student.firstName} ${a.student.lastName} est marqué "${label}" à la séance du ${session.date.toLocaleDateString('fr-FR')}.`,
        refType: 'Attendance',
        refId: a.id,
        sendEmail:
          priority === 'INFORMATION'
            ? undefined
            : () =>
                this.email.sendAttendanceRecorded(
                  a.student.parent.user.email,
                  `${a.student.firstName} ${a.student.lastName}`,
                  label,
                  session.date,
                ),
      });
    }

    // RM-CPT-009/040 : une écriture SESSION par présence facturable (Ch.15.9), jamais pour les
    // présences non facturables (absence non facturée selon la politique du groupe).
    const billable = notified
      .filter((a) => isBillable(a.status, session.group.absenceBillingPolicy))
      .map((a) => ({ enrollmentId: a.enrollmentId, studentId: a.studentId }));
    await this.accounting.billValidatedSession({ id: session.id, groupId: session.groupId, date: session.date }, billable);

    // NOT-ATT-006/NOT-SES-010 : alerte d'abandon au Professeur, uniquement au franchissement exact
    // du seuil (pas à chaque absence suivante, pour ne notifier qu'une fois par élève).
    const newlyUnexcused = notified.filter((a) => a.status === 'UNEXCUSED_ABSENT');
    if (newlyUnexcused.length > 0) {
      const threshold = session.group.abandonmentThreshold;
      const history = await this.prisma.attendance.findMany({
        where: {
          studentId: { in: newlyUnexcused.map((a) => a.studentId) },
          session: { groupId: session.groupId, status: { in: ['COMPLETED', 'LOCKED'] } },
        },
        include: { session: { select: { date: true, startTime: true } } },
        orderBy: [{ session: { date: 'desc' } }, { session: { startTime: 'desc' } }],
      });
      const byStudent = new Map<string, typeof history>();
      for (const a of history) {
        byStudent.set(a.studentId, [...(byStudent.get(a.studentId) ?? []), a]);
      }
      const toAlert = newlyUnexcused.filter((a) => {
        const list = byStudent.get(a.studentId) ?? [];
        let streak = 0;
        for (const entry of list) {
          if (entry.status !== 'UNEXCUSED_ABSENT') break;
          streak += 1;
        }
        return streak === threshold;
      });
      if (toAlert.length > 0) {
        const teacher = await this.prisma.user.findUniqueOrThrow({
          where: { id: session.group.teacherId },
          select: { email: true },
        });
        for (const a of toAlert) {
          await this.notifications.notify({
            recipientUserId: session.group.teacherId,
            type: 'ATT_ABANDONMENT_THRESHOLD',
            priority: 'CRITICAL',
            title: 'Alerte d’abandon',
            body: `${a.student.firstName} ${a.student.lastName} totalise ${threshold} absences non excusées consécutives.`,
            refType: 'Student',
            refId: a.studentId,
            sendEmail: () =>
              this.email.sendAbandonmentAlert(teacher.email, `${a.student.firstName} ${a.student.lastName}`, threshold),
          });
        }
      }
    }

    return this.list(teacherId, sessionId);
  }

  // --- Registre & alertes (vue Professeur, Ch.14.10/14.11) -----------------------------------

  /** Ch.14.11/RM-ATT-015 : registre officiel des présences du groupe — export réel hors scope
   *  (dépend des droits d'abonnement, domaine Commercial non construit). */
  async getRegister(teacherId: string, groupId: string) {
    await this.loadOwnedGroup(teacherId, groupId);
    const attendances = await this.prisma.attendance.findMany({
      where: { session: { groupId } },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        session: { select: { id: true, date: true, startTime: true, status: true } },
      },
      orderBy: [{ session: { date: 'asc' } }, { session: { startTime: 'asc' } }],
    });
    const group = await this.prisma.group.findUniqueOrThrow({ where: { id: groupId } });
    return attendances.map((a) => ({
      session: a.session,
      student: a.student,
      ...this.toAttendanceView(a, group.absenceBillingPolicy),
    }));
  }

  /**
   * Ch.14.10/RM-ATT-013/014 : détecte les élèves ayant atteint le seuil d'absences consécutives
   * non excusées. Une séance annulée n'interrompt pas la séquence (RM-ATT-013) — de fait, elle n'a
   * jamais de ligne de présence et n'apparaît donc jamais dans la séquence observée ci-dessous.
   */
  async getAbandonmentAlerts(teacherId: string, groupId: string) {
    const group = await this.loadOwnedGroup(teacherId, groupId);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { groupId, status: 'ACTIVE' },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
    });

    const attendances = await this.prisma.attendance.findMany({
      where: { session: { groupId, status: { in: ['COMPLETED', 'LOCKED'] } } },
      include: { session: { select: { date: true, startTime: true } } },
      orderBy: [{ session: { date: 'desc' } }, { session: { startTime: 'desc' } }],
    });
    const byStudent = new Map<string, typeof attendances>();
    for (const a of attendances) {
      const list = byStudent.get(a.studentId) ?? [];
      list.push(a);
      byStudent.set(a.studentId, list);
    }

    return enrollments
      .map((e) => {
        const list = byStudent.get(e.studentId) ?? [];
        let streak = 0;
        for (const a of list) {
          if (a.status !== 'UNEXCUSED_ABSENT') break;
          streak += 1;
        }
        return { student: e.student, enrollmentId: e.id, consecutiveUnexcusedAbsences: streak };
      })
      .filter((entry) => entry.consecutiveUnexcusedAbsences >= group.abandonmentThreshold);
  }

  // --- Statistiques (Ch.14.9) -----------------------------------------------------------------

  private periodStart(
    period: AttendanceStatsPeriod,
    group: { startDate: Date },
    academicYear: { startDate: Date },
  ): Date {
    if (period === 'LAST_30_DAYS') return addDays(todayDateOnly(), -30);
    if (period === 'ACADEMIC_YEAR') return dateOnly(academicYear.startDate);
    return dateOnly(group.startDate);
  }

  private summarize(
    student: { id: string; firstName: string; lastName: string },
    list: { status: AttendanceStatus }[],
  ) {
    const totalSessions = list.length;
    const present = list.filter((a) => a.status === 'PRESENT').length;
    const late = list.filter((a) => a.status === 'LATE').length;
    const excusedAbsences = list.filter((a) => a.status === 'EXCUSED_ABSENT').length;
    const unexcusedAbsences = list.filter((a) => a.status === 'UNEXCUSED_ABSENT').length;
    const attended = present + late; // RM-ATT-017 : le retard reste comptabilisé comme une présence
    return {
      student,
      totalSessions,
      present,
      late,
      excusedAbsences,
      unexcusedAbsences,
      attendanceRate: totalSessions > 0 ? attended / totalSessions : null,
    };
  }

  /** Ch.14.9 : statistiques d'assiduité par élève actif du groupe, sur la période choisie. */
  async getGroupStats(teacherId: string, groupId: string, period: AttendanceStatsPeriod = 'GROUP') {
    const group = await this.loadOwnedGroup(teacherId, groupId);
    const from = this.periodStart(period, group, group.academicYear);

    const [enrollments, attendances] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { groupId, status: 'ACTIVE' },
        include: { student: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.attendance.findMany({ where: { session: { groupId, date: { gte: from } } } }),
    ]);
    const byStudent = new Map<string, typeof attendances>();
    for (const a of attendances) {
      const list = byStudent.get(a.studentId) ?? [];
      list.push(a);
      byStudent.set(a.studentId, list);
    }

    return enrollments.map((e) => this.summarize(e.student, byStudent.get(e.studentId) ?? []));
  }

  // --- Vue Parent (Ch.14.2 : informer les Parents) --------------------------------------------

  /** Le Parent consulte l'historique de présence de son enfant, tous groupes confondus. */
  async getStudentAttendanceForParent(parentId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student || student.parentId !== parentId) {
      throw new ForbiddenException("Cet élève n'appartient pas à votre compte");
    }

    const attendances = await this.prisma.attendance.findMany({
      where: { studentId },
      include: {
        session: {
          select: {
            id: true,
            date: true,
            startTime: true,
            group: { select: { id: true, name: true, absenceBillingPolicy: true } },
          },
        },
      },
      orderBy: [{ session: { date: 'desc' } }],
    });

    return {
      summary: this.summarize(
        { id: student.id, firstName: student.firstName, lastName: student.lastName },
        attendances,
      ),
      entries: attendances.map((a) => ({
        session: { id: a.session.id, date: a.session.date, startTime: a.session.startTime },
        group: a.session.group,
        ...this.toAttendanceView(a, a.session.group.absenceBillingPolicy),
      })),
    };
  }
}
