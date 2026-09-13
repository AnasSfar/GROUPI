import { PrismaService } from '../../src/prisma/prisma.service';
import { PasswordService } from '../../src/auth/password.service';

/**
 * Avenant 01, Ch. A.2/D.2, RM-PAR-021 : `POST /auth/register` ne crée plus que des comptes
 * Professeur — un Parent n'entre dans GROUPI que via un lien d'invitation
 * (`ParentInvitationsService.accept`, module séparé, hors périmètre de ce chantier). Les suites
 * e2e antérieures à l'avenant qui ne testent PAS ce parcours elles-mêmes ont simplement besoin
 * d'un compte Parent + enfant actifs comme point de départ : ce helper les crée directement en
 * base (même forme que l'ancienne branche PARENT de `AuthService.register()`) plutôt que de
 * dépendre d'un endpoint désormais réservé au Professeur.
 */
export interface RegisterParentDirectInput {
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  city: string;
  studentFirstName: string;
  studentLastName: string;
  schoolLevelId: string;
  schoolId: string;
  /** Défaut : l'année académique `OPEN` la plus récente. */
  academicYearId?: string;
}

const passwordService = new PasswordService();

export async function registerParentDirect(
  prisma: PrismaService,
  input: RegisterParentDirectInput,
): Promise<{ userId: string; studentId: string }> {
  const passwordHash = await passwordService.hash(input.password);
  const academicYear = input.academicYearId
    ? await prisma.academicYear.findUniqueOrThrow({ where: { id: input.academicYearId } })
    : await prisma.academicYear.findFirstOrThrow({ where: { status: 'OPEN' }, orderBy: { startDate: 'desc' } });

  const user = await prisma.user.create({
    data: {
      phone: input.phone,
      passwordHash,
      status: 'ACTIVE', // RM-INV-007/RM-SEC-051 : un compte Parent est actif immédiatement.
      roles: ['PARENT'],
      acceptedTermsAt: new Date(),
    },
  });
  await prisma.parentProfile.create({
    data: {
      id: user.id,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      city: input.city,
      validatedAt: new Date(),
    },
  });

  const student = await prisma.student.create({
    data: {
      parentId: user.id,
      firstName: input.studentFirstName,
      lastName: input.studentLastName,
      status: 'ACTIVE',
    },
  });
  const situation = await prisma.studentSchoolSituation.create({
    data: {
      studentId: student.id,
      academicYearId: academicYear.id,
      schoolLevelId: input.schoolLevelId,
      schoolId: input.schoolId,
      startDate: new Date(),
    },
  });
  await prisma.student.update({ where: { id: student.id }, data: { currentSchoolSituationId: situation.id } });

  return { userId: user.id, studentId: student.id };
}
