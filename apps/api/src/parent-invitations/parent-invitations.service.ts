import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomUUID } from 'crypto';
import { ParentInvitation, ParentInvitationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LevelPoolsService } from '../level-pools/level-pools.service';
import { GroupMembersService } from '../group-members/group-members.service';
import { StudentService } from '../parent-profile/student.service';
import { PasswordService } from '../auth/password.service';
import { AuthService, type TokenPair } from '../auth/auth.service';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AcceptParentInvitationDto } from './dto/accept-parent-invitation.dto';

interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Avenant 01, Ch. A — lien d'invitation général et réutilisable d'un Professeur (RM-INV-*).
 *
 * Schéma du jeton (RM-INV-003 : haché en base, jamais stocké en clair) : contrairement aux jetons
 * usage-unique déjà présents (`PasswordResetToken`...), ce lien doit rester affichable au Professeur
 * à CHAQUE visite de son espace « Inviter des parents » (A.3.1 : « Générer / afficher mon lien »), pas
 * seulement au moment de sa création. On ne peut donc pas se contenter de ne renvoyer le jeton en
 * clair qu'une seule fois : le jeton est un HMAC-SHA256 déterministe de `(id, epoch)` — `epoch` =
 * `rotatedAt` si le lien a déjà été rotationné, sinon `createdAt`. Il est donc reconstructible à la
 * volée par le serveur (jamais stocké en clair, conforme à RM-INV-003) tout en restant stable entre
 * deux lectures et en changeant strictement à chaque rotation (RM-INV-004). Le hachage SHA-256 de ce
 * jeton (jamais l'inverse) est la seule valeur persistée (`tokenHash`), utilisée pour la recherche
 * publique par jeton.
 */
@Injectable()
export class ParentInvitationsService {
  private readonly logger = new Logger(ParentInvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly levelPools: LevelPoolsService,
    private readonly groupMembers: GroupMembersService,
    private readonly students: StudentService,
    private readonly password: PasswordService,
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private tokenSecret(): string {
    return this.config.get<string>('INVITATION_TOKEN_SECRET') ?? this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  private rawTokenFor(invitation: { id: string; createdAt: Date; rotatedAt: Date | null }): string {
    const epoch = (invitation.rotatedAt ?? invitation.createdAt).toISOString();
    return createHmac('sha256', this.tokenSecret()).update(`${invitation.id}:${epoch}`).digest('hex');
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private publicUrlFor(rawToken: string): string {
    const base =
      this.config.get<string>('PUBLIC_APP_URL') ?? this.config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';
    return `${base.replace(/\/$/, '')}/invitation/${rawToken}`;
  }

  private toPublicView(invitation: ParentInvitation) {
    const rawToken = this.rawTokenFor(invitation);
    return {
      id: invitation.id,
      groupId: invitation.groupId,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      rotatedAt: invitation.rotatedAt,
      createdAt: invitation.createdAt,
      token: rawToken,
      url: this.publicUrlFor(rawToken),
    };
  }

  /** RM-INV-006 : expiration paresseuse, à la lecture — même principe que `Enrollment.EXPIRED`. */
  private async expireIfDue(invitation: ParentInvitation, academicYearStatus: string): Promise<ParentInvitation> {
    if (invitation.status !== 'ACTIVE') return invitation;
    const overdue = academicYearStatus !== 'OPEN' || (invitation.expiresAt !== null && invitation.expiresAt < new Date());
    if (!overdue) return invitation;
    return this.prisma.parentInvitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
  }

  private async currentOpenAcademicYear() {
    const year = await this.prisma.academicYear.findFirst({ where: { status: 'OPEN' }, orderBy: { startDate: 'desc' } });
    if (!year) {
      throw new BadRequestException('Aucune année académique ouverte');
    }
    return year;
  }

  /**
   * RM-INV-001 : chaque Professeur `VALIDATED` dispose d'exactement un lien `ACTIVE` par année
   * académique `OPEN` — généré à la volée au premier accès (A.3.1) plutôt que par un hook dédié sur
   * la validation du profil (équivalent fonctionnel explicitement admis par le référentiel : « ou au
   * premier accès à l'espace Inviter des parents »).
   */
  async getOrCreateMine(teacherId: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.status !== 'VALIDATED') {
      throw new ForbiddenException(
        "Votre profil doit être validé par un Administrateur avant de disposer d'un lien d'invitation (RM-INV-001)",
      );
    }
    const academicYear = await this.currentOpenAcademicYear();

    let invitation = await this.prisma.parentInvitation.findFirst({
      where: { teacherId, academicYearId: academicYear.id, groupId: null },
    });

    if (!invitation) {
      const id = randomUUID();
      const rawToken = this.rawTokenFor({ id, createdAt: new Date(), rotatedAt: null });
      invitation = await this.prisma.parentInvitation.create({
        data: {
          id,
          teacherId,
          academicYearId: academicYear.id,
          tokenHash: this.hashToken(rawToken),
          status: 'ACTIVE',
          expiresAt: academicYear.endDate,
        },
      });
      await this.prisma.auditLog.create({
        data: {
          userId: teacherId,
          action: 'PARENT_INVITATION_GENERATED',
          targetType: 'ParentInvitation',
          targetId: invitation.id,
          newValues: { academicYearId: academicYear.id },
        },
      });
      // NOT-INV-001 : lien prêt.
      await this.notifications.notify({
        recipientUserId: teacherId,
        type: 'INV_LINK_READY',
        priority: 'INFORMATION',
        title: 'Votre lien d’invitation est prêt',
        body: "Partagez ce lien avec les familles pour qu'elles rejoignent GROUPI.",
        refType: 'ParentInvitation',
        refId: invitation.id,
      });
    } else {
      invitation = await this.expireIfDue(invitation, academicYear.status);
    }

    return this.toPublicView(invitation);
  }

  /**
   * Ch. A (extension) : lien d'invitation ciblant directement UN groupe standard du Professeur —
   * pour rattacher un nouvel élève en cours d'année sans passer par la salle d'attente. Un groupe
   * de niveau (`kind = LEVEL_POOL`) n'est jamais une cible valable (RM-POOL-009, même logique que
   * l'affectation Ch. C).
   */
  async getOrCreateForGroup(teacherId: string, groupId: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.status !== 'VALIDATED') {
      throw new ForbiddenException(
        "Votre profil doit être validé par un Administrateur avant de disposer d'un lien d'invitation (RM-INV-001)",
      );
    }
    const group = await this.prisma.group.findUnique({ where: { id: groupId }, include: { academicYear: true } });
    if (!group || group.teacherId !== teacherId) {
      throw new NotFoundException('Groupe introuvable');
    }
    if (group.kind !== 'STANDARD') {
      throw new BadRequestException("Une salle d'attente ne peut pas recevoir de lien d'invitation dédié");
    }
    if (group.academicYear.status !== 'OPEN') {
      throw new BadRequestException("Année académique clôturée : impossible de générer ce lien");
    }

    let invitation = await this.prisma.parentInvitation.findFirst({ where: { teacherId, groupId } });

    if (!invitation) {
      const id = randomUUID();
      const rawToken = this.rawTokenFor({ id, createdAt: new Date(), rotatedAt: null });
      invitation = await this.prisma.parentInvitation.create({
        data: {
          id,
          teacherId,
          academicYearId: group.academicYearId,
          groupId: group.id,
          tokenHash: this.hashToken(rawToken),
          status: 'ACTIVE',
          expiresAt: group.academicYear.endDate,
        },
      });
      await this.prisma.auditLog.create({
        data: {
          userId: teacherId,
          action: 'PARENT_INVITATION_GENERATED',
          targetType: 'ParentInvitation',
          targetId: invitation.id,
          newValues: { academicYearId: group.academicYearId, groupId: group.id },
        },
      });
      await this.notifications.notify({
        recipientUserId: teacherId,
        type: 'INV_LINK_READY',
        priority: 'INFORMATION',
        title: 'Votre lien d’invitation est prêt',
        body: `Partagez ce lien pour rattacher directement une famille au groupe "${group.name}".`,
        refType: 'ParentInvitation',
        refId: invitation.id,
      });
    } else {
      invitation = await this.expireIfDue(invitation, group.academicYear.status);
    }

    return this.toPublicView(invitation);
  }

  /** Recharge un lien existant (général si `groupId` est `null`, ciblé sinon) pour rotation/(dés)activation. */
  private async loadInvitation(teacherId: string, groupId: string | null): Promise<ParentInvitation> {
    const invitation = await this.prisma.parentInvitation.findFirst({ where: { teacherId, groupId } });
    if (!invitation) {
      throw new NotFoundException(
        groupId
          ? "Aucun lien d'invitation pour ce groupe — consultez d'abord GET /teacher/invitation/group/:groupId"
          : "Aucun lien d'invitation pour l'instant — consultez d'abord GET /teacher/invitation",
      );
    }
    const academicYear = await this.prisma.academicYear.findUniqueOrThrow({ where: { id: invitation.academicYearId } });
    return this.expireIfDue(invitation, academicYear.status);
  }

  /** RM-INV-004 : rotation — l'ancien jeton devient immédiatement invalide (nouvel epoch HMAC). */
  async rotate(teacherId: string, groupId: string | null = null) {
    const invitation = await this.loadInvitation(teacherId, groupId);
    const rotatedAt = new Date();
    const rawToken = this.rawTokenFor({ id: invitation.id, createdAt: invitation.createdAt, rotatedAt });
    const updated = await this.prisma.parentInvitation.update({
      where: { id: invitation.id },
      data: { rotatedAt, tokenHash: this.hashToken(rawToken) },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'PARENT_INVITATION_ROTATED',
        targetType: 'ParentInvitation',
        targetId: invitation.id,
      },
    });
    await this.notifications.notify({
      recipientUserId: teacherId,
      type: 'INV_LINK_READY',
      priority: 'INFORMATION',
      title: 'Votre lien d’invitation a été régénéré',
      body: "L'ancien lien n'est plus valide.",
      refType: 'ParentInvitation',
      refId: updated.id,
    });
    return this.toPublicView(updated);
  }

  /** RM-INV-005 : désactivation/réactivation — désactivé, aucune consommation n'aboutit. */
  async setEnabled(teacherId: string, enabled: boolean, groupId: string | null = null) {
    const invitation = await this.loadInvitation(teacherId, groupId);
    if (invitation.status === 'EXPIRED') {
      throw new BadRequestException('Ce lien est expiré : régénérez-le plutôt que de le réactiver');
    }
    const nextStatus: ParentInvitationStatus = enabled ? 'ACTIVE' : 'DISABLED';
    const updated = await this.prisma.parentInvitation.update({
      where: { id: invitation.id },
      data: { status: nextStatus },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: enabled ? 'PARENT_INVITATION_ENABLED' : 'PARENT_INVITATION_DISABLED',
        targetType: 'ParentInvitation',
        targetId: invitation.id,
        newValues: { status: nextStatus },
      },
    });
    return this.toPublicView(updated);
  }

  /**
   * A.3.2/RM-INV-008 : preview d'un lien pour un visiteur non authentifié — n'expose QUE le
   * nom/prénom du Professeur et l'année académique. ERR-INV-001/002/003/004.
   */
  async getPublicPreview(token: string) {
    const invitation = await this.loadValidatableInvitation(token);
    return {
      teacherFirstName: invitation.teacher.firstName,
      teacherLastName: invitation.teacher.lastName,
      academicYearLabel: invitation.academicYear.label,
      groupId: invitation.group?.id ?? null,
      groupName: invitation.group?.name ?? null,
    };
  }

  /** Recherche + vérifications communes à `getPublicPreview` et `accept` (ERR-INV-001/002/003/004). */
  private async loadValidatableInvitation(token: string) {
    const tokenHash = this.hashToken(token);
    const invitation = await this.prisma.parentInvitation.findUnique({
      where: { tokenHash },
      include: {
        teacher: { select: { firstName: true, lastName: true, id: true } },
        academicYear: true,
        group: { select: { id: true, name: true, schoolLevelId: true, academicYearId: true, status: true } },
      },
    });
    // ERR-INV-001/004 : jeton inexistant, malformé, ou rotationné (l'ancien jeton ne correspond plus
    // à aucun tokenHash) — indistinguable, même résultat.
    if (!invitation) {
      throw new NotFoundException('Lien d’invitation invalide (ERR-INV-001/004)');
    }
    if (invitation.status === 'DISABLED') {
      throw new BadRequestException('Cette invitation est désactivée : contactez votre professeur (ERR-INV-002)');
    }
    const overdue =
      invitation.academicYear.status !== 'OPEN' ||
      (invitation.expiresAt !== null && invitation.expiresAt < new Date());
    if (invitation.status === 'EXPIRED' || overdue) {
      if (invitation.status !== 'EXPIRED') {
        await this.prisma.parentInvitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
      }
      throw new BadRequestException('Cette invitation a expiré (ERR-INV-003)');
    }
    return invitation;
  }

  /**
   * A.3.3 : consommation du lien — cas 1 (nouveau compte Parent, `currentUser` absent) et cas 2
   * (Parent déjà connecté, `currentUser` présent). RM-INV-009/010 : ne crée jamais d'inscription, de
   * séance, d'écriture comptable, de compte de suivi comptable, et ne consomme jamais de capacité.
   */
  async accept(
    token: string,
    dto: AcceptParentInvitationDto,
    currentUser: AuthenticatedUser | undefined,
    meta: RequestMeta,
  ): Promise<{ tokens: TokenPair | null; student: unknown; attached: boolean }> {
    const invitation = await this.loadValidatableInvitation(token);

    let parentId: string;
    let tokens: TokenPair | null = null;

    if (currentUser) {
      // RM-INV-015/ERR-INV-006 : seul un compte ayant (ou pouvant obtenir) le rôle PARENT peut
      // consommer le lien. Simplification assumée pour cette première vague (voir rapport) : on
      // n'attribue jamais dynamiquement le rôle PARENT à un compte qui ne l'a pas déjà — un compte
      // Professeur/Administrateur sans rôle Parent doit d'abord l'acquérir via son espace (Ch.3.
      // `POST /auth/me/add-role`), hors périmètre de ce lien.
      if (!currentUser.roles.includes('PARENT')) {
        throw new BadRequestException(
          "Ce compte n'a pas le rôle Parent : connectez-vous avec un compte Parent pour utiliser ce lien (ERR-INV-006)",
        );
      }
      parentId = currentUser.id;
    } else {
      // Cas 1 — nouveau Parent (RM-INV-007/RM-SEC-051) : téléphone/nom/prénom/ville/mot de passe/CGU,
      // jamais d'e-mail (Ch. I). Compte ACTIVE immédiatement, aucune validation administrative.
      const phone = dto.phone?.trim();
      if (!phone || !dto.firstName?.trim() || !dto.lastName?.trim() || !dto.city?.trim() || !dto.password) {
        throw new BadRequestException(
          'Téléphone, prénom, nom, ville et mot de passe sont obligatoires pour créer un compte Parent',
        );
      }
      if (!dto.acceptTerms) {
        throw new BadRequestException("L'acceptation des conditions d'utilisation est obligatoire");
      }
      const existingUser = await this.prisma.user.findUnique({ where: { phone } });
      if (existingUser) {
        throw new ConflictException('Un compte existe déjà avec ce numéro de téléphone (ERR-SEC-050)');
      }

      const passwordHash = await this.password.hash(dto.password);
      const created = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            phone,
            passwordHash,
            status: 'ACTIVE', // RM-INV-007/RM-SEC-051 : le lien du Professeur (déjà VALIDATED) fait foi.
            roles: ['PARENT'],
            acceptedTermsAt: new Date(),
          },
        });
        await tx.parentProfile.create({
          data: {
            id: user.id,
            firstName: dto.firstName!.trim(),
            lastName: dto.lastName!.trim(),
            phone,
            city: dto.city!.trim(),
            validatedAt: new Date(),
          },
        });
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'PARENT_ACCOUNT_CREATED_VIA_INVITATION',
            targetType: 'User',
            targetId: user.id,
            newValues: { invitationId: invitation.id, teacherId: invitation.teacherId },
          },
        });
        return user;
      });

      parentId = created.id;
      // Ch. Auth (chantier parallèle) : on réutilise AuthService.login() tel quel plutôt que de
      // dupliquer l'émission JWT/refresh token/UserSession — voir le rapport de ce chantier.
      tokens = await this.authService.login({ identifier: phone, password: dto.password }, meta);
    }

    // --- Enfant : rattachement d'un enfant déjà existant, ou création d'un nouvel enfant (Ch. 7) ---
    let student: Awaited<ReturnType<StudentService['getOne']>>;
    if (dto.studentId) {
      student = await this.students.getOne(parentId, dto.studentId);
    } else {
      if (!dto.studentFirstName?.trim() || !dto.studentLastName?.trim() || !dto.schoolId || !dto.schoolLevelId) {
        throw new BadRequestException(
          'Prénom, nom, établissement et niveau scolaire de l’enfant sont obligatoires',
        );
      }
      student = await this.students.create(parentId, {
        firstName: dto.studentFirstName.trim(),
        lastName: dto.studentLastName.trim(),
        dateOfBirth: dto.studentDateOfBirth,
        schoolLevelId: dto.schoolLevelId,
        schoolId: dto.schoolId,
        schoolClass: dto.schoolClass,
      });
    }

    const isExistingChild = !!dto.studentId;
    const situation = student.currentSchoolSituation;
    // ERR-INV-008 : pour un enfant DÉJÀ existant (cas 2, rattachement à un nouveau Professeur), une
    // situation scolaire absente/inactive ne peut jamais retomber sur "enfant créé sans rattachement"
    // (RM-INV-013, qui ne s'applique qu'à un enfant tout juste créé dans ce même appel) — elle est
    // bloquante, le Parent doit d'abord mettre à jour la situation scolaire (Ch. 7).
    if (isExistingChild && (!situation || situation.status !== 'ACTIVE')) {
      throw new BadRequestException(
        "La situation scolaire active de cet enfant doit être à jour avant de le rattacher à ce Professeur (ERR-INV-008)",
      );
    }
    let attached = false;
    if (situation && situation.status === 'ACTIVE') {
      // RM-INV-011/012 : le niveau de rattachement est celui de la situation scolaire déclarée.
      const validatedLevel = await this.prisma.teacherSchoolLevel.findUnique({
        where: {
          teacherProfileId_schoolLevelId: {
            teacherProfileId: invitation.teacherId,
            schoolLevelId: situation.schoolLevelId,
          },
        },
      });
      if (validatedLevel?.isValidated) {
        const { created } = await this.levelPools.attachStudent({
          studentId: student.id,
          teacherId: invitation.teacherId,
          schoolLevelId: situation.schoolLevelId,
          academicYearId: situation.academicYearId,
          source: 'INVITATION',
          invitationId: invitation.id,
        });
        attached = true;

        // Ch. A (extension) : lien ciblant un groupe standard précis dont le niveau/l'année
        // correspondent à la situation scolaire déclarée — affectation directe (même mécanisme que
        // Ch. C, `GroupMembersService.assign`), pour un nouvel élève en cours d'année qui n'a donc
        // jamais besoin de passer par la salle d'attente. Un échec (groupe complet/fermé, capacité
        // d'abonnement...) n'est jamais bloquant : l'élève reste alors dans la salle d'attente,
        // déjà rattachée ci-dessus.
        let assignedToTargetGroup = false;
        if (
          invitation.group &&
          invitation.group.schoolLevelId === situation.schoolLevelId &&
          invitation.group.academicYearId === situation.academicYearId
        ) {
          try {
            const { assigned } = await this.groupMembers.assign(invitation.teacherId, invitation.group.id, {
              studentIds: [student.id],
            });
            assignedToTargetGroup = assigned.length > 0;
          } catch (err) {
            this.logger.warn(
              `Affectation directe au groupe ${invitation.group.id} depuis l'invitation ${invitation.id} impossible : ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          }
        }

        if (created && !assignedToTargetGroup) {
          // NOT-INV-002 : le Professeur est notifié qu'un élève a rejoint sa salle d'attente.
          const schoolLevel = await this.prisma.schoolLevel.findUnique({ where: { id: situation.schoolLevelId } });
          await this.notifications.notify({
            recipientUserId: invitation.teacherId,
            type: 'INV_STUDENT_JOINED_POOL',
            priority: 'IMPORTANT',
            title: 'Un élève a rejoint votre salle d’attente',
            body: `${student.firstName} ${student.lastName} a rejoint votre salle d'attente "${schoolLevel?.name ?? ''}" via votre lien d'invitation.`,
            refType: 'Student',
            refId: student.id,
          });
        }
        if (created || assignedToTargetGroup) {
          // NOT-INV-004 : bienvenue au Parent, rattachement effectif (affecté directement au groupe
          // ciblé, ou rattaché à la salle d'attente selon le lien utilisé).
          const teacher = await this.prisma.teacherProfile.findUnique({ where: { id: invitation.teacherId } });
          await this.notifications.notify({
            recipientUserId: parentId,
            type: 'INV_WELCOME',
            priority: 'IMPORTANT',
            title: 'Bienvenue sur GROUPI',
            body: `${student.firstName} est bien rattaché·e au suivi de ${teacher?.firstName ?? ''} ${teacher?.lastName ?? ''}.`,
            refType: 'Student',
            refId: student.id,
          });
        }
      } else if (isExistingChild) {
        // ERR-INV-008 : enfant déjà existant dont le niveau ne correspond à aucun niveau enseigné
        // validé de ce Professeur — bloquant (contrairement à RM-INV-013, réservé à un enfant créé
        // dans ce même appel).
        throw new BadRequestException(
          "Le niveau scolaire actuel de cet enfant ne correspond à aucun niveau enseigné par ce Professeur (ERR-INV-008)",
        );
      } else {
        // RM-INV-013 : niveau hors périmètre du Professeur — enfant créé, jamais rattaché, jamais bloquant.
        await this.notifications.notify({
          recipientUserId: invitation.teacherId,
          type: 'INV_STUDENT_OUT_OF_SCOPE',
          priority: 'IMPORTANT',
          title: 'Un enfant déclaré hors de vos niveaux enseignés',
          body: `Un Parent invité a déclaré ${student.firstName} ${student.lastName} en un niveau que vous n'enseignez pas encore. Ajoutez ce niveau à votre profil pour permettre un rattachement.`,
          refType: 'Student',
          refId: student.id,
        });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        userId: parentId,
        action: 'PARENT_INVITATION_CONSUMED',
        targetType: 'ParentInvitation',
        targetId: invitation.id,
        newValues: { studentId: student.id, attached },
      },
    });

    return { tokens, student, attached };
  }

  /** RM-INV-006/B.3 : reconduit les liens manquants à l'ouverture d'une nouvelle année académique
   *  pour chaque Professeur `VALIDATED` disposant déjà d'un lien pour une année antérieure. */
  async ensureInvitationsForNewAcademicYear(academicYearId: string): Promise<{ created: number }> {
    const academicYear = await this.prisma.academicYear.findUniqueOrThrow({ where: { id: academicYearId } });
    const validatedTeachers = await this.prisma.teacherProfile.findMany({
      where: { status: 'VALIDATED' },
      select: { id: true },
    });
    let created = 0;
    for (const teacher of validatedTeachers) {
      const existing = await this.prisma.parentInvitation.findFirst({
        where: { teacherId: teacher.id, academicYearId, groupId: null },
      });
      if (existing) continue;
      const id = randomUUID();
      const rawToken = this.rawTokenFor({ id, createdAt: new Date(), rotatedAt: null });
      await this.prisma.parentInvitation.create({
        data: {
          id,
          teacherId: teacher.id,
          academicYearId,
          tokenHash: this.hashToken(rawToken),
          status: 'ACTIVE',
          expiresAt: academicYear.endDate,
        },
      });
      created++;
    }
    return { created };
  }
}
