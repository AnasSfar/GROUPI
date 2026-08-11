import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudentService } from '../parent-profile/student.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestSituationUpdateDto } from './dto/request-situation-update.dto';
import { AdminOverrideSituationDto } from './dto/admin-override-situation.dto';

const INCLUDE_DETAILS = {
  academicYear: true,
  schoolLevel: true,
  school: true,
} as const;

/** Statuts porteurs d'une période de validité "réelle" pour RM-SCH-015 (chevauchement) — une
 * situation REJECTED n'a jamais été une période effective, une PENDING_VALIDATION n'en est encore
 * qu'une proposition (ERR-SCH-007 empêche déjà d'en avoir deux à la fois). */
const SETTLED_STATUSES = ['ACTIVE', 'CLOSED'] as const;

/** RM-SCH-019 : tolérance large (±3 ans) avant de considérer un écart âge/niveau comme "significatif"
 * — un redoublement ou une avance légitime ne doivent jamais déclencher d'alerte. */
const AGE_LEVEL_TOLERANCE_YEARS = 3;

function computeAgeYears(dateOfBirth: Date, atDate: Date): number {
  let age = atDate.getFullYear() - dateOfBirth.getFullYear();
  const beforeBirthday =
    atDate.getMonth() < dateOfBirth.getMonth() ||
    (atDate.getMonth() === dateOfBirth.getMonth() && atDate.getDate() < dateOfBirth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Fourchette d'âge large dérivée du seul champ exploitable du référentiel SchoolLevel (`order`,
 * Ch.23.8) — PRIM1..PRIM6 (order 1-6), COL7..COL9 (order 7-9), secondaire au-delà (order >= 10).
 * Volontairement approximative (aucune table de correspondance âge/niveau précise n'existe dans le
 * référentiel) : sert uniquement à repérer les incohérences flagrantes, jamais à valider finement. */
function expectedAgeRangeForLevelOrder(order: number): { min: number; max: number } {
  if (order <= 6) return { min: 5, max: 12 };
  if (order <= 9) return { min: 10, max: 16 };
  return { min: 13, max: 21 };
}

@Injectable()
export class SchoolSituationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly students: StudentService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Ch.7.5 : historique complet, jamais supprimé — consultable par le Parent propriétaire. */
  async listHistory(parentId: string, studentId: string) {
    await this.students.getOne(parentId, studentId); // 404/403 si non trouvé ou pas le sien
    return this.prisma.studentSchoolSituation.findMany({
      where: { studentId },
      include: INCLUDE_DETAILS,
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Ch.7.4/RM-SCH-011/012 : la mise à jour de routine (même établissement, progression standard
   * vers une nouvelle année académique) devient active immédiatement. Tout le reste (changement
   * d'établissement, redoublement, réorientation, saut de niveau hors progression) reste en
   * attente de validation par un Administrateur (RM-SCH-013).
   */
  async requestUpdate(parentId: string, studentId: string, dto: RequestSituationUpdateDto) {
    const student = await this.students.getOne(parentId, studentId);
    if (student.status === 'ARCHIVED') {
      throw new BadRequestException('Élève archivé : réactivez-le avant de modifier sa situation');
    }

    const [schoolLevel, school, academicYear] = await Promise.all([
      this.prisma.schoolLevel.findUnique({ where: { id: dto.schoolLevelId } }),
      this.prisma.school.findUnique({ where: { id: dto.schoolId } }),
      this.prisma.academicYear.findUnique({ where: { id: dto.academicYearId } }),
    ]);
    if (!schoolLevel || !schoolLevel.isActive) {
      throw new BadRequestException('Niveau scolaire introuvable ou inactif (ERR-SCH-001)');
    }
    if (!school || !school.isActive) {
      throw new BadRequestException('Établissement introuvable (ERR-SCH-002)');
    }
    if (!academicYear || academicYear.status !== 'OPEN') {
      throw new BadRequestException('Année académique invalide (ERR-SCH-004)');
    }

    const existingPending = await this.prisma.studentSchoolSituation.findFirst({
      where: { studentId, status: 'PENDING_VALIDATION' },
    });
    if (existingPending) {
      throw new BadRequestException(
        'Une modification de situation scolaire est déjà en attente de validation (ERR-SCH-007)',
      );
    }

    const current = student.currentSchoolSituation;
    const isRoutine =
      !current ||
      (current.school.id === dto.schoolId &&
        current.academicYear.id !== dto.academicYearId &&
        schoolLevel.order === current.schoolLevel.order + 1);

    const now = new Date();

    if (isRoutine) {
      // RM-SCH-015/ERR-SCH-009 : le courant est clôturé dans la même transaction (endDate = now),
      // donc exclu du contrôle de chevauchement — seules les autres périodes déjà réglées comptent.
      await this.assertNoOverlap(studentId, now, null, current?.id);

      const situation = await this.prisma.$transaction(async (tx) => {
        if (current) {
          await tx.studentSchoolSituation.update({
            where: { id: current.id },
            data: { status: 'CLOSED', endDate: now },
          });
        }
        const created = await tx.studentSchoolSituation.create({
          data: {
            studentId,
            academicYearId: dto.academicYearId,
            schoolLevelId: dto.schoolLevelId,
            schoolId: dto.schoolId,
            class: dto.schoolClass,
            startDate: now,
            status: 'ACTIVE',
          },
          include: INCLUDE_DETAILS,
        });
        await tx.student.update({
          where: { id: studentId },
          data: { currentSchoolSituationId: created.id },
        });
        return created;
      });

      // RM-SCH-019/020 : cohérence âge/niveau, non bloquante — alerte uniquement.
      await this.checkAndNotifyAgeLevelCoherence(student.id, student.parentId, student.dateOfBirth, situation);
      return situation;
    }

    // Non-routine : changement d'établissement, redoublement, réorientation, saut de niveau... La
    // situation courante reste ACTIVE tant que celle-ci est en attente (RM-SCH-013) : elle n'est
    // donc pas comparée ici (pas encore une période réelle concurrente, cf. SETTLED_STATUSES).
    const situation = await this.prisma.studentSchoolSituation.create({
      data: {
        studentId,
        academicYearId: dto.academicYearId,
        schoolLevelId: dto.schoolLevelId,
        schoolId: dto.schoolId,
        class: dto.schoolClass,
        startDate: now,
        status: 'PENDING_VALIDATION',
      },
      include: INCLUDE_DETAILS,
    });

    await this.checkAndNotifyAgeLevelCoherence(student.id, student.parentId, student.dateOfBirth, situation);
    return situation;
  }

  // --- Administration (Ch.7.4, dernier paragraphe : validation par un Administrateur) ---

  async listPending() {
    return this.prisma.studentSchoolSituation.findMany({
      where: { status: 'PENDING_VALIDATION' },
      include: {
        ...INCLUDE_DETAILS,
        student: { include: { parent: { select: { firstName: true, lastName: true, phone: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async loadPending(situationId: string) {
    const situation = await this.prisma.studentSchoolSituation.findUnique({
      where: { id: situationId },
      include: { student: { include: { currentSchoolSituation: true } } },
    });
    if (!situation) {
      throw new NotFoundException('Situation scolaire introuvable');
    }
    if (situation.status !== 'PENDING_VALIDATION') {
      throw new BadRequestException("Cette situation n'est pas en attente de validation");
    }
    return situation;
  }

  /** RM-SCH-016 : toute nouvelle situation devient active après sa validation. */
  async validate(actorUserId: string, situationId: string) {
    const situation = await this.loadPending(situationId);

    // RM-SCH-015/ERR-SCH-009 : au moment où cette situation devient réellement active, elle ne doit
    // chevaucher aucune autre période réglée — l'actuelle est exclue car clôturée dans la même
    // transaction juste après (endDate = situation.startDate).
    const currentId = situation.student.currentSchoolSituationId;
    await this.assertNoOverlap(situation.studentId, situation.startDate, situation.endDate, currentId ?? undefined);

    return this.prisma.$transaction(async (tx) => {
      const currentId = situation.student.currentSchoolSituationId;
      if (currentId) {
        await tx.studentSchoolSituation.update({
          where: { id: currentId },
          data: { status: 'CLOSED', endDate: situation.startDate },
        });
      }
      const updated = await tx.studentSchoolSituation.update({
        where: { id: situationId },
        data: { status: 'ACTIVE' },
        include: INCLUDE_DETAILS,
      });
      await tx.student.update({
        where: { id: situation.studentId },
        data: { currentSchoolSituationId: situationId },
      });
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'SCHOOL_SITUATION_VALIDATED',
          targetType: 'StudentSchoolSituation',
          targetId: situationId,
          oldValues: { status: 'PENDING_VALIDATION' },
          newValues: { status: 'ACTIVE' },
        },
      });
      return updated;
    });
  }

  async reject(actorUserId: string, situationId: string, reason: string) {
    await this.loadPending(situationId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.studentSchoolSituation.update({
        where: { id: situationId },
        data: { status: 'REJECTED', rejectionReason: reason },
        include: INCLUDE_DETAILS,
      });
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'SCHOOL_SITUATION_REJECTED',
          targetType: 'StudentSchoolSituation',
          targetId: situationId,
          oldValues: { status: 'PENDING_VALIDATION' },
          newValues: { status: 'REJECTED', reason },
        },
      });
      return updated;
    });
  }

  /**
   * RM-SCH-014/017 : correction exceptionnelle d'une situation CLOSED par un Administrateur autorisé
   * (permission `SCH_ADMIN_OVERRIDE`) — le régime normal reste la création d'une nouvelle situation
   * (Ch.7.4) ; cette voie est réservée aux corrections a posteriori (erreur de saisie historique...).
   * Obligatoirement tracée dans le journal d'audit (RM-SCH-014, dernier alinéa). La situation reste
   * CLOSED après correction — il ne s'agit pas d'une réactivation, qui romprait RM-SCH-002 (une
   * seule situation active à la fois pour un élève).
   */
  async adminOverrideCorrection(actorUserId: string, situationId: string, dto: AdminOverrideSituationDto) {
    const situation = await this.prisma.studentSchoolSituation.findUnique({ where: { id: situationId } });
    if (!situation) {
      throw new NotFoundException('Situation scolaire introuvable');
    }
    if (situation.status !== 'CLOSED') {
      throw new BadRequestException(
        "Seule une situation clôturée peut faire l'objet d'une correction exceptionnelle (RM-SCH-014)",
      );
    }

    if (dto.schoolLevelId) {
      const level = await this.prisma.schoolLevel.findUnique({ where: { id: dto.schoolLevelId } });
      if (!level || !level.isActive) {
        throw new BadRequestException('Niveau scolaire introuvable ou inactif (ERR-SCH-001)');
      }
    }
    if (dto.schoolId) {
      const school = await this.prisma.school.findUnique({ where: { id: dto.schoolId } });
      if (!school || !school.isActive) {
        throw new BadRequestException('Établissement introuvable (ERR-SCH-002)');
      }
    }

    const nextStartDate = dto.startDate ? new Date(dto.startDate) : situation.startDate;
    const nextEndDate = dto.endDate ? new Date(dto.endDate) : situation.endDate;
    // RM-SCH-015/ERR-SCH-009 : une correction ne doit pas, elle non plus, créer un chevauchement.
    await this.assertNoOverlap(situation.studentId, nextStartDate, nextEndDate, situationId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.studentSchoolSituation.update({
        where: { id: situationId },
        data: {
          ...(dto.schoolLevelId ? { schoolLevelId: dto.schoolLevelId } : {}),
          ...(dto.schoolId ? { schoolId: dto.schoolId } : {}),
          ...(dto.schoolClass !== undefined ? { class: dto.schoolClass } : {}),
          ...(dto.startDate ? { startDate: nextStartDate } : {}),
          ...(dto.endDate ? { endDate: nextEndDate } : {}),
        },
        include: INCLUDE_DETAILS,
      });
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'SCHOOL_SITUATION_ADMIN_OVERRIDE',
          targetType: 'StudentSchoolSituation',
          targetId: situationId,
          oldValues: {
            schoolLevelId: situation.schoolLevelId,
            schoolId: situation.schoolId,
            class: situation.class,
            startDate: situation.startDate,
            endDate: situation.endDate,
          },
          newValues: {
            schoolLevelId: updated.schoolLevelId,
            schoolId: updated.schoolId,
            class: updated.class,
            startDate: updated.startDate,
            endDate: updated.endDate,
            reason: dto.reason,
          },
        },
      });
      return updated;
    });
  }

  /**
   * RM-SCH-008 : rappelle aux Parents dont un enfant n'a pas encore de situation scolaire active sur
   * l'année académique actuellement ouverte de la mettre à jour (NOT-SCH-003). Ne bloque rien
   * elle-même — RM-SCH-009/ERR-SCH-006 s'en chargent déjà côté inscriptions. Signature pensée pour
   * un branchement direct depuis un `@Cron(...)` de TemporalJobsService (hors périmètre de ce
   * chantier) : `await this.schoolSituationService.notifyPendingUpdatesForNewAcademicYear()`.
   */
  async notifyPendingUpdatesForNewAcademicYear(): Promise<{ sent: number; skipped: number }> {
    const openYear = await this.prisma.academicYear.findFirst({
      where: { status: 'OPEN' },
      orderBy: { startDate: 'desc' },
    });
    if (!openYear) {
      return { sent: 0, skipped: 0 };
    }

    const students = await this.prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { currentSchoolSituationId: null },
          { currentSchoolSituation: { is: { academicYearId: { not: openYear.id } } } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, parentId: true },
    });

    let sent = 0;
    let skipped = 0;
    for (const student of students) {
      try {
        await this.notifications.notify({
          recipientUserId: student.parentId,
          type: 'SCH_UPDATE_REMINDER',
          priority: 'IMPORTANT',
          title: 'Situation scolaire à mettre à jour',
          body: `Pensez à mettre à jour la situation scolaire de ${student.firstName} ${student.lastName} pour l'année académique ${openYear.label} (RM-SCH-008).`,
          refType: 'Student',
          refId: student.id,
        });
        sent += 1;
      } catch {
        skipped += 1;
      }
    }
    return { sent, skipped };
  }

  /** RM-SCH-019, non bloquant : vrai si `dateOfBirth` est absente (donnée facultative) ou cohérente
   * avec le niveau visé (tolérance large, cf. AGE_LEVEL_TOLERANCE_YEARS). */
  async checkAgeLevelCoherence(
    dateOfBirth: Date | null,
    schoolLevelId: string,
    atDate: Date = new Date(),
  ): Promise<boolean> {
    if (!dateOfBirth) return true;
    const level = await this.prisma.schoolLevel.findUnique({
      where: { id: schoolLevelId },
      select: { order: true },
    });
    if (!level) return true;
    const age = computeAgeYears(dateOfBirth, atDate);
    const { min, max } = expectedAgeRangeForLevelOrder(level.order);
    return age >= min - AGE_LEVEL_TOLERANCE_YEARS && age <= max + AGE_LEVEL_TOLERANCE_YEARS;
  }

  /** RM-SCH-019/NOT-SCH-007/NOT-SCH-009/EVT-SCH-006 : enveloppe checkAgeLevelCoherence et notifie
   * (Administrateurs + Parent) en cas d'incohérence — jamais bloquant, appelée après la création de
   * la situation (routine ou en attente). */
  private async checkAndNotifyAgeLevelCoherence(
    studentId: string,
    parentId: string,
    dateOfBirth: Date | null,
    situation: { id: string; schoolLevelId: string },
  ): Promise<void> {
    const coherent = await this.checkAgeLevelCoherence(dateOfBirth, situation.schoolLevelId);
    if (coherent) return;

    await this.notifications.notify({
      recipientUserId: parentId,
      type: 'SCH_AGE_LEVEL_MISMATCH',
      priority: 'INFORMATION',
      title: 'Incohérence âge/niveau détectée',
      body: "L'âge déclaré de l'élève semble incohérent avec le niveau scolaire sélectionné (NOT-SCH-009).",
      refType: 'StudentSchoolSituation',
      refId: situation.id,
    });

    const admins = await this.prisma.user.findMany({
      where: { roles: { hasSome: ['ADMIN', 'SUPER_ADMIN'] }, status: 'ACTIVE' },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        this.notifications.notify({
          recipientUserId: admin.id,
          type: 'SCH_AGE_LEVEL_MISMATCH',
          priority: 'IMPORTANT',
          title: 'Incohérence âge/niveau détectée',
          body: `Incohérence âge/niveau détectée pour l'élève ${studentId} (NOT-SCH-007).`,
          refType: 'StudentSchoolSituation',
          refId: situation.id,
        }),
      ),
    );
  }

  /** RM-SCH-015/ERR-SCH-009 : refuse toute création/correction dont la période [startDate, endDate)
   * chevaucherait une autre situation ACTIVE/CLOSED du même élève (SETTLED_STATUSES). `excludeId`
   * permet d'ignorer la situation en cours de clôture/correction elle-même. */
  private async assertNoOverlap(
    studentId: string,
    startDate: Date,
    endDate: Date | null,
    excludeId?: string,
  ): Promise<void> {
    const candidates = await this.prisma.studentSchoolSituation.findMany({
      where: {
        studentId,
        status: { in: [...SETTLED_STATUSES] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { startDate: true, endDate: true },
    });
    const FAR_FUTURE = new Date('9999-12-31');
    const newEnd = endDate ?? FAR_FUTURE;
    const overlap = candidates.some((c) => {
      const existingEnd = c.endDate ?? FAR_FUTURE;
      return startDate < existingEnd && c.startDate < newEnd;
    });
    if (overlap) {
      throw new BadRequestException(
        'Chevauchement de périodes entre deux situations scolaires de cet élève (ERR-SCH-009)',
      );
    }
  }
}
