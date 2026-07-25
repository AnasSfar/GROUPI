import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudentService } from '../parent-profile/student.service';
import { RequestSituationUpdateDto } from './dto/request-situation-update.dto';

const INCLUDE_DETAILS = {
  academicYear: true,
  schoolLevel: true,
  school: true,
} as const;

@Injectable()
export class SchoolSituationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly students: StudentService,
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

    if (isRoutine) {
      return this.prisma.$transaction(async (tx) => {
        if (current) {
          await tx.studentSchoolSituation.update({
            where: { id: current.id },
            data: { status: 'CLOSED', endDate: new Date() },
          });
        }
        const situation = await tx.studentSchoolSituation.create({
          data: {
            studentId,
            academicYearId: dto.academicYearId,
            schoolLevelId: dto.schoolLevelId,
            schoolId: dto.schoolId,
            class: dto.schoolClass,
            startDate: new Date(),
            status: 'ACTIVE',
          },
          include: INCLUDE_DETAILS,
        });
        await tx.student.update({
          where: { id: studentId },
          data: { currentSchoolSituationId: situation.id },
        });
        return situation;
      });
    }

    // Non-routine : changement d'établissement, redoublement, réorientation, saut de niveau...
    return this.prisma.studentSchoolSituation.create({
      data: {
        studentId,
        academicYearId: dto.academicYearId,
        schoolLevelId: dto.schoolLevelId,
        schoolId: dto.schoolId,
        class: dto.schoolClass,
        startDate: new Date(),
        status: 'PENDING_VALIDATION',
      },
      include: INCLUDE_DETAILS,
    });
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
}
