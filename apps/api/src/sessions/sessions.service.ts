import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AcademicYearStatus, DayOfWeek, GroupStatus, SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { PostponeSessionDto } from './dto/postpone-session.dto';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';

/**
 * Ch.13.3 : « GROUPI limite la génération automatique des séances dans le futur à la durée de
 * l'année académique afin de garantir la performance de la plateforme. » `AcademicYear.endDate`
 * est un champ obligatoire du schéma, donc la borne "année académique" est en principe toujours
 * déterminable — le plafond ci-dessous (~6 mois) n'intervient que comme filet de sécurité
 * supplémentaire si un groupe/une année académique couvrait une période anormalement longue,
 * pour garder la génération bornée quoi qu'il arrive.
 */
const GENERATION_HARD_CAP_DAYS = 182;

/** Index JS (`Date.getUTCDay()`, 0 = dimanche) -> `DayOfWeek` Prisma. */
const DAY_BY_JS_INDEX: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

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

function sessionKey(date: Date, startTime: string): string {
  return `${date.toISOString().slice(0, 10)}|${startTime}`;
}

interface LockableSession {
  status: SessionStatus;
  date: Date;
  startTime: string;
  durationMinutes: number;
  lockedAt: Date | null;
}

/** Fin théorique d'une séance (date + heure de début + durée). */
function theoreticalEnd(session: Pick<LockableSession, 'date' | 'startTime' | 'durationMinutes'>): Date {
  const [hours, minutes] = session.startTime.split(':').map(Number);
  const end = new Date(session.date);
  end.setUTCHours(hours, minutes + session.durationMinutes, 0, 0);
  return end;
}

/**
 * Début théorique d'une séance (date + heure de début) — Ch.16.4/RM-DSH-006 : la borne du délai de
 * signalement d'absence par le Parent (voir `AbsenceNoticeService`, aucun champ dédié dans `Group`).
 */
export function theoreticalStart(session: Pick<LockableSession, 'date' | 'startTime'>): Date {
  const [hours, minutes] = session.startTime.split(':').map(Number);
  const start = new Date(session.date);
  start.setUTCHours(hours, minutes, 0, 0);
  return start;
}

/**
 * Ch.13.7/13.9 : une séance TERMINEE devient définitivement VERROUILLEE 48h après sa fin
 * théorique (ou à `lockedAt` si celui-ci a déjà été posé explicitement). Aucune transition
 * automatique PLANIFIEE -> TERMINEE -> VERROUILLEE n'est câblée dans ce chantier : la marque
 * "séance terminée avec présences" relève du Ch.14 (Présences), non construit ici. Cette fonction
 * se contente d'exposer la règle de calcul pour un usage futur (affichage, job de verrouillage).
 */
export function computeLockDeadline(session: LockableSession): Date | null {
  if (session.status !== 'COMPLETED' && session.status !== 'LOCKED') {
    return null;
  }
  if (session.lockedAt) {
    return session.lockedAt;
  }
  return new Date(theoreticalEnd(session).getTime() + 48 * 60 * 60 * 1000);
}

export function isLockable(session: LockableSession): boolean {
  if (session.status === 'LOCKED') return true;
  const deadline = computeLockDeadline(session);
  return deadline !== null && deadline.getTime() <= Date.now();
}

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Ch.13 : notifie chaque Parent ayant une inscription ACTIVE dans le groupe — NOT-SES-001
   * (exceptionnelle), NOT-SES-003 (annulée), NOT-SES-007/018 (reportée). Même forme de requête que
   * `AttendanceService.validate` (`enrollment.findMany({ status: 'ACTIVE' })` joint au Parent).
   */
  private async notifyGroupParents(
    groupId: string,
    build: (groupName: string, parentEmail: string) => { type: string; title: string; body: string; sendEmail: () => Promise<void> },
  ): Promise<void> {
    const [group, enrollments] = await Promise.all([
      this.prisma.group.findUniqueOrThrow({ where: { id: groupId }, select: { name: true } }),
      this.prisma.enrollment.findMany({
        where: { groupId, status: 'ACTIVE' },
        include: { student: { select: { parentId: true, parent: { select: { user: { select: { email: true } } } } } } },
      }),
    ]);
    for (const e of enrollments) {
      const { type, title, body, sendEmail } = build(group.name, e.student.parent.user.email);
      await this.notifications.notify({
        recipientUserId: e.student.parentId,
        type,
        priority: 'IMPORTANT',
        title,
        body,
        refType: 'Group',
        refId: groupId,
        sendEmail,
      });
    }
  }

  /** Vérifie que le groupe existe et appartient bien au Professeur courant (cf. GroupsService.loadOwned). */
  private async loadOwnedGroup(teacherId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: { academicYear: true, schedules: true },
    });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException("Ce groupe n'appartient pas à votre compte");
    }
    return group;
  }

  private async loadOwnedSession(teacherId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { group: { select: { teacherId: true } } },
    });
    if (!session) {
      throw new NotFoundException('Séance introuvable');
    }
    if (session.group.teacherId !== teacherId) {
      throw new ForbiddenException("Cette séance n'appartient pas à votre compte");
    }
    return session;
  }

  /** ERR-SES-002/003/023 : un groupe archivé/fermé ou une année académique clôturée bloquent toute création. */
  private assertGroupOpenForSessions(group: {
    status: GroupStatus;
    academicYear: { status: AcademicYearStatus };
  }) {
    if (group.status === 'ARCHIVED') {
      throw new BadRequestException('Groupe archivé : ajout de séance impossible (ERR-SES-002)');
    }
    if (group.status === 'CLOSED') {
      throw new BadRequestException(
        'Groupe fermé : ajout de séance impossible (ERR-SES-023)',
      );
    }
    if (group.academicYear.status === 'CLOSED') {
      throw new BadRequestException('Année académique clôturée : création refusée (ERR-SES-003)');
    }
  }

  private toResponse<T extends LockableSession>(session: T) {
    return { ...session, lockDeadline: computeLockDeadline(session) };
  }

  /**
   * Ch.13.3 : génère les séances futures à partir du planning hebdomadaire du groupe, entre
   * max(startDate du groupe, aujourd'hui) et la fin du groupe (ou de son année académique).
   * Une séance = un couple (date, créneau) ; jamais générée deux fois pour le même groupe/date/
   * heure de début (ERR-SES-027, vérification applicative avant écriture).
   */
  async generate(teacherId: string, groupId: string) {
    const group = await this.loadOwnedGroup(teacherId, groupId);
    this.assertGroupOpenForSessions(group);
    if (group.schedules.length === 0) {
      throw new BadRequestException('Groupe sans planning : génération impossible (ERR-SES-024)');
    }

    const today = todayDateOnly();
    const groupStart = dateOnly(group.startDate);
    const start = groupStart > today ? groupStart : today;

    const groupEnd = group.endDate ? dateOnly(group.endDate) : null;
    const yearEnd = dateOnly(group.academicYear.endDate);
    const candidateEnd = groupEnd && groupEnd < yearEnd ? groupEnd : yearEnd;
    const hardCap = addDays(start, GENERATION_HARD_CAP_DAYS);
    const end = candidateEnd < hardCap ? candidateEnd : hardCap;

    if (start > end) {
      return { count: 0, sessions: [] };
    }

    const existing = await this.prisma.session.findMany({
      where: { groupId, date: { gte: start, lte: end } },
      select: { date: true, startTime: true },
    });
    const seen = new Set(existing.map((s) => sessionKey(s.date, s.startTime)));

    const plan: { date: Date; schedule: (typeof group.schedules)[number] }[] = [];
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
      const dow = DAY_BY_JS_INDEX[cursor.getUTCDay()];
      for (const schedule of group.schedules) {
        if (schedule.dayOfWeek !== dow) continue;
        const key = sessionKey(cursor, schedule.startTime);
        if (seen.has(key)) continue; // ERR-SES-027 : doublon ignoré silencieusement
        seen.add(key);
        plan.push({ date: new Date(cursor), schedule });
      }
    }

    if (plan.length === 0) {
      return { count: 0, sessions: [] };
    }

    const sessions = await this.prisma.$transaction(
      plan.map(({ date, schedule }) =>
        this.prisma.session.create({
          data: {
            groupId,
            date,
            startTime: schedule.startTime,
            durationMinutes: schedule.durationMinutes,
            teachingMode: group.teachingMode,
            teachingLocationId: schedule.teachingLocationId,
            status: 'PLANNED',
          },
        }),
      ),
    );

    return { count: sessions.length, sessions: sessions.map((s) => this.toResponse(s)) };
  }

  /** Ch.13.10 : séance exceptionnelle — mêmes vérifications que la génération, plus anti-doublon exact. */
  async createExceptional(teacherId: string, groupId: string, dto: CreateSessionDto) {
    const group = await this.loadOwnedGroup(teacherId, groupId);
    this.assertGroupOpenForSessions(group);

    const date = dateOnly(new Date(dto.date));

    const duplicate = await this.prisma.session.findFirst({
      where: { groupId, date, startTime: dto.startTime },
    });
    if (duplicate) {
      throw new BadRequestException(
        'Une séance existe déjà sur ce créneau pour ce groupe (ERR-SES-004/ERR-SES-027)',
      );
    }

    if (dto.teachingLocationId) {
      const owned = await this.prisma.teachingLocation.count({
        where: { id: dto.teachingLocationId, teacherId },
      });
      if (!owned) {
        throw new BadRequestException('Lieu d’enseignement inexistant (ERR-GRP-005)');
      }
    }

    const session = await this.prisma.session.create({
      data: {
        groupId,
        date,
        startTime: dto.startTime,
        durationMinutes: dto.durationMinutes,
        teachingMode: dto.teachingMode,
        teachingLocationId: dto.teachingLocationId,
        status: 'PLANNED',
      },
    });

    // NOT-SES-001 : hors chemin critique — un échec de notification ne doit jamais annuler la création.
    await this.notifyGroupParents(groupId, (groupName, parentEmail) => ({
      type: 'SES_EXCEPTIONAL_CREATED',
      title: 'Nouvelle séance exceptionnelle',
      body: `Une séance exceptionnelle a été ajoutée au groupe "${groupName}" le ${date.toLocaleDateString('fr-FR')} à ${dto.startTime}.`,
      sendEmail: () => this.email.sendSessionExceptional(parentEmail, groupName, date, dto.startTime),
    }));

    return this.toResponse(session);
  }

  async list(teacherId: string, groupId: string, query: ListSessionsQueryDto) {
    await this.loadOwnedGroup(teacherId, groupId);

    const sessions = await this.prisma.session.findMany({
      where: {
        groupId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.from || query.to
          ? {
              date: {
                ...(query.from ? { gte: dateOnly(new Date(query.from)) } : {}),
                ...(query.to ? { lte: dateOnly(new Date(query.to)) } : {}),
              },
            }
          : {}),
      },
      include: { teachingLocation: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return sessions.map((s) => this.toResponse(s));
  }

  /**
   * Ch.13.3/13.8 : le report annule la séance initiale (POSTPONED) et crée une nouvelle séance
   * PLANIFIEE à la date choisie — dans une transaction pour garantir l'atomicité des deux écritures.
   */
  async postpone(teacherId: string, sessionId: string, dto: PostponeSessionDto) {
    const session = await this.loadOwnedSession(teacherId, sessionId);

    if (session.status === 'LOCKED') {
      throw new BadRequestException('Séance verrouillée : report impossible (ERR-SES-001/ERR-SES-014)');
    }
    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Séance déjà réalisée : report impossible (ERR-SES-001)');
    }
    if (session.status === 'CANCELLED') {
      throw new BadRequestException('Séance annulée : report impossible (ERR-SES-017)');
    }
    if (session.status === 'POSTPONED') {
      throw new BadRequestException(
        'Séance déjà reportée vers une autre séance : nouvelle opération refusée (ERR-SES-017)',
      );
    }

    const newDate = dateOnly(new Date(dto.date));
    if (newDate < todayDateOnly()) {
      throw new BadRequestException('Date de report antérieure à aujourd’hui (ERR-SES-020)');
    }

    const duplicate = await this.prisma.session.findFirst({
      where: {
        groupId: session.groupId,
        date: newDate,
        startTime: dto.startTime,
        id: { not: session.id },
      },
    });
    if (duplicate) {
      throw new BadRequestException('Créneau déjà occupé : report refusé (ERR-SES-029)');
    }

    const [, created] = await this.prisma.$transaction([
      this.prisma.session.update({ where: { id: session.id }, data: { status: 'POSTPONED' } }),
      this.prisma.session.create({
        data: {
          groupId: session.groupId,
          date: newDate,
          startTime: dto.startTime,
          durationMinutes: dto.durationMinutes ?? session.durationMinutes,
          teachingMode: session.teachingMode,
          teachingLocationId: session.teachingLocationId,
          status: 'PLANNED',
        },
      }),
    ]);

    // NOT-SES-007+018 : fusionnées en une seule notification par parent pour cette action atomique
    // (voir le commentaire de `EmailService.sendSessionPostponed`).
    await this.notifyGroupParents(session.groupId, (groupName, parentEmail) => ({
      type: 'SES_POSTPONED',
      title: 'Séance reportée',
      body: `La séance du groupe "${groupName}" prévue le ${session.date.toLocaleDateString('fr-FR')} a été reportée au ${newDate.toLocaleDateString('fr-FR')} à ${dto.startTime}.`,
      sendEmail: () => this.email.sendSessionPostponed(parentEmail, groupName, session.date, newDate, dto.startTime),
    }));

    return this.toResponse(created);
  }

  /** Ch.13.8 : annulation d'une séance planifiée — jamais réactivable ensuite. */
  async cancel(teacherId: string, sessionId: string) {
    const session = await this.loadOwnedSession(teacherId, sessionId);

    if (session.status === 'LOCKED') {
      throw new BadRequestException('Séance verrouillée : annulation impossible (ERR-SES-001)');
    }
    if (session.status === 'CANCELLED') {
      throw new BadRequestException('Séance déjà annulée (ERR-SES-016)');
    }
    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Séance planifiée déjà réalisée : annulation impossible (ERR-SES-007)');
    }

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { status: 'CANCELLED' },
    });

    // NOT-SES-003 : hors chemin critique — un échec de notification ne doit jamais annuler l'annulation.
    await this.notifyGroupParents(session.groupId, (groupName, parentEmail) => ({
      type: 'SES_CANCELLED',
      title: 'Séance annulée',
      body: `La séance du groupe "${groupName}" prévue le ${session.date.toLocaleDateString('fr-FR')} à ${session.startTime} a été annulée.`,
      sendEmail: () => this.email.sendSessionCancelled(parentEmail, groupName, session.date, session.startTime),
    }));

    return this.toResponse(updated);
  }

  /** Suppression physique — uniquement autorisée tant que la séance est encore PLANIFIEE (ERR-SES-015). */
  async remove(teacherId: string, sessionId: string) {
    const session = await this.loadOwnedSession(teacherId, sessionId);
    if (session.status !== 'PLANNED') {
      throw new BadRequestException(
        'Suppression impossible : seule une séance planifiée peut être supprimée (ERR-SES-015)',
      );
    }
    await this.prisma.session.delete({ where: { id: sessionId } });
    return { id: sessionId, deleted: true };
  }
}
