import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

const INCLUDE_CURRENT_SITUATION = {
  currentSchoolSituation: {
    include: { academicYear: true, schoolLevel: true, school: true },
  },
} as const;

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listMine(parentId: string) {
    return this.prisma.student.findMany({
      where: { parentId },
      include: INCLUDE_CURRENT_SITUATION,
      orderBy: { createdAt: 'asc' },
    });
  }

  /** RM-PAR-011/018 : un Parent n'accède jamais aux données d'un autre. */
  private async loadOwned(parentId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: INCLUDE_CURRENT_SITUATION,
    });
    if (!student) {
      throw new NotFoundException('Élève introuvable');
    }
    if (student.parentId !== parentId) {
      throw new ForbiddenException("Cet élève n'appartient pas à votre compte");
    }
    return student;
  }

  async getOne(parentId: string, studentId: string) {
    return this.loadOwned(parentId, studentId);
  }

  /** Ch.6.5 : la création d'un enfant déclare aussi son niveau/établissement initiaux, ce qui
   *  crée automatiquement sa première situation scolaire (Ch.7 §7.4, RM-SCH-004/020). */
  async create(parentId: string, dto: CreateStudentDto) {
    const schoolLevel = await this.prisma.schoolLevel.findUnique({
      where: { id: dto.schoolLevelId },
    });
    if (!schoolLevel || !schoolLevel.isActive) {
      throw new BadRequestException('Niveau scolaire introuvable ou inactif');
    }

    const school = await this.prisma.school.findUnique({ where: { id: dto.schoolId } });
    if (!school || !school.isActive) {
      throw new BadRequestException('Établissement introuvable ou inactif (ERR-PAR-002)');
    }

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { status: 'OPEN' },
      orderBy: { startDate: 'desc' },
    });
    if (!academicYear) {
      throw new BadRequestException('Aucune année académique ouverte');
    }

    // RM-PAR-016 : un Parent ne peut pas créer deux profils représentant le même enfant
    // (vérification heuristique : nom + prénom + date de naissance identiques, hors archivés).
    const duplicate = await this.prisma.student.findFirst({
      where: {
        parentId,
        status: 'ACTIVE',
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      },
    });
    if (duplicate) {
      throw new BadRequestException('Un profil identique existe déjà pour cet enfant');
    }

    return this.prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          parentId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          status: 'ACTIVE',
        },
      });

      const situation = await tx.studentSchoolSituation.create({
        data: {
          studentId: student.id,
          academicYearId: academicYear.id,
          schoolLevelId: dto.schoolLevelId,
          schoolId: dto.schoolId,
          class: dto.schoolClass,
          startDate: new Date(),
        },
      });

      await tx.student.update({
        where: { id: student.id },
        data: { currentSchoolSituationId: situation.id },
      });

      return tx.student.findUniqueOrThrow({
        where: { id: student.id },
        include: INCLUDE_CURRENT_SITUATION,
      });
    });
  }

  async update(parentId: string, studentId: string, dto: UpdateStudentDto) {
    await this.loadOwned(parentId, studentId);
    return this.prisma.student.update({
      where: { id: studentId },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.dateOfBirth !== undefined ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
      },
      include: INCLUDE_CURRENT_SITUATION,
    });
  }

  /**
   * Ch.6.6, ERR-PAR-008 : un enfant déjà archivé ne peut pas être ré-archivé.
   * ERR-INS-025 : toute demande d'inscription encore PENDING_VALIDATION visant cet élève est
   * automatiquement clôturée (REJECTED, sans décideur) et le Professeur en est informé.
   */
  async archive(parentId: string, studentId: string) {
    const student = await this.loadOwned(parentId, studentId);
    if (student.status === 'ARCHIVED') {
      throw new BadRequestException('Cet élève est déjà archivé (ERR-PAR-008)');
    }

    const { updatedStudent, autoClosed } = await this.prisma.$transaction(async (tx) => {
      const updatedStudent = await tx.student.update({
        where: { id: studentId },
        data: { status: 'ARCHIVED' },
        include: INCLUDE_CURRENT_SITUATION,
      });

      const pending = await tx.enrollment.findMany({
        where: { studentId, status: 'PENDING_VALIDATION' },
        include: { group: { select: { id: true, name: true, teacherId: true } } },
      });

      for (const enrollment of pending) {
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: { status: 'REJECTED', decidedAt: new Date(), decidedById: null },
        });
      }

      return { updatedStudent, autoClosed: pending };
    });

    // NOT-INS : hors transaction — un échec d'envoi ne doit jamais annuler l'archivage.
    for (const enrollment of autoClosed) {
      await this.notifications.notify({
        recipientUserId: enrollment.group.teacherId,
        type: 'INS_AUTO_CLOSED_STUDENT_ARCHIVED',
        priority: 'IMPORTANT',
        title: 'Demande d’inscription automatiquement clôturée',
        body: `L'élève ${updatedStudent.firstName} ${updatedStudent.lastName} a été archivé par son Parent : la demande d'inscription au groupe "${enrollment.group.name}" a été automatiquement clôturée (ERR-INS-025).`,
        refType: 'Enrollment',
        refId: enrollment.id,
      });
    }

    return updatedStudent;
  }

  /** RM-PAR-015 : le profil élève archivé peut être réactivé à tout moment par le Parent. */
  async reactivate(parentId: string, studentId: string) {
    const student = await this.loadOwned(parentId, studentId);
    if (student.status !== 'ARCHIVED') {
      throw new BadRequestException("Cet élève n'est pas archivé");
    }
    return this.prisma.student.update({
      where: { id: studentId },
      data: { status: 'ACTIVE' },
      include: INCLUDE_CURRENT_SITUATION,
    });
  }
}
