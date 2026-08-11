import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateTeachingLocationDto } from './dto/create-teaching-location.dto';
import { CreateDiplomaDto } from './dto/create-diploma.dto';

/** Statuts de groupe considérés « en cours d'usage » — un groupe CLOSED/ARCHIVED ne bloque plus
 * de retrait, la matière/le niveau n'étant plus réellement exploité(e). */
const ACTIVE_GROUP_STATUSES = ['DRAFT', 'ACTIVE', 'FULL', 'SUSPENDED'] as const;

/** RM-TPR-009 : recalculé après chaque modification. Reflète l'exemple du référentiel (§5.5). */
/**
 * RM-TPR-009, §25.8 : pondération officielle du référentiel — Nom 10 / Téléphone 10 / Ville 10 /
 * Matières 20 / Niveaux 20 / Photo 10 / Biographie 10 / Disponibilités 10 (total 100). Nom/téléphone/
 * ville sont obligatoires dès l'inscription (RM-TPR-001), donc toujours acquis (30 pts garantis).
 * Matières/niveaux comptent dès qu'au moins un élément est déclaré (pas de pondération partielle
 * au-delà d'un seul élément — le référentiel ne précise pas de barème supplémentaire par quantité).
 */
function computeCompletenessScore(profile: {
  photo: string | null;
  bio: string | null;
  availability: string | null;
  subjectCount: number;
  schoolLevelCount: number;
}): number {
  let score = 30; // Nom (10) + Téléphone (10) + Ville (10), toujours acquis.
  if (profile.subjectCount > 0) score += 20;
  if (profile.schoolLevelCount > 0) score += 20;
  if (profile.photo && profile.photo.trim().length > 0) score += 10;
  if (profile.bio && profile.bio.trim().length > 0) score += 10;
  if (profile.availability && profile.availability.trim().length > 0) score += 10;
  return score;
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
    return this.recomputeScore(userId);
  }

  /** RM-TPR-002/006/008, ERR-TPR-001 : la matière doit exister, être active, et — si le profil a déjà
   * au moins un niveau — être compatible avec l'un d'eux au moins selon le référentiel SubjectLevel. */
  async addSubject(userId: string, subjectId: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject || !subject.isActive) {
      throw new BadRequestException('Matière introuvable ou inactive');
    }

    const currentLevels = await this.prisma.teacherSchoolLevel.findMany({
      where: { teacherProfileId: userId },
      select: { schoolLevelId: true },
    });
    if (currentLevels.length > 0) {
      const compatible = await this.isSubjectCompatibleWithLevels(
        subjectId,
        currentLevels.map((l) => l.schoolLevelId),
      );
      if (!compatible) {
        throw new BadRequestException(
          'Matière incompatible avec les niveaux déjà déclarés au profil (ERR-TPR-001)',
        );
      }
    }

    const existing = await this.prisma.teacherSubject.findUnique({
      where: { teacherProfileId_subjectId: { teacherProfileId: userId, subjectId } },
    });
    if (!existing) {
      const profile = await this.prisma.teacherProfile.findUniqueOrThrow({ where: { id: userId } });
      // RM-TPR-003/005 : un ajout sur un profil déjà VALIDATED ne met en attente QUE cette ligne —
      // les matières/niveaux précédemment validés restent utilisables sans interruption.
      await this.prisma.teacherSubject.create({
        data: { teacherProfileId: userId, subjectId, isValidated: profile.status !== 'VALIDATED' },
      });
    }

    return this.recomputeScore(userId);
  }

  /** ERR-TPR-007 : impossible de supprimer la dernière matière du profil. Impossible également de
   * retirer une matière encore utilisée par un groupe en cours (le groupe garde sa propre matière
   * figée après la première inscription — le profil ne doit pas se désynchroniser de ce qu'il
   * enseigne réellement). */
  async removeSubject(userId: string, subjectId: string) {
    const count = await this.prisma.teacherSubject.count({ where: { teacherProfileId: userId } });
    if (count <= 1) {
      throw new BadRequestException('Impossible de supprimer la dernière matière du profil');
    }
    const usingGroup = await this.prisma.group.findFirst({
      where: { teacherId: userId, subjectId, status: { in: [...ACTIVE_GROUP_STATUSES] } },
      select: { name: true },
    });
    if (usingGroup) {
      throw new BadRequestException(
        `Impossible de retirer cette matière : le groupe "${usingGroup.name}" l'utilise encore`,
      );
    }
    await this.prisma.teacherSubject.delete({
      where: { teacherProfileId_subjectId: { teacherProfileId: userId, subjectId } },
    });
    return this.recomputeScore(userId);
  }

  /** RM-TPR-002/006/008, ERR-TPR-002 : symétrique d'addSubject — compatible avec au moins une
   * matière déjà déclarée, si le profil en a déjà. */
  async addSchoolLevel(userId: string, schoolLevelId: string) {
    const level = await this.prisma.schoolLevel.findUnique({ where: { id: schoolLevelId } });
    if (!level || !level.isActive) {
      throw new BadRequestException('Niveau scolaire introuvable ou inactif');
    }

    const currentSubjects = await this.prisma.teacherSubject.findMany({
      where: { teacherProfileId: userId },
      select: { subjectId: true },
    });
    if (currentSubjects.length > 0) {
      const compatible = await this.isLevelCompatibleWithSubjects(
        schoolLevelId,
        currentSubjects.map((s) => s.subjectId),
      );
      if (!compatible) {
        throw new BadRequestException(
          'Niveau incompatible avec les matières déjà déclarées au profil (ERR-TPR-002)',
        );
      }
    }

    const existing = await this.prisma.teacherSchoolLevel.findUnique({
      where: { teacherProfileId_schoolLevelId: { teacherProfileId: userId, schoolLevelId } },
    });
    if (!existing) {
      const profile = await this.prisma.teacherProfile.findUniqueOrThrow({ where: { id: userId } });
      // RM-TPR-004/005 : symétrique d'addSubject — seule cette ligne est mise en attente.
      await this.prisma.teacherSchoolLevel.create({
        data: { teacherProfileId: userId, schoolLevelId, isValidated: profile.status !== 'VALIDATED' },
      });
    }

    return this.recomputeScore(userId);
  }

  /** ERR-TPR-008 : impossible de supprimer le dernier niveau du profil. Symétrique de
   * removeSubject : impossible également si un groupe en cours utilise encore ce niveau. */
  async removeSchoolLevel(userId: string, schoolLevelId: string) {
    const count = await this.prisma.teacherSchoolLevel.count({
      where: { teacherProfileId: userId },
    });
    if (count <= 1) {
      throw new BadRequestException('Impossible de supprimer le dernier niveau du profil');
    }
    const usingGroup = await this.prisma.group.findFirst({
      where: { teacherId: userId, schoolLevelId, status: { in: [...ACTIVE_GROUP_STATUSES] } },
      select: { name: true },
    });
    if (usingGroup) {
      throw new BadRequestException(
        `Impossible de retirer ce niveau : le groupe "${usingGroup.name}" l'utilise encore`,
      );
    }
    await this.prisma.teacherSchoolLevel.delete({
      where: { teacherProfileId_schoolLevelId: { teacherProfileId: userId, schoolLevelId } },
    });
    return this.recomputeScore(userId);
  }

  // --- Vérification SubjectLevel (RM-TPR-002/006/008) — logique partagée par addSubject/addSchoolLevel
  // ci-dessus et réutilisable par tout futur appelant (ex. AuthService.register(), qui ne vérifie
  // aujourd'hui que l'existence/l'activation des matières et niveaux, pas leur compatibilité
  // SubjectLevel : voir le rapport de ce chantier — hors périmètre ici, register() reste inchangé). ---

  /** ERR-TPR-001 : la matière est-elle compatible avec au moins un niveau de la liste fournie ? Une
   * liste vide ne contraint rien (rien à comparer pour l'instant). */
  async isSubjectCompatibleWithLevels(subjectId: string, schoolLevelIds: string[]): Promise<boolean> {
    if (schoolLevelIds.length === 0) return true;
    const match = await this.prisma.subjectLevel.findFirst({
      where: { subjectId, isAllowed: true, isActive: true, schoolLevelId: { in: schoolLevelIds } },
    });
    return !!match;
  }

  /** ERR-TPR-002 : symétrique d'isSubjectCompatibleWithLevels. */
  async isLevelCompatibleWithSubjects(schoolLevelId: string, subjectIds: string[]): Promise<boolean> {
    if (subjectIds.length === 0) return true;
    const match = await this.prisma.subjectLevel.findFirst({
      where: { schoolLevelId, isAllowed: true, isActive: true, subjectId: { in: subjectIds } },
    });
    return !!match;
  }

  /**
   * RM-TPR-002/006/008 : vérifie la compatibilité Matière/Niveau pour un ensemble choisi
   * simultanément (ex. création initiale du profil professeur) — chaque matière doit être
   * compatible avec au moins un des niveaux fournis, et réciproquement. Pensée pour être appelée
   * par AuthService.register() avant la création des TeacherSubject/TeacherSchoolLevel initiaux
   * (non branché ici : auth.service.ts est hors périmètre de ce chantier, voir le rapport).
   */
  async assertSubjectLevelSelectionValid(subjectIds: string[], schoolLevelIds: string[]): Promise<void> {
    for (const subjectId of subjectIds) {
      if (!(await this.isSubjectCompatibleWithLevels(subjectId, schoolLevelIds))) {
        throw new BadRequestException(
          `Une matière sélectionnée n'est compatible avec aucun des niveaux sélectionnés (ERR-TPR-001) : ${subjectId}`,
        );
      }
    }
    for (const schoolLevelId of schoolLevelIds) {
      if (!(await this.isLevelCompatibleWithSubjects(schoolLevelId, subjectIds))) {
        throw new BadRequestException(
          `Un niveau sélectionné n'est compatible avec aucune des matières sélectionnées (ERR-TPR-002) : ${schoolLevelId}`,
        );
      }
    }
  }

  // --- Administration (Ch.5.7, RM-TPR-003/004 : validation admin des ajouts matière/niveau) ---

  /** Matières et niveaux ajoutés à un profil déjà VALIDATED, en attente de validation admin. */
  async listPendingItems() {
    const [subjects, schoolLevels] = await Promise.all([
      this.prisma.teacherSubject.findMany({
        where: { isValidated: false },
        include: {
          subject: true,
          teacherProfile: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.teacherSchoolLevel.findMany({
        where: { isValidated: false },
        include: {
          schoolLevel: true,
          teacherProfile: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);
    return { subjects, schoolLevels };
  }

  private async loadPendingSubject(teacherProfileId: string, subjectId: string) {
    const row = await this.prisma.teacherSubject.findUnique({
      where: { teacherProfileId_subjectId: { teacherProfileId, subjectId } },
    });
    if (!row) {
      throw new NotFoundException('Matière introuvable pour ce profil');
    }
    if (row.isValidated) {
      throw new BadRequestException("Cette matière n'est pas en attente de validation");
    }
    return row;
  }

  private async loadPendingSchoolLevel(teacherProfileId: string, schoolLevelId: string) {
    const row = await this.prisma.teacherSchoolLevel.findUnique({
      where: { teacherProfileId_schoolLevelId: { teacherProfileId, schoolLevelId } },
    });
    if (!row) {
      throw new NotFoundException('Niveau scolaire introuvable pour ce profil');
    }
    if (row.isValidated) {
      throw new BadRequestException("Ce niveau n'est pas en attente de validation");
    }
    return row;
  }

  /** NOT-TPR-002/EVT-TPR-006 : valide une matière ajoutée en attente — ne touche ni au statut
   * global du profil ni aux autres matières/niveaux (RM-TPR-005). */
  async validatePendingSubject(actorUserId: string, teacherProfileId: string, subjectId: string) {
    await this.loadPendingSubject(teacherProfileId, subjectId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.teacherSubject.update({
        where: { teacherProfileId_subjectId: { teacherProfileId, subjectId } },
        data: { isValidated: true },
        include: { subject: true },
      });
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'TEACHER_SUBJECT_VALIDATED',
          targetType: 'TeacherProfile',
          targetId: teacherProfileId,
          newValues: { subjectId, isValidated: true },
        },
      });
      return updated;
    });
  }

  /** EVT-TPR-007 : refuse une matière ajoutée en attente — la ligne, jamais devenue valide,
   * est retirée du profil (le Professeur peut la soumettre à nouveau). */
  async rejectPendingSubject(actorUserId: string, teacherProfileId: string, subjectId: string, reason: string) {
    await this.loadPendingSubject(teacherProfileId, subjectId);
    return this.prisma.$transaction(async (tx) => {
      await tx.teacherSubject.delete({
        where: { teacherProfileId_subjectId: { teacherProfileId, subjectId } },
      });
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'TEACHER_SUBJECT_REJECTED',
          targetType: 'TeacherProfile',
          targetId: teacherProfileId,
          newValues: { subjectId, reason },
        },
      });
      return { teacherProfileId, subjectId, rejected: true };
    });
  }

  /** Symétrique de validatePendingSubject pour un niveau scolaire. */
  async validatePendingSchoolLevel(actorUserId: string, teacherProfileId: string, schoolLevelId: string) {
    await this.loadPendingSchoolLevel(teacherProfileId, schoolLevelId);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.teacherSchoolLevel.update({
        where: { teacherProfileId_schoolLevelId: { teacherProfileId, schoolLevelId } },
        data: { isValidated: true },
        include: { schoolLevel: true },
      });
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'TEACHER_SCHOOL_LEVEL_VALIDATED',
          targetType: 'TeacherProfile',
          targetId: teacherProfileId,
          newValues: { schoolLevelId, isValidated: true },
        },
      });
      return updated;
    });
  }

  /** Symétrique de rejectPendingSubject pour un niveau scolaire. */
  async rejectPendingSchoolLevel(
    actorUserId: string,
    teacherProfileId: string,
    schoolLevelId: string,
    reason: string,
  ) {
    await this.loadPendingSchoolLevel(teacherProfileId, schoolLevelId);
    return this.prisma.$transaction(async (tx) => {
      await tx.teacherSchoolLevel.delete({
        where: { teacherProfileId_schoolLevelId: { teacherProfileId, schoolLevelId } },
      });
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'TEACHER_SCHOOL_LEVEL_REJECTED',
          targetType: 'TeacherProfile',
          targetId: teacherProfileId,
          newValues: { schoolLevelId, reason },
        },
      });
      return { teacherProfileId, schoolLevelId, rejected: true };
    });
  }

  // --- Diplômes (Ch.5.3/5.9, RM-TPR-012 : dépôt facultatif, non vérifié en V1) ---

  async listDiplomas(userId: string) {
    return this.prisma.diploma.findMany({
      where: { teacherProfileId: userId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async addDiploma(userId: string, dto: CreateDiplomaDto) {
    await this.loadProfile(userId); // 404 si profil absent
    return this.prisma.diploma.create({
      data: { teacherProfileId: userId, fileName: dto.fileName, fileUrl: dto.fileUrl },
    });
  }

  async removeDiploma(userId: string, diplomaId: string) {
    const diploma = await this.prisma.diploma.findUnique({ where: { id: diplomaId } });
    if (!diploma) {
      throw new NotFoundException('Diplôme introuvable');
    }
    if (diploma.teacherProfileId !== userId) {
      throw new ForbiddenException("Ce diplôme n'appartient pas à votre compte");
    }
    await this.prisma.diploma.delete({ where: { id: diplomaId } });
    return { id: diplomaId, deleted: true };
  }

  // --- Lieux d'enseignement (Ch.10.3, référencés par les créneaux de planning des groupes) ---

  async listLocations(userId: string) {
    return this.prisma.teachingLocation.findMany({
      where: { teacherId: userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createLocation(userId: string, dto: CreateTeachingLocationDto) {
    return this.prisma.teachingLocation.create({
      data: { teacherId: userId, label: dto.label, address: dto.address },
    });
  }

  async deactivateLocation(userId: string, locationId: string) {
    const location = await this.prisma.teachingLocation.findUnique({ where: { id: locationId } });
    if (!location) {
      throw new NotFoundException('Lieu d’enseignement introuvable');
    }
    if (location.teacherId !== userId) {
      throw new ForbiddenException("Ce lieu n'appartient pas à votre compte");
    }
    return this.prisma.teachingLocation.update({
      where: { id: locationId },
      data: { isActive: false },
    });
  }

  // RM-TPR-009 : recalculée en relisant systématiquement matières/niveaux depuis la base plutôt
  // qu'en les faisant transiter par chaque appelant — évite qu'un appelant oublie d'inclure ces
  // compteurs et fasse silencieusement retomber le score sur l'ancienne formule incomplète.
  private async recomputeScore(userId: string) {
    const profile = await this.prisma.teacherProfile.findUniqueOrThrow({
      where: { id: userId },
      select: {
        photo: true,
        bio: true,
        availability: true,
        _count: { select: { subjects: true, schoolLevels: true } },
      },
    });
    const completenessScore = computeCompletenessScore({
      photo: profile.photo,
      bio: profile.bio,
      availability: profile.availability,
      subjectCount: profile._count.subjects,
      schoolLevelCount: profile._count.schoolLevels,
    });
    await this.prisma.teacherProfile.update({
      where: { id: userId },
      data: { completenessScore },
    });
    return this.loadProfile(userId);
  }
}
