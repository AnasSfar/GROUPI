import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AcademicYearStatus, ActivityPriority, DayOfWeek, GroupStatus, SessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { GroupsService } from '../groups/groups.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { PostponeSessionDto } from './dto/postpone-session.dto';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import { SetTeachingModeDto } from './dto/set-teaching-mode.dto';
import { UpdateSessionCommentDto } from './dto/update-session-comment.dto';

const MODE_LABELS: Record<'PRESENTIAL' | 'ONLINE', string> = {
  PRESENTIAL: 'présentiel',
  ONLINE: 'en ligne',
};

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

// RM-SES-007/008/028 : la détection de pause de génération vit désormais uniquement dans
// `GroupsService.isDateInGenerationPause()` (canonique, exportée par `GroupsModule`) — appelée
// ci-dessous plutôt que dupliquée ici, pour éviter la divergence de sémantique constatée entre les
// deux implémentations initiales (bornes ouvertes d'un seul côté vs. bornes obligatoirement
// symétriques).

interface LockableSession {
  status: SessionStatus;
  date: Date;
  startTime: string;
  durationMinutes: number;
  lockedAt: Date | null;
  unlockOverrideUntil?: Date | null;
}

/**
 * Toutes les heures de séance (`startTime`) sont saisies et affichées comme heure murale
 * tunisienne (RM-NAM-008). On les ancre explicitement sur ce fuseau (plutôt que sur UTC ou l'heure
 * du serveur) — la Tunisie n'observe pas l'heure d'été (UTC+1 fixe toute l'année).
 */
const SESSION_TIME_ZONE = 'Africa/Tunis';

const zonedPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: SESSION_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Convertit une heure murale (`hours:minutes`, avec dépassement toléré) du jour `date` en instant UTC. */
function zonedWallTimeToUtc(date: Date, hours: number, minutes: number): Date {
  const utcGuess = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes, 0, 0));
  const parts: Record<string, string> = {};
  for (const part of zonedPartsFormatter.formatToParts(utcGuess)) {
    if (part.type !== 'literal') parts[part.type] = part.value;
  }
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  const offsetMs = asIfUtc - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offsetMs);
}

/** Fin théorique d'une séance (date + heure de début + durée), en heure de Paris. */
export function theoreticalEnd(session: Pick<LockableSession, 'date' | 'startTime' | 'durationMinutes'>): Date {
  const [hours, minutes] = session.startTime.split(':').map(Number);
  return zonedWallTimeToUtc(session.date, hours, minutes + session.durationMinutes);
}

/**
 * Début théorique d'une séance (date + heure de début), en heure de Paris — Ch.16.4/RM-DSH-006 :
 * la borne du délai de signalement d'absence par le Parent (voir `AbsenceNoticeService`, aucun
 * champ dédié dans `Group`).
 */
export function theoreticalStart(session: Pick<LockableSession, 'date' | 'startTime'>): Date {
  const [hours, minutes] = session.startTime.split(':').map(Number);
  return zonedWallTimeToUtc(session.date, hours, minutes);
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
  // RM-SES-036 : tant que la fenêtre de correction ouverte par un déverrouillage admin n'est pas
  // expirée, elle prime sur l'échéance standard de 48h (déjà dépassée pour une vieille séance, ce
  // qui aurait sinon reverrouillé la séance dès la requête suivante).
  if (session.unlockOverrideUntil && session.unlockOverrideUntil.getTime() > Date.now()) {
    return session.unlockOverrideUntil;
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
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly subscriptions: SubscriptionsService,
    private readonly groups: GroupsService,
  ) {}

  /**
   * Ch.13 : notifie chaque Parent ayant une inscription ACTIVE dans le groupe — NOT-SES-001
   * (exceptionnelle), NOT-SES-003 (annulée), NOT-SES-004 (mode d'enseignement), NOT-SES-007/018
   * (reportée), NOT-SES-016 (commentaire). Même forme de requête que `AttendanceService.validate`
   * (`enrollment.findMany({ status: 'ACTIVE' })` joint au Parent).
   */
  private async notifyGroupParents(
    groupId: string,
    build: (
      groupName: string,
      parentEmail: string,
    ) => { type: string; title: string; body: string; sendEmail?: () => Promise<void> },
    priority: ActivityPriority = 'IMPORTANT',
  ): Promise<void> {
    const [group, enrollments] = await Promise.all([
      this.prisma.group.findUniqueOrThrow({ where: { id: groupId }, select: { name: true } }),
      this.prisma.enrollment.findMany({
        where: { groupId, status: 'ACTIVE' },
        include: { student: { select: { parentId: true, parent: { select: { user: { select: { email: true } } } } } } },
      }),
    ]);
    for (const e of enrollments) {
      const parentEmail = e.student.parent.user.email;
      const { type, title, body, sendEmail } = build(group.name, parentEmail ?? '');
      await this.notifications.notify({
        recipientUserId: e.student.parentId,
        type,
        priority,
        title,
        body,
        refType: 'Group',
        refId: groupId,
        sendEmail: parentEmail ? sendEmail : undefined,
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

  /** ERR-SES-021/028 : un Professeur suspendu ou pas encore validé ne peut pas générer de séance. */
  private async assertTeacherActiveForSessions(teacherId: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.status !== 'VALIDATED') {
      throw new BadRequestException(
        'Professeur suspendu ou non validé : création de séance impossible (ERR-SES-021/ERR-SES-028)',
      );
    }
  }

  private timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * ERR-SES-009 : conflit de planning avec une autre séance du même Professeur (groupe différent)
   * — avertissement non bloquant, simple notification informative ; la création reste autorisée.
   */
  private async warnScheduleConflicts(
    teacherId: string,
    excludeGroupId: string,
    candidates: { date: Date; startTime: string; durationMinutes: number }[],
  ) {
    if (candidates.length === 0) return;
    const times = candidates.map((c) => dateOnly(c.date).getTime());
    const minDate = new Date(Math.min(...times));
    const maxDate = new Date(Math.max(...times));

    const otherSessions = await this.prisma.session.findMany({
      where: {
        group: { teacherId, id: { not: excludeGroupId } },
        date: { gte: minDate, lte: maxDate },
        status: { in: ['PLANNED', 'POSTPONED'] },
      },
      select: { date: true, startTime: true, durationMinutes: true },
    });
    if (otherSessions.length === 0) return;

    let conflictCount = 0;
    for (const c of candidates) {
      const cStart = this.timeToMinutes(c.startTime);
      const cEnd = cStart + c.durationMinutes;
      const cDay = dateOnly(c.date).getTime();
      const conflict = otherSessions.some((o) => {
        if (dateOnly(o.date).getTime() !== cDay) return false;
        const oStart = this.timeToMinutes(o.startTime);
        const oEnd = oStart + o.durationMinutes;
        return cStart < oEnd && oStart < cEnd;
      });
      if (conflict) conflictCount++;
    }
    if (conflictCount === 0) return;

    await this.notifications.notify({
      recipientUserId: teacherId,
      type: 'SES_SCHEDULE_CONFLICT',
      priority: 'INFORMATION',
      title: 'Conflit de planning',
      body: `${conflictCount} séance(s) chevauchent une séance planifiée dans un de vos autres groupes (ERR-SES-009). La création reste autorisée — vérifiez votre planning.`,
      refType: 'Group',
      refId: excludeGroupId,
    });
  }

  private toResponse<T extends LockableSession>(session: T) {
    return { ...session, lockDeadline: computeLockDeadline(session) };
  }

  /**
   * Ch.13.3 : génère les séances futures à partir du planning hebdomadaire du groupe, entre
   * max(startDate du groupe, aujourd'hui) et la fin du groupe (ou de son année académique).
   * Une séance = un couple (date, créneau) ; jamais générée deux fois pour le même groupe/date/
   * heure de début (ERR-SES-027, vérification applicative avant écriture).
   * `options.single` : ne crée que la toute prochaine séance chronologique du planning au lieu
   * de tout l'horizon disponible.
   */
  async generate(teacherId: string, groupId: string, options: { single?: boolean } = {}) {
    const group = await this.loadOwnedGroup(teacherId, groupId);
    this.assertGroupOpenForSessions(group);
    await this.assertTeacherActiveForSessions(teacherId);
    if (group.schedules.length === 0) {
      throw new BadRequestException('Groupe sans planning : génération impossible (ERR-SES-024)');
    }

    // RM-SES-022/ERR-SES-013 : un groupe sans aucune inscription ACTIVE ne génère plus de séance
    // (les séances déjà générées restent consultables) — écart de conformité corrigé, la génération
    // est simplement sautée (pas d'erreur bloquante) plutôt que de créer des séances "orphelines".
    const activeEnrollments = await this.prisma.enrollment.count({ where: { groupId, status: 'ACTIVE' } });
    if (activeEnrollments === 0) {
      this.logger.warn(
        `Génération de séances suspendue pour le groupe ${groupId} : aucun élève inscrit (RM-SES-022).`,
      );
      return { count: 0, sessions: [], skippedReason: 'NO_ACTIVE_ENROLLMENT' as const };
    }

    // RM-SES-023/ERR-SES-011 : abonnement expiré/suspendu -> génération suspendue pour ce Professeur
    // uniquement, sans jamais lever d'erreur bloquante globale (skip silencieux, journalisé).
    try {
      await this.subscriptions.assertCanWrite(teacherId);
    } catch (err) {
      this.logger.warn(
        `Génération de séances suspendue pour le Professeur ${teacherId} : abonnement non exploitable ` +
          `(RM-SES-023). ${err instanceof Error ? err.message : String(err)}`,
      );
      return { count: 0, sessions: [], skippedReason: 'SUBSCRIPTION_INACTIVE' as const };
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
      // RM-SES-007/008/028 : aucune séance générée pour une date en pause — jamais rattrapée après coup.
      if (this.groups.isDateInGenerationPause(group, cursor)) continue;
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

    if (options.single) {
      plan.sort((a, b) => a.date.getTime() - b.date.getTime() || a.schedule.startTime.localeCompare(b.schedule.startTime));
      plan.length = 1;
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

    // NOT-SES : hors transaction — un échec de notification ne doit jamais annuler la génération.
    await this.warnScheduleConflicts(
      teacherId,
      groupId,
      plan.map(({ date, schedule }) => ({
        date,
        startTime: schedule.startTime,
        durationMinutes: schedule.durationMinutes,
      })),
    );

    return { count: sessions.length, sessions: sessions.map((s) => this.toResponse(s)) };
  }

  /** Ch.13.10 : séance exceptionnelle — mêmes vérifications que la génération, plus anti-doublon exact. */
  async createExceptional(teacherId: string, groupId: string, dto: CreateSessionDto) {
    const group = await this.loadOwnedGroup(teacherId, groupId);
    this.assertGroupOpenForSessions(group);
    await this.assertTeacherActiveForSessions(teacherId);

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

    // RM-SES-035 : traçabilité de la création d'une séance exceptionnelle (hors planning habituel).
    await this.prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'SESSION_CREATED_EXCEPTIONAL',
        targetType: 'Session',
        targetId: session.id,
        newValues: {
          groupId,
          date: session.date,
          startTime: session.startTime,
          durationMinutes: session.durationMinutes,
          teachingMode: session.teachingMode,
          teachingLocationId: session.teachingLocationId,
        },
      },
    });

    // NOT-SES : hors transaction — un échec de notification ne doit jamais annuler la création.
    await this.warnScheduleConflicts(teacherId, groupId, [
      { date, startTime: dto.startTime, durationMinutes: dto.durationMinutes },
    ]);

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

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.session.update({ where: { id: session.id }, data: { status: 'POSTPONED' } });
      const newSession = await tx.session.create({
        data: {
          groupId: session.groupId,
          date: newDate,
          startTime: dto.startTime,
          durationMinutes: dto.durationMinutes ?? session.durationMinutes,
          teachingMode: session.teachingMode,
          teachingLocationId: session.teachingLocationId,
          status: 'PLANNED',
          // RM-SES-034 : conserve la traçabilité de la séance d'origine du report.
          rescheduledFromSessionId: session.id,
        },
      });

      // RM-ACC-019/020 : traçabilité centralisée du report d'une séance.
      await tx.auditLog.create({
        data: {
          userId: teacherId,
          action: 'SESSION_POSTPONED',
          targetType: 'Session',
          targetId: session.id,
          oldValues: { status: session.status, date: session.date, startTime: session.startTime },
          newValues: {
            status: 'POSTPONED',
            newSessionId: newSession.id,
            date: newSession.date,
            startTime: newSession.startTime,
          },
        },
      });

      return newSession;
    });

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

    // RM-ACC-019/020 : traçabilité de l'annulation — pas de transaction Prisma existante ici
    // (simple mise à jour), donc journalisation best-effort, non bloquante.
    await this.prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'SESSION_CANCELLED',
        targetType: 'Session',
        targetId: sessionId,
        oldValues: { status: session.status },
        newValues: { status: 'CANCELLED' },
      },
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

    // RM-SES-039 : la suppression d'une séance future ne supprime jamais son historique d'audit —
    // le log est créé AVANT la suppression physique pour que `targetId` référence encore une séance
    // qui existait bien (le champ `AuditLog.targetId` n'a pas de contrainte FK, donc l'entrée reste
    // consultable même une fois la séance supprimée).
    await this.prisma.$transaction([
      this.prisma.auditLog.create({
        data: {
          userId: teacherId,
          action: 'SESSION_DELETED',
          targetType: 'Session',
          targetId: session.id,
          oldValues: {
            groupId: session.groupId,
            status: session.status,
            date: session.date,
            startTime: session.startTime,
            durationMinutes: session.durationMinutes,
            teachingMode: session.teachingMode,
          },
        },
      }),
      this.prisma.session.delete({ where: { id: sessionId } }),
    ]);

    return { id: sessionId, deleted: true };
  }

  /**
   * Ch.13.6/RM-SES-009/010/011/012 : passage exceptionnel du mode d'enseignement d'une séance
   * précise. Ne modifie jamais le mode d'enseignement habituel du groupe/créneau — seule cette
   * occurrence est affectée (`teachingModeException: true`). Le refus d'un Parent (élève considéré
   * Absent excusé, hors décompte abandon) est traité par le mécanisme `AbsenceNotice` existant
   * (`dashboard/absence-notice.service.ts`, hors périmètre de ce chantier).
   */
  async setTeachingMode(teacherId: string, sessionId: string, dto: SetTeachingModeDto) {
    const session = await this.loadOwnedSession(teacherId, sessionId);

    if (session.status === 'LOCKED') {
      throw new BadRequestException('Séance verrouillée : modification impossible (ERR-SES-001/ERR-SES-012)');
    }
    if (session.status === 'CANCELLED') {
      throw new BadRequestException('Séance annulée : modification impossible (ERR-SES-001)');
    }
    if (session.status === 'COMPLETED') {
      throw new BadRequestException('Séance déjà réalisée : modification impossible (ERR-SES-001)');
    }
    if (session.teachingMode === dto.teachingMode) {
      throw new BadRequestException("Mode d'enseignement identique : aucune modification effectuée (ERR-SES-019)");
    }

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { teachingMode: dto.teachingMode, teachingModeException: true },
    });

    // RM-SES-035 : traçabilité de la modification exceptionnelle du mode d'enseignement.
    await this.prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'SESSION_TEACHING_MODE_CHANGED',
        targetType: 'Session',
        targetId: sessionId,
        oldValues: { teachingMode: session.teachingMode, teachingModeException: session.teachingModeException },
        newValues: { teachingMode: updated.teachingMode, teachingModeException: true },
      },
    });

    // NOT-SES-004/RM-SES-011/044 : chaque Parent du groupe est immédiatement informé.
    const newModeLabel = MODE_LABELS[dto.teachingMode];
    await this.notifyGroupParents(session.groupId, (groupName, parentEmail) => ({
      type: 'SES_TEACHING_MODE_CHANGED',
      title: 'Changement exceptionnel du mode d’enseignement',
      body: `La séance du groupe "${groupName}" du ${session.date.toLocaleDateString('fr-FR')} à ${session.startTime} passe exceptionnellement en ${newModeLabel}.`,
      sendEmail: () =>
        this.email.sendSessionTeachingModeChanged(parentEmail, groupName, session.date, session.startTime, newModeLabel),
    }));

    return this.toResponse(updated);
  }

  /**
   * RM-SES-041 : commentaire pédagogique de la séance, modifiable tant que la séance n'est pas
   * verrouillée. Chaque modification est historisée (oldValues/newValues) — NOT-SES-016 : les
   * Parents du groupe sont informés (priorité Information, pas d'e-mail — cf. `NotificationsService`).
   */
  async setComment(teacherId: string, sessionId: string, dto: UpdateSessionCommentDto) {
    const session = await this.loadOwnedSession(teacherId, sessionId);

    if (isLockable(session)) {
      throw new BadRequestException('Séance verrouillée : modification du commentaire impossible (ERR-SES-001/ERR-SES-012)');
    }

    const newComment = dto.teacherComment?.trim() || null;

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { teacherComment: newComment },
    });

    // RM-SES-041 : historisation de chaque modification du commentaire pédagogique.
    await this.prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'SESSION_COMMENT_UPDATED',
        targetType: 'Session',
        targetId: sessionId,
        oldValues: { teacherComment: session.teacherComment },
        newValues: { teacherComment: newComment },
      },
    });

    // NOT-SES-016 : hors chemin critique — un échec de notification ne doit jamais annuler la mise à jour.
    await this.notifyGroupParents(
      session.groupId,
      (groupName) => ({
        type: 'SES_COMMENT_UPDATED',
        title: 'Commentaire pédagogique publié',
        body: `Un commentaire pédagogique a été publié pour la séance du groupe "${groupName}" du ${session.date.toLocaleDateString('fr-FR')}.`,
      }),
      'INFORMATION',
    );

    return this.toResponse(updated);
  }

  /**
   * RM-SES-036 : déverrouillage exceptionnel réservé au Super Administrateur — obligatoirement
   * historisé (aucun déverrouillage automatique n'existe par ailleurs). Remet `lockedAt` à `null`
   * et fait revenir le statut à TERMINEE (le seul état d'où une séance peut être verrouillée) afin
   * que ce déverrouillage ait un effet réel sur `isLockable()`/`computeLockDeadline()` — sans cela,
   * le statut LOCKED garderait la séance verrouillée quoi qu'il arrive à `lockedAt`. `unlockOverrideUntil`
   * ouvre une fenêtre de correction de 48h (même durée que le verrouillage standard) pendant laquelle
   * `computeLockDeadline()` ne recalcule plus l'échéance théorique déjà dépassée — passé ce délai, la
   * séance se reverrouille automatiquement (comportement attendu, pas un bug résiduel).
   */
  async unlockAdmin(adminId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Séance introuvable');
    }
    if (session.status !== 'LOCKED') {
      throw new BadRequestException('Séance non verrouillée : déverrouillage sans objet');
    }

    const unlockOverrideUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const [, updated] = await this.prisma.$transaction([
      this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'SESSION_UNLOCKED_ADMIN',
          targetType: 'Session',
          targetId: sessionId,
          oldValues: { status: session.status, lockedAt: session.lockedAt },
          newValues: { status: 'COMPLETED', lockedAt: null, unlockOverrideUntil },
        },
      }),
      this.prisma.session.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', lockedAt: null, unlockOverrideUntil },
      }),
    ]);

    return this.toResponse(updated);
  }
}
