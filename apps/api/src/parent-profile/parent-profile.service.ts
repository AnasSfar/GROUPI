import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateParentProfileDto } from './dto/update-parent-profile.dto';
import { CreateSchoolAdditionRequestDto } from './dto/create-school-addition-request.dto';

@Injectable()
export class ParentProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const profile = await this.prisma.parentProfile.findUnique({ where: { id: userId } });
    if (!profile) {
      throw new NotFoundException('Profil parent introuvable');
    }
    return profile;
  }

  /** RM-PAR-001/§6.4 : nom/prénom/téléphone/ville — seuls téléphone et ville restent modifiables librement ici. */
  async updateProfile(userId: string, dto: UpdateParentProfileDto) {
    await this.getMyProfile(userId); // 404 si absent
    return this.prisma.parentProfile.update({ where: { id: userId }, data: dto });
  }
  async listSchoolAdditionRequests(parentId: string) {
    return this.prisma.schoolAdditionRequest.findMany({
      where: { parentId },
      include: { city: true, createdSchool: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Avenant 01, Ch. D.3, RM-POOL-006/010, RM-PAR-022/023 : rattachements actifs (salle d'attente)
   * de mes enfants qui n'ont pas (encore) d'inscription standard active correspondante chez ce même
   * Professeur — alimente l'entrée spéciale "En attente d'affectation" du niveau 2 de la navigation
   * Parent (Ch. D.3). Un élève reste rattaché après affectation (RM-POOL-006) : l'entrée ne doit
   * donc apparaître que tant qu'AUCUNE inscription active de cet élève n'existe chez ce Professeur.
   * RM-POOL-010/RM-PAR-023 : jamais le nom d'un groupe standard non rejoint, ni celui d'un autre
   * élève de la salle d'attente — seulement "chez <Professeur>, <niveau>".
   */
  async listPendingLevelPoolAssignments(parentId: string) {
    const memberships = await this.prisma.levelPoolMembership.findMany({
      where: {
        status: 'ACTIVE',
        student: { parentId, status: 'ACTIVE' },
      },
      select: {
        id: true,
        studentId: true,
        group: {
          select: {
            teacherId: true,
            teacher: { select: { firstName: true, lastName: true } },
            schoolLevel: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (memberships.length === 0) {
      return [];
    }

    // Un élève peut être rattaché à plusieurs Professeurs : on vérifie, pour chaque rattachement,
    // qu'aucune inscription STANDARD active de cet élève n'existe déjà chez CE Professeur précis.
    const standardEnrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: { in: memberships.map((m) => m.studentId) },
        status: 'ACTIVE',
        group: { kind: 'STANDARD' },
      },
      select: { studentId: true, group: { select: { teacherId: true } } },
    });
    const alreadyAssigned = new Set(
      standardEnrollments.map((e) => `${e.studentId}:${e.group.teacherId}`),
    );

    return memberships
      .filter((m) => !alreadyAssigned.has(`${m.studentId}:${m.group.teacherId}`))
      .map((m) => ({
        id: m.id,
        studentId: m.studentId,
        teacher: m.group.teacher,
        schoolLevel: m.group.schoolLevel,
      }));
  }

  async createSchoolAdditionRequest(parentId: string, dto: CreateSchoolAdditionRequestDto) {
    await this.getMyProfile(parentId);
    const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
    if (!city || !city.isActive) {
      throw new BadRequestException('Ville introuvable ou inactive (ERR-SCH-001)');
    }
    const existingSchool = await this.prisma.school.findFirst({
      where: { cityId: dto.cityId, name: { equals: dto.name, mode: 'insensitive' }, isActive: true },
    });
    if (existingSchool) {
      throw new BadRequestException('Cet etablissement existe deja dans le referentiel (RM-SCH-020)');
    }
    const duplicatePending = await this.prisma.schoolAdditionRequest.findFirst({
      where: { parentId, status: 'PENDING', cityId: dto.cityId, name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (duplicatePending) {
      throw new BadRequestException('Une demande identique est deja en attente');
    }
    return this.prisma.schoolAdditionRequest.create({
      data: { parentId, name: dto.name, type: dto.type, cityId: dto.cityId, address: dto.address, comment: dto.comment },
      include: { city: true },
    });
  }
}