import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AccountingService } from '../accounting/accounting.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateGroupChangeRequestDto } from './dto/create-group-change-request.dto';
import { TeacherInitiateGroupChangeRequestDto } from './dto/teacher-initiate-group-change-request.dto';
import { AcceptGroupChangeRequestDto } from './dto/accept-group-change-request.dto';
import { RejectGroupChangeRequestDto } from './dto/reject-group-change-request.dto';

function dateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function todayDateOnly(): Date {
  return dateOnly(new Date());
}

const INCLUDE_VIEW = {
  originalEnrollment: {
    select: {
      id: true,
      status: true,
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          parentId: true,
          parent: { select: { user: { select: { email: true } } } },
        },
      },
      group: { select: { id: true, name: true, teacherId: true, academicYearId: true } },
    },
  },
  targetGroup: {
    select: {
      id: true,
      name: true,
      capacity: true,
      status: true,
      teacherId: true,
      academicYearId: true,
      teacher: { select: { firstName: true, lastName: true } },
    },
  },
  newEnrollment: { select: { id: true, status: true } },
} satisfies Prisma.GroupChangeRequestInclude;

type GroupChangeView = Prisma.GroupChangeRequestGetPayload<{ include: typeof INCLUDE_VIEW }>;

/** RM-CHG-002 : `PARENT` pour une demande créée via `create()`, `TEACHER` pour une proposition créée
 *  via `teacherInitiate()` — voir `GroupChangeService.initiatedByTeacherIds`. */
type GroupChangeViewWithInitiator = GroupChangeView & { initiatedBy: 'PARENT' | 'TEACHER' };

/** Forme minimale nécessaire à `loadTargetGroupForChange`, satisfaite par le résultat de
 *  `prisma.enrollment.findUnique({ include: { group: { include: { academicYear: true } } } })`. */
interface OriginalEnrollmentForChange {
  id: string;
  groupId: string;
  studentId: string;
  group: { teacherId: string; subjectId: string; schoolLevelId: string };
}

/**
 * Ch.12.12 : changement de groupe — variante **définitive** uniquement (voir le commentaire du
 * modèle `GroupChangeRequest` dans schema.prisma pour la variante provisoire, hors scope).
 */
@Injectable()
export class GroupChangeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
    private readonly accounting: AccountingService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  /**
   * Applique paresseusement l'archivage de l'inscription d'origine une fois la date effective
   * atteinte (même principe que `EnrollmentsService.expireIfDue` / le verrouillage des séances) :
   * aucun job planifié dans ce projet, donc la transition est résolue à la lecture.
   *
   * RM-CHG-016 : "les séances déjà planifiées dans l'ancien groupe après la date d'effet sont
   * automatiquement annulées pour l'élève concerné." Aucune séance de groupe n'est réellement
   * annulée ici (elle reste valable pour les autres élèves du groupe d'origine, RM-SES/Attendance
   * concernent le groupe entier) : ce qui doit disparaître, c'est uniquement la présence ATTENDUE de
   * CET élève sur les séances futures du groupe d'origine. Or `AttendanceService`/`SessionsService`
   * construisent systématiquement la liste des élèves à faire l'appel à partir des inscriptions
   * `ACTIVE` du groupe AU MOMENT de la séance (`enrollment.findMany({ groupId, status: 'ACTIVE' })`,
   * cf. `AttendanceService.validate`/`listSessionPayments`) — aucune `Attendance` n'est jamais créée
   * à l'avance pour une séance PLANNED. Le passage de l'inscription d'origine à `ARCHIVED` ci-dessous
   * suffit donc à exclure l'élève de tout appel futur dans son ancien groupe, sans qu'aucune écriture
   * supplémentaire ne soit nécessaire ici : RM-CHG-016 est satisfaite par ce seul changement de
   * statut, à condition que cette transition ait bien été résolue avant la séance concernée (même
   * limite de conception que l'expiration paresseuse des `Enrollment`/`Session` ailleurs dans ce
   * projet — aucun job planifié ne garantit qu'un `GroupChangeRequest` en attente d'application soit
   * lu avant la prochaine séance ; ce risque préexiste dans toute l'architecture "lazy" du projet et
   * n'est pas spécifique au changement de groupe).
   */
  private async applyIfDue(request: GroupChangeView): Promise<GroupChangeView> {
    if (request.status !== 'ACCEPTED' || !request.effectiveDate) {
      return request;
    }
    if (dateOnly(request.effectiveDate) > todayDateOnly()) {
      return request;
    }
    if (request.originalEnrollment.status !== 'ACTIVE') {
      return request;
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: request.originalEnrollment.id },
        data: { status: 'ARCHIVED' },
      });
      const group = await tx.group.findUniqueOrThrow({ where: { id: request.originalEnrollment.group.id } });
      if (group.status === 'FULL') {
        const activeCount = await tx.enrollment.count({
          where: { groupId: group.id, status: 'ACTIVE' },
        });
        if (activeCount < group.capacity) {
          await tx.group.update({ where: { id: group.id }, data: { status: 'ACTIVE' } });
        }
      }
      await tx.groupChangeRequest.update({ where: { id: request.id }, data: { appliedAt: new Date() } });
    });
    return this.prisma.groupChangeRequest.findUniqueOrThrow({
      where: { id: request.id },
      include: INCLUDE_VIEW,
    });
  }

  private async applyManyIfDue(requests: GroupChangeView[]): Promise<GroupChangeView[]> {
    return Promise.all(requests.map((r) => this.applyIfDue(r)));
  }

  /**
   * RM-CHG-002 : distingue une demande créée par le Parent (`create`) d'une proposition créée par le
   * Professeur (`teacherInitiate`). Aucun champ dédié sur `GroupChangeRequest` pour ce chantier (pas
   * de migration) : le marqueur est porté par un `AuditLog` créé à la demande (action
   * `GROUP_CHANGE_PROPOSED_BY_TEACHER`), sur le même principe que la traçabilité RM-ACC-019/020 déjà
   * utilisée plus bas pour ACCEPTED/REJECTED. Requête unique pour toute une liste (évite le N+1).
   */
  private async initiatedByTeacherIds(requestIds: string[]): Promise<Set<string>> {
    if (requestIds.length === 0) return new Set();
    const logs = await this.prisma.auditLog.findMany({
      where: {
        targetType: 'GroupChangeRequest',
        targetId: { in: requestIds },
        action: 'GROUP_CHANGE_PROPOSED_BY_TEACHER',
      },
      select: { targetId: true },
    });
    return new Set(logs.map((l) => l.targetId));
  }

  private async isTeacherInitiated(requestId: string): Promise<boolean> {
    return (await this.initiatedByTeacherIds([requestId])).has(requestId);
  }

  private async annotateInitiator(requests: GroupChangeView[]): Promise<GroupChangeViewWithInitiator[]> {
    const teacherInitiatedIds = await this.initiatedByTeacherIds(requests.map((r) => r.id));
    return requests.map((r) => ({ ...r, initiatedBy: teacherInitiatedIds.has(r.id) ? 'TEACHER' : 'PARENT' }));
  }

  /** Variante mono-élément d'`annotateInitiator`, pour les endpoints qui renvoient une seule demande. */
  private async annotateOne(request: GroupChangeView): Promise<GroupChangeViewWithInitiator> {
    return (await this.annotateInitiator([request]))[0];
  }

  /**
   * RM-CHG-011 : vérifications de compatibilité communes aux deux initiateurs possibles (Parent via
   * `create`, Professeur via `teacherInitiate`) — groupe cible différent du groupe actuel, pas de
   * demande PENDING déjà en cours (RM-CHG-021), groupe cible actif/ouvert, même Professeur
   * (RM-CHG-010), même matière ET même niveau scolaire (RM-CHG-011 — comparaison stricte, cf. mission),
   * élève pas déjà inscrit dans le groupe cible.
   */
  private async loadTargetGroupForChange(original: OriginalEnrollmentForChange, targetGroupId: string) {
    if (original.groupId === targetGroupId) {
      throw new BadRequestException('Le groupe cible est identique au groupe actuel');
    }

    const existingPending = await this.prisma.groupChangeRequest.findFirst({
      where: { originalEnrollmentId: original.id, status: 'PENDING' },
    });
    if (existingPending) {
      throw new BadRequestException(
        'Une demande de changement de groupe est déjà en attente pour cette inscription (RM-CHG-021)',
      );
    }

    const targetGroup = await this.prisma.group.findUnique({
      where: { id: targetGroupId },
      include: { academicYear: true, teacher: { include: { user: true } } },
    });
    if (!targetGroup) {
      throw new NotFoundException('Groupe cible introuvable');
    }
    if (targetGroup.status === 'ARCHIVED' || targetGroup.status === 'CLOSED') {
      throw new BadRequestException('Groupe cible fermé ou archivé : changement impossible (ERR-INS-003)');
    }
    if (targetGroup.status === 'SUSPENDED') {
      throw new BadRequestException('Groupe cible suspendu : changement impossible (ERR-INS-007)');
    }
    if (targetGroup.teacher.status !== 'VALIDATED' || targetGroup.teacher.user.status !== 'ACTIVE') {
      throw new BadRequestException('Professeur du groupe cible suspendu ou inactif (ERR-INS-005)');
    }
    if (targetGroup.academicYear.status !== 'OPEN') {
      throw new BadRequestException('Année académique du groupe cible clôturée (ERR-INS-006)');
    }
    if (targetGroup.teacherId !== original.group.teacherId) {
      throw new BadRequestException(
        'Le changement de groupe ne concerne que deux groupes du même Professeur (RM-CHG-010) : pour changer de Professeur, effectuez une nouvelle demande d’inscription (ERR-CHG-008)',
      );
    }
    // RM-CHG-011 : "même matière, niveau compatible" — comparaison stricte sur les deux critères
    // (matière ET niveau scolaire), choix le plus sûr en l'absence d'une notion explicite de
    // "niveaux compatibles entre eux" ailleurs dans le référentiel/schéma pour ce chantier.
    if (targetGroup.subjectId !== original.group.subjectId) {
      throw new BadRequestException(
        'Le groupe cible n’enseigne pas la même matière que le groupe d’origine : changement impossible (RM-CHG-011)',
      );
    }
    if (targetGroup.schoolLevelId !== original.group.schoolLevelId) {
      throw new BadRequestException(
        'Le groupe cible n’enseigne pas le même niveau scolaire que le groupe d’origine : changement impossible (RM-CHG-011)',
      );
    }

    const existingInTarget = await this.prisma.enrollment.findFirst({
      where: { studentId: original.studentId, groupId: targetGroup.id, status: { in: ['PENDING_VALIDATION', 'ACTIVE'] } },
    });
    if (existingInTarget) {
      throw new BadRequestException('Une inscription existe déjà pour cet élève dans le groupe cible (ERR-INS-002/032)');
    }

    return targetGroup;
  }

  // --- Vue Parent -------------------------------------------------------------------------

  async listMineForParent(parentId: string): Promise<GroupChangeViewWithInitiator[]> {
    const requests = await this.prisma.groupChangeRequest.findMany({
      where: { originalEnrollment: { student: { parentId } } },
      include: INCLUDE_VIEW,
      orderBy: { requestedAt: 'desc' },
    });
    return this.annotateInitiator(await this.applyManyIfDue(requests));
  }

  /** Ch.12.12 : demande de changement — les vérifications reprennent celles d'une nouvelle inscription (12.12). */
  async create(parentId: string, dto: CreateGroupChangeRequestDto): Promise<GroupChangeViewWithInitiator> {
    const original = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId },
      include: { student: true, group: { include: { academicYear: true } } },
    });
    if (!original || original.student.parentId !== parentId) {
      throw new BadRequestException("Cette inscription n'appartient pas au parent connecté");
    }
    if (original.status !== 'ACTIVE') {
      throw new BadRequestException('Seule une inscription active peut faire l’objet d’un changement de groupe');
    }

    const targetGroup = await this.loadTargetGroupForChange(original, dto.targetGroupId);

    const created = await this.prisma.groupChangeRequest.create({
      data: {
        originalEnrollmentId: original.id,
        targetGroupId: targetGroup.id,
        status: 'PENDING',
        requestedAt: new Date(),
      },
      include: INCLUDE_VIEW,
    });
    return this.annotateOne(created);
  }

  /**
   * RM-CHG-002 (Ch.20.3) : le Professeur peut lui-même initier une demande de changement de groupe
   * pour un de ses élèves — réservé au Professeur propriétaire du groupe D'ORIGINE de l'inscription
   * (pas nécessairement du groupe cible : les deux sont de toute façon exigés identiques par
   * RM-CHG-010, vérifié dans `loadTargetGroupForChange`). Reprend les mêmes vérifications de
   * compatibilité que `create()`.
   *
   * Circuit de décision : RM-CHG-010 impose que le groupe d'origine ET le groupe cible appartiennent
   * au même Professeur — l'initiateur de cette méthode EST donc toujours aussi "le Professeur du
   * groupe cible" qui, dans le circuit existant (`accept`/`reject`), est censé valider la demande.
   * Lui faire "accepter" sa propre proposition serait une auto-validation vide de sens et
   * contredirait RM-CHG-003 ("aucune modification n'est réalisée sans validation des parties
   * concernées"). Le circuit bascule donc entièrement vers le Parent, conformément à 20.3 : "le
   * Parent est invité à accepter ou à refuser cette proposition" — voir `confirmTeacherProposal` /
   * `declineTeacherProposal`. `accept()`/`reject()` refusent explicitement toute demande marquée
   * comme proposée par le Professeur (cf. `isTeacherInitiated`), pour qu'un seul circuit de décision
   * ne soit jamais accessible aux deux rôles à la fois.
   *
   * La date d'effet, normalement choisie "par le Professeur lors de la validation" (RM-CHG-008), est
   * donc fixée ici dès la création : c'est le seul moment où le Professeur intervient dans ce circuit.
   */
  async teacherInitiate(
    teacherId: string,
    dto: TeacherInitiateGroupChangeRequestDto,
  ): Promise<GroupChangeViewWithInitiator> {
    const original = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId },
      include: { student: true, group: { include: { academicYear: true } } },
    });
    if (!original) {
      throw new NotFoundException('Inscription introuvable');
    }
    if (original.group.teacherId !== teacherId) {
      throw new ForbiddenException("Cette inscription n'appartient pas à un de vos groupes");
    }
    if (original.status !== 'ACTIVE') {
      throw new BadRequestException('Seule une inscription active peut faire l’objet d’un changement de groupe');
    }

    const targetGroup = await this.loadTargetGroupForChange(original, dto.targetGroupId);

    const effectiveDate = dateOnly(new Date(dto.effectiveDate));
    if (effectiveDate < todayDateOnly()) {
      throw new BadRequestException("Date d'effet antérieure à aujourd'hui (ERR-CHG-009)");
    }

    const created = await this.prisma.groupChangeRequest.create({
      data: {
        originalEnrollmentId: original.id,
        targetGroupId: targetGroup.id,
        status: 'PENDING',
        requestedAt: new Date(),
        effectiveDate,
      },
      include: INCLUDE_VIEW,
    });

    // Marqueur d'initiateur (voir `initiatedByTeacherIds`) + RM-ACC-019/020 : traçabilité de la
    // proposition elle-même, symétrique de celle déjà faite pour ACCEPTED/REJECTED plus bas.
    await this.prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'GROUP_CHANGE_PROPOSED_BY_TEACHER',
        targetType: 'GroupChangeRequest',
        targetId: created.id,
        newValues: { status: 'PENDING', targetGroupId: targetGroup.id, effectiveDate },
        metadata: dto.note ? { note: dto.note } : undefined,
      },
    });

    // NOT-CHG-008 : le Parent est informé de la proposition du Professeur.
    await this.notifications.notify({
      recipientUserId: original.student.parentId,
      type: 'GROUP_CHANGE_PROPOSED',
      priority: 'IMPORTANT',
      title: 'Proposition de changement de groupe',
      body: `Le Professeur propose de faire passer ${original.student.firstName} ${original.student.lastName} vers le groupe "${targetGroup.name}", à compter du ${effectiveDate.toLocaleDateString('fr-FR')}.${dto.note ? ` Motif : ${dto.note}` : ''}`,
      refType: 'GroupChangeRequest',
      refId: created.id,
    });

    return this.annotateOne(created);
  }

  private async loadOwnedByParent(parentId: string, id: string): Promise<GroupChangeView> {
    const request = await this.prisma.groupChangeRequest.findUnique({ where: { id }, include: INCLUDE_VIEW });
    if (!request) {
      throw new NotFoundException('Demande de changement de groupe introuvable');
    }
    if (request.originalEnrollment.student.parentId !== parentId) {
      throw new ForbiddenException("Cette demande n'appartient pas à votre compte");
    }
    return this.applyIfDue(request);
  }

  /**
   * ERR-CHG-012 : au-delà de PENDING, l'annulation reste possible tant que le changement n'a pas
   * encore pris effet (`appliedAt` nul, cf. `applyIfDue`) — la nouvelle inscription créée à
   * l'acceptation est alors annulée et la place qu'elle occupait est restituée au groupe cible.
   * Une fois la date d'effet atteinte, l'ancienne inscription est déjà clôturée : trop tard.
   */
  async cancel(parentId: string, id: string): Promise<GroupChangeViewWithInitiator> {
    const request = await this.loadOwnedByParent(parentId, id);
    if (request.status === 'PENDING') {
      await this.prisma.groupChangeRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
      const updated = await this.prisma.groupChangeRequest.findUniqueOrThrow({ where: { id }, include: INCLUDE_VIEW });
      return this.annotateOne(updated);
    }
    if (request.status === 'ACCEPTED' && !request.appliedAt && request.newEnrollment) {
      const newEnrollmentId = request.newEnrollment.id;
      await this.prisma.$transaction(async (tx) => {
        await tx.enrollment.update({ where: { id: newEnrollmentId }, data: { status: 'CANCELLED' } });
        // Jamais facturé (aucune séance ne peut lui être rattachée avant la date d'effet, encore
        // future ici) : le compte de suivi comptable créé à l'acceptation peut être retiré sans
        // violer le principe d'immutabilité (Ch.15.5), qui ne protège que les écritures postées.
        await tx.accountingAccount.deleteMany({ where: { enrollmentId: newEnrollmentId } });
        const targetGroup = await tx.group.findUniqueOrThrow({ where: { id: request.targetGroup.id } });
        if (targetGroup.status === 'FULL') {
          const activeCount = await tx.enrollment.count({
            where: { groupId: targetGroup.id, status: 'ACTIVE' },
          });
          if (activeCount < targetGroup.capacity) {
            await tx.group.update({ where: { id: targetGroup.id }, data: { status: 'ACTIVE' } });
          }
        }
        await tx.groupChangeRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
      });
      const updated = await this.prisma.groupChangeRequest.findUniqueOrThrow({ where: { id }, include: INCLUDE_VIEW });
      return this.annotateOne(updated);
    }
    throw new BadRequestException('Ce changement a déjà pris effet : annulation hors délai (ERR-CHG-012)');
  }

  // --- Vue Professeur (du groupe cible) ----------------------------------------------------

  async listForTeacherGroup(teacherId: string, groupId: string): Promise<GroupChangeViewWithInitiator[]> {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Groupe introuvable');
    }
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException("Ce groupe n'appartient pas à votre compte");
    }
    const requests = await this.prisma.groupChangeRequest.findMany({
      where: { targetGroupId: groupId },
      include: INCLUDE_VIEW,
      orderBy: { requestedAt: 'desc' },
    });
    return this.annotateInitiator(await this.applyManyIfDue(requests));
  }

  private async loadOwnedByTeacher(teacherId: string, id: string): Promise<GroupChangeView> {
    const request = await this.prisma.groupChangeRequest.findUnique({ where: { id }, include: INCLUDE_VIEW });
    if (!request) {
      throw new NotFoundException('Demande de changement de groupe introuvable');
    }
    if (request.targetGroup.teacherId !== teacherId) {
      throw new ForbiddenException("Cette demande ne concerne pas un de vos groupes");
    }
    return this.applyIfDue(request);
  }

  /**
   * Ch.12.12/RM-CHG-013 : cœur commun à `accept()` (Professeur décide d'une demande du Parent) et
   * `confirmTeacherProposal()` (Parent confirme une proposition du Professeur) — la capacité du
   * groupe cible est vérifiée à cet instant précis (ERR-INS-012) et une nouvelle inscription
   * indépendante y est systématiquement créée, avec son propre compte de suivi comptable sur lequel
   * le solde du compte d'origine est immédiatement reporté (RM-CHG-013). Si la date effective est
   * déjà atteinte (aujourd'hui ou passée), l'ancienne inscription est archivée immédiatement dans la
   * même transaction ; sinon l'archivage est appliqué paresseusement plus tard (`applyIfDue`).
   */
  private async finalizeAcceptance(
    request: GroupChangeView,
    effectiveDate: Date,
    decidedById: string,
  ): Promise<GroupChangeViewWithInitiator> {
    const targetGroup = await this.prisma.group.findUniqueOrThrow({ where: { id: request.targetGroup.id } });
    if (targetGroup.status === 'ARCHIVED' || targetGroup.status === 'CLOSED' || targetGroup.status === 'SUSPENDED') {
      throw new BadRequestException('Groupe cible fermé, suspendu ou archivé : acceptation impossible (ERR-INS-026)');
    }
    const activeCount = await this.prisma.enrollment.count({
      where: { groupId: targetGroup.id, status: 'ACTIVE' },
    });
    if (activeCount >= targetGroup.capacity) {
      throw new BadRequestException('Changement de groupe impossible : nouveau groupe complet (ERR-INS-012)');
    }

    await this.subscriptions.assertActiveEnrollmentCapacity(targetGroup.teacherId, 1, 'ERR-INS-013');
    const immediate = effectiveDate <= todayDateOnly();

    await this.prisma.$transaction(async (tx) => {
      const newEnrollment = await tx.enrollment.create({
        data: {
          studentId: request.originalEnrollment.student.id,
          groupId: targetGroup.id,
          status: 'ACTIVE',
          requestedAt: new Date(),
          decidedAt: new Date(),
          decidedById,
        },
      });
      // RM-CPT-002 : compte de suivi comptable créé automatiquement à l'activation — ici la
      // nouvelle inscription est immédiatement ACTIVE (Ch.12.12), donc créée dans la même transaction.
      const newAccount = await this.accounting.createAccountForEnrollment(tx, newEnrollment.id, targetGroup.academicYearId);
      // RM-CHG-013 : le solde éventuel de l'ancien compte est reporté sur le nouveau — l'ancien
      // compte n'est jamais modifié (RM-CHG-007).
      await this.accounting.carryOverBalanceForGroupChange(tx, {
        originalEnrollmentId: request.originalEnrollment.id,
        newAccount,
        authorId: decidedById,
      });
      if (activeCount + 1 >= targetGroup.capacity) {
        await tx.group.update({ where: { id: targetGroup.id }, data: { status: 'FULL' } });
      }
      await tx.groupChangeRequest.update({
        where: { id: request.id },
        data: {
          status: 'ACCEPTED',
          decidedAt: new Date(),
          decidedById,
          effectiveDate,
          newEnrollmentId: newEnrollment.id,
          appliedAt: immediate ? new Date() : null,
        },
      });
      if (immediate) {
        // RM-CHG-016 : voir le commentaire d'`applyIfDue` — l'archivage immédiat de l'inscription
        // d'origine suffit à l'exclure de tout appel futur dans son ancien groupe.
        await tx.enrollment.update({
          where: { id: request.originalEnrollment.id },
          data: { status: 'ARCHIVED' },
        });
        const originGroup = await tx.group.findUniqueOrThrow({ where: { id: request.originalEnrollment.group.id } });
        if (originGroup.status === 'FULL') {
          const originActiveCount = await tx.enrollment.count({
            where: { groupId: originGroup.id, status: 'ACTIVE' },
          });
          if (originActiveCount < originGroup.capacity) {
            await tx.group.update({ where: { id: originGroup.id }, data: { status: 'ACTIVE' } });
          }
        }
      }

      // RM-ACC-019/020 : traçabilité centralisée de l'acceptation d'un changement de groupe.
      await tx.auditLog.create({
        data: {
          userId: decidedById,
          action: 'GROUP_CHANGE_ACCEPTED',
          targetType: 'GroupChangeRequest',
          targetId: request.id,
          oldValues: { status: 'PENDING' },
          newValues: {
            status: 'ACCEPTED',
            targetGroupId: targetGroup.id,
            newEnrollmentId: newEnrollment.id,
            effectiveDate,
          },
        },
      });
    });

    const updated = await this.prisma.groupChangeRequest.findUniqueOrThrow({
      where: { id: request.id },
      include: INCLUDE_VIEW,
    });

    await this.warnIfDebtor(targetGroup.teacherId, request);
    await this.warnIfFrequentChanges(targetGroup.teacherId, request);

    // NOT-INS-007 : hors transaction — un échec d'envoi ne doit jamais annuler la décision.
    await this.notifications.notify({
      recipientUserId: request.originalEnrollment.student.parentId,
      type: 'GROUP_CHANGE_ACCEPTED',
      priority: 'IMPORTANT',
      title: 'Changement de groupe accepté',
      body: `Le changement de groupe de ${request.originalEnrollment.student.firstName} ${request.originalEnrollment.student.lastName} vers "${request.targetGroup.name}" a été accepté, effectif le ${effectiveDate.toLocaleDateString('fr-FR')}.`,
      refType: 'GroupChangeRequest',
      refId: request.id,
      sendEmail: () =>
        this.email.sendGroupChangeAccepted(
          request.originalEnrollment.student.parent.user.email,
          `${request.originalEnrollment.student.firstName} ${request.originalEnrollment.student.lastName}`,
          request.targetGroup.name,
          effectiveDate,
        ),
    });
    return this.annotateOne(updated);
  }

  /** Ch.12.12 : acceptation par le Professeur d'une demande émanant du Parent (`create`). */
  async accept(teacherId: string, id: string, dto: AcceptGroupChangeRequestDto): Promise<GroupChangeViewWithInitiator> {
    const request = await this.loadOwnedByTeacher(teacherId, id);
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }
    if (await this.isTeacherInitiated(request.id)) {
      throw new BadRequestException(
        "Cette proposition émane de vous-même : seul le Parent peut la confirmer ou la décliner (RM-CHG-002/003, Ch.20.3)",
      );
    }

    const effectiveDate = dateOnly(new Date(dto.effectiveDate));
    if (effectiveDate < todayDateOnly()) {
      throw new BadRequestException("Date d'effet antérieure à aujourd'hui (ERR-CHG-009)");
    }

    return this.finalizeAcceptance(request, effectiveDate, teacherId);
  }

  /**
   * RM-CHG-002/003 (Ch.20.3/20.5) : le Parent confirme une proposition émise par le Professeur
   * (`teacherInitiate`) — pendant équivalent d'`accept()`, mais décidé par le Parent, sur la date
   * d'effet déjà fixée par le Professeur à la proposition.
   */
  async confirmTeacherProposal(parentId: string, id: string): Promise<GroupChangeViewWithInitiator> {
    const request = await this.loadOwnedByParent(parentId, id);
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cette proposition a déjà été traitée');
    }
    if (!(await this.isTeacherInitiated(request.id))) {
      throw new BadRequestException("Cette demande n'est pas une proposition du Professeur (RM-CHG-002)");
    }
    if (!request.effectiveDate) {
      throw new BadRequestException("Date d'effet manquante pour cette proposition (incohérence de données)");
    }
    return this.finalizeAcceptance(request, dateOnly(request.effectiveDate), parentId);
  }

  /**
   * RM-CHG-002/003 (Ch.20.3) : le Parent décline une proposition émise par le Professeur — pendant
   * de `reject()`, mais décidé par le Parent ; symétrique de NOT-CHG-009 (le Professeur est informé
   * de la décision du Parent, qu'elle soit positive ou négative).
   */
  async declineTeacherProposal(
    parentId: string,
    id: string,
    dto: RejectGroupChangeRequestDto,
  ): Promise<GroupChangeViewWithInitiator> {
    const request = await this.loadOwnedByParent(parentId, id);
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cette proposition a déjà été traitée');
    }
    if (!(await this.isTeacherInitiated(request.id))) {
      throw new BadRequestException("Cette demande n'est pas une proposition du Professeur (RM-CHG-002)");
    }

    await this.prisma.groupChangeRequest.update({
      where: { id },
      data: { status: 'REJECTED', decidedAt: new Date(), decidedById: parentId, rejectionReason: dto.reason },
    });

    // RM-ACC-019/020 : traçabilité du refus, symétrique de `reject()`.
    await this.prisma.auditLog.create({
      data: {
        userId: parentId,
        action: 'GROUP_CHANGE_PROPOSAL_DECLINED',
        targetType: 'GroupChangeRequest',
        targetId: id,
        oldValues: { status: 'PENDING' },
        newValues: { status: 'REJECTED', reason: dto.reason },
      },
    });

    // NOT-CHG-009 (symétrique) : le Professeur est informé du refus de sa propre proposition.
    await this.notifications.notify({
      recipientUserId: request.targetGroup.teacherId,
      type: 'GROUP_CHANGE_PROPOSAL_DECLINED',
      priority: 'INFORMATION',
      title: 'Proposition de changement de groupe refusée',
      body: `Le Parent de ${request.originalEnrollment.student.firstName} ${request.originalEnrollment.student.lastName} a décliné votre proposition de changement vers "${request.targetGroup.name}".`,
      refType: 'GroupChangeRequest',
      refId: request.id,
    });

    const updated = await this.prisma.groupChangeRequest.findUniqueOrThrow({ where: { id }, include: INCLUDE_VIEW });
    return this.annotateOne(updated);
  }

  /**
   * ERR-CHG-007/010 : le changement reste autorisé même si l'élève est débiteur sur l'ancienne
   * inscription — simple avertissement au Professeur, même seuil que l'alerte de compte débiteur
   * du Ch.15 (`AccountingService.checkBalanceAlerts`).
   */
  private async warnIfDebtor(teacherId: string, request: GroupChangeView): Promise<void> {
    const originAccount = await this.prisma.accountingAccount.findUnique({
      where: { enrollmentId: request.originalEnrollment.id },
    });
    if (!originAccount) return;
    const balance = await this.accounting.computeBalance(originAccount.id);
    if (balance >= 0) return;

    const origin = await this.prisma.enrollment.findUniqueOrThrow({
      where: { id: request.originalEnrollment.id },
      select: {
        customPrice: true,
        group: { select: { publicPrice: true, debtAlertThresholdSessions: true } },
      },
    });
    const rate = Number(origin.customPrice ?? origin.group.publicPrice);
    const threshold = rate * origin.group.debtAlertThresholdSessions;
    const important = -balance > threshold;
    const studentName = `${request.originalEnrollment.student.firstName} ${request.originalEnrollment.student.lastName}`;

    await this.notifications.notify({
      recipientUserId: teacherId,
      type: important ? 'GROUP_CHANGE_DEBT_IMPORTANT' : 'GROUP_CHANGE_DEBT_WARNING',
      priority: important ? 'IMPORTANT' : 'INFORMATION',
      title: 'Changement de groupe : solde débiteur',
      body: `${studentName} change de groupe avec un solde débiteur de ${Math.abs(balance).toFixed(3)} TND sur son ancienne inscription (${
        important ? 'ERR-CHG-010' : 'ERR-CHG-007'
      }).`,
      refType: 'AccountingAccount',
      refId: originAccount.id,
    });
  }

  /**
   * ERR-CHG-011/RM-CHG-018 : GROUPI ne limite pas le nombre de changements par élève, mais plus de
   * 3 changements acceptés sur la même année académique déclenchent une alerte au Professeur.
   */
  private async warnIfFrequentChanges(teacherId: string, request: GroupChangeView): Promise<void> {
    const changeCount = await this.prisma.groupChangeRequest.count({
      where: {
        status: 'ACCEPTED',
        originalEnrollment: {
          studentId: request.originalEnrollment.student.id,
          group: { academicYearId: request.originalEnrollment.group.academicYearId },
        },
      },
    });
    if (changeCount <= 3) return;

    const studentName = `${request.originalEnrollment.student.firstName} ${request.originalEnrollment.student.lastName}`;
    await this.notifications.notify({
      recipientUserId: teacherId,
      type: 'GROUP_CHANGE_FREQUENT_ALERT',
      priority: 'INFORMATION',
      title: 'Changements de groupe fréquents',
      body: `${studentName} a déjà changé de groupe ${changeCount} fois cette année académique (ERR-CHG-011).`,
      refType: 'Student',
      refId: request.originalEnrollment.student.id,
    });
  }

  /** Ch.12.12 : refus par le Professeur d'une demande émanant du Parent (`create`). */
  async reject(teacherId: string, id: string, dto: RejectGroupChangeRequestDto): Promise<GroupChangeViewWithInitiator> {
    const request = await this.loadOwnedByTeacher(teacherId, id);
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }
    if (await this.isTeacherInitiated(request.id)) {
      throw new BadRequestException(
        "Cette proposition émane de vous-même : seul le Parent peut la confirmer ou la décliner (RM-CHG-002/003, Ch.20.3)",
      );
    }
    await this.prisma.groupChangeRequest.update({
      where: { id },
      data: { status: 'REJECTED', decidedAt: new Date(), decidedById: teacherId, rejectionReason: dto.reason },
    });

    // RM-ACC-019/020 : traçabilité du refus — pas de transaction Prisma existante ici (simple mise
    // à jour), donc journalisation best-effort, non bloquante.
    await this.prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'GROUP_CHANGE_REJECTED',
        targetType: 'GroupChangeRequest',
        targetId: id,
        oldValues: { status: 'PENDING' },
        newValues: { status: 'REJECTED', reason: dto.reason },
      },
    });

    // NOT-INS-008
    await this.notifications.notify({
      recipientUserId: request.originalEnrollment.student.parentId,
      type: 'GROUP_CHANGE_REJECTED',
      priority: 'IMPORTANT',
      title: 'Changement de groupe refusé',
      body: `Le changement de groupe de ${request.originalEnrollment.student.firstName} ${request.originalEnrollment.student.lastName} vers "${request.targetGroup.name}" a été refusé.`,
      refType: 'GroupChangeRequest',
      refId: request.id,
      sendEmail: () =>
        this.email.sendGroupChangeRejected(
          request.originalEnrollment.student.parent.user.email,
          `${request.originalEnrollment.student.firstName} ${request.originalEnrollment.student.lastName}`,
          request.targetGroup.name,
        ),
    });
    const updated = await this.prisma.groupChangeRequest.findUniqueOrThrow({ where: { id }, include: INCLUDE_VIEW });
    return this.annotateOne(updated);
  }
}
