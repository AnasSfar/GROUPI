import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

/** RM-TPR-009 : recalculé après chaque modification. Reflète l'exemple du référentiel (§5.5). */
function computeCompletenessScore(profile: {
  photo: string | null;
  bio: string | null;
  experience: string | null;
}): number {
  // Nom/téléphone/ville sont obligatoires dès l'inscription, donc toujours acquis (3/6).
  const alwaysPresent = 3;
  const optional = [profile.photo, profile.bio, profile.experience];
  const filledOptional = optional.filter((v) => v && v.trim().length > 0).length;
  return Math.round(((alwaysPresent + filledOptional) / 6) * 100);
}

@Injectable()
export class TeacherProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadProfile(userId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { id: userId },
      include: {
        subjects: { include: { subject: true } },
        schoolLevels: { include: { schoolLevel: true } },
      },
    });
    if (!profile) {
      throw new NotFoundException('Profil professeur introuvable');
    }
    return profile;
  }

  async getMyProfile(userId: string) {
    return this.loadProfile(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.loadProfile(userId); // 404 si absent
    const updated = await this.prisma.teacherProfile.update({
      where: { id: userId },
      data: dto,
    });
    return this.recomputeScore(userId, updated);
  }

  /** RM-TPR-002/006 : la matière doit exister et être active. */
  async addSubject(userId: string, subjectId: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject || !subject.isActive) {
      throw new BadRequestException('Matière introuvable ou inactive');
    }

    await this.prisma.teacherSubject.upsert({
      where: { teacherProfileId_subjectId: { teacherProfileId: userId, subjectId } },
      create: { teacherProfileId: userId, subjectId },
      update: {},
    });

    const profile = await this.prisma.teacherProfile.findUniqueOrThrow({ where: { id: userId } });
    return this.recomputeScore(userId, profile);
  }

  /** ERR-TPR-007 : impossible de supprimer la dernière matière du profil. */
  async removeSubject(userId: string, subjectId: string) {
    const count = await this.prisma.teacherSubject.count({ where: { teacherProfileId: userId } });
    if (count <= 1) {
      throw new BadRequestException('Impossible de supprimer la dernière matière du profil');
    }
    await this.prisma.teacherSubject.delete({
      where: { teacherProfileId_subjectId: { teacherProfileId: userId, subjectId } },
    });
    const profile = await this.prisma.teacherProfile.findUniqueOrThrow({ where: { id: userId } });
    return this.recomputeScore(userId, profile);
  }

  async addSchoolLevel(userId: string, schoolLevelId: string) {
    const level = await this.prisma.schoolLevel.findUnique({ where: { id: schoolLevelId } });
    if (!level || !level.isActive) {
      throw new BadRequestException('Niveau scolaire introuvable ou inactif');
    }

    await this.prisma.teacherSchoolLevel.upsert({
      where: { teacherProfileId_schoolLevelId: { teacherProfileId: userId, schoolLevelId } },
      create: { teacherProfileId: userId, schoolLevelId },
      update: {},
    });

    const profile = await this.prisma.teacherProfile.findUniqueOrThrow({ where: { id: userId } });
    return this.recomputeScore(userId, profile);
  }

  /** ERR-TPR-008 : impossible de supprimer le dernier niveau du profil. */
  async removeSchoolLevel(userId: string, schoolLevelId: string) {
    const count = await this.prisma.teacherSchoolLevel.count({
      where: { teacherProfileId: userId },
    });
    if (count <= 1) {
      throw new BadRequestException('Impossible de supprimer le dernier niveau du profil');
    }
    await this.prisma.teacherSchoolLevel.delete({
      where: { teacherProfileId_schoolLevelId: { teacherProfileId: userId, schoolLevelId } },
    });
    const profile = await this.prisma.teacherProfile.findUniqueOrThrow({ where: { id: userId } });
    return this.recomputeScore(userId, profile);
  }

  private async recomputeScore(
    userId: string,
    profile: { photo: string | null; bio: string | null; experience: string | null },
  ) {
    const completenessScore = computeCompletenessScore(profile);
    await this.prisma.teacherProfile.update({
      where: { id: userId },
      data: { completenessScore },
    });
    return this.loadProfile(userId);
  }
}
