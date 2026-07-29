import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AccountingService } from '../accounting/accounting.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateGroupChangeRequestDto } from './dto/create-group-change-request.dto';
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

  // --- Vue Parent -------------------------------------------------------------------------

  async listMineForParent(parentId: string): Promise<GroupChangeView[]> {
    const requests = await this.prisma.groupChangeRequest.findMany({
      where: { originalEnrollment: { student: { parentId } } },
      include: INCLUDE_VIEW,
      orderBy: { requestedAt: 'desc' },
    });
    return this.applyManyIfDue(requests);
  }

  /** Ch.12.12 : demande de changement — les vérifications reprennent celles d'une nouvelle inscription (12.12). */
  async create(parentId: string, dto: CreateGroupChangeRequestDto): Promise<GroupChangeView> {
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
    if (original.groupId === dto.targetGroupId) {
      throw new BadRequestException('Le groupe cible est identique au groupe actuel');
    }

    const existingPending = await this.prisma.groupChangeRequest.findFirst({
      where: { originalEnrollmentId: original.id, status: 'PENDING' },
    });
    if (existingPending) {
      throw new BadRequestException(
        'Une demande de changement de groupe est déjà en attente pour cette inscription',
      );
    }

    const targetGroup = await this.prisma.group.findUnique({
      where: { id: dto.targetGroupId },
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

    const existingInTarget = await this.prisma.enrollment.findFirst({
      where: { studentId: original.studentId, groupId: targetGroup.id, status: { in: ['PENDING_VALIDATION', 'ACTIVE'] } },
    });
    if (existingInTarget) {
      throw new BadRequestException('Une inscription existe déjà pour cet élève dans le groupe cible (ERR-INS-002/032)');
    }

    const created = await this.prisma.groupChangeRequest.create({
      data: {
        originalEnrollmentId: original.id,
        targetGroupId: targetGroup.id,
        status: 'PENDING',
        requestedAt: new Date(),
      },
      include: INCLUDE_VIEW,
    });
    return created;
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
  async cancel(parentId: string, id: string): Promise<GroupChangeView> {
    const request = await this.loadOwnedByParent(parentId, id);
    if (request.status === 'PENDING') {
      await this.prisma.groupChangeRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
      return this.prisma.groupChangeRequest.findUniqueOrThrow({ where: { id }, include: INCLUDE_VIEW });
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
      return this.prisma.groupChangeRequest.findUniqueOrThrow({ where: { id }, include: INCLUDE_VIEW });
    }
    throw new BadRequestException('Ce changement a déjà pris effet : annulation hors délai (ERR-CHG-012)');
  }

  // --- Vue Professeur (du groupe cible) ----------------------------------------------------

  async listForTeacherGroup(teacherId: string, groupId: string): Promise<GroupChangeView[]> {
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
    return this.applyManyIfDue(requests);
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
   * Ch.12.12 : l'acceptation vérifie la capacité du groupe cible à cet instant précis (ERR-INS-012)
   * et crée systématiquement une nouvelle inscription indépendante dans le groupe cible. Si la date
   * effective choisie est déjà atteinte (aujourd'hui ou passée), l'ancienne inscription est archivée
   * immédiatement dans la même transaction ; sinon l'archivage est appliqué paresseusement plus tard
   * (`applyIfDue`).
   */
  async accept(teacherId: string, id: string, dto: AcceptGroupChangeRequestDto): Promise<GroupChangeView> {
    const request = await this.loadOwnedByTeacher(teacherId, id);
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    const effectiveDate = dateOnly(new Date(dto.effectiveDate));
    if (effectiveDate < todayDateOnly()) {
      throw new BadRequestException("Date d'effet antérieure à aujourd'hui (ERR-CHG-009)");
    }

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

    await this.subscriptions.assertActiveEnrollmentCapacity(teacherId, 1, 'ERR-INS-013');
    const immediate = effectiveDate <= todayDateOnly();

    await this.prisma.$transaction(async (tx) => {
      const newEnrollment = await tx.enrollment.create({
        data: {
          studentId: request.originalEnrollment.student.id,
          groupId: targetGroup.id,
          status: 'ACTIVE',
          requestedAt: new Date(),
          decidedAt: new Date(),
          decidedById: teacherId,
        },
      });
      // RM-CPT-002 : compte de suivi comptable créé automatiquement à l'activation — ici la
      // nouvelle inscription est immédiatement ACTIVE (Ch.12.12), donc créée dans la même transaction.
      await this.accounting.createAccountForEnrollment(tx, newEnrollment.id, targetGroup.academicYearId);
      if (activeCount + 1 >= targetGroup.capacity) {
        await tx.group.update({ where: { id: targetGroup.id }, data: { status: 'FULL' } });
      }
      await tx.groupChangeRequest.update({
        where: { id: request.id },
        data: {
          status: 'ACCEPTED',
          decidedAt: new Date(),
          decidedById: teacherId,
          effectiveDate,
          newEnrollmentId: newEnrollment.id,
          appliedAt: immediate ? new Date() : null,
        },
      });
      if (immediate) {
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
    });

    const updated = await this.prisma.groupChangeRequest.findUniqueOrThrow({
      where: { id: request.id },
      include: INCLUDE_VIEW,
    });

    await this.warnIfDebtor(teacherId, request);
    await this.warnIfFrequentChanges(teacherId, request);

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
    return updated;
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

  async reject(teacherId: string, id: string, dto: RejectGroupChangeRequestDto): Promise<GroupChangeView> {
    const request = await this.loadOwnedByTeacher(teacherId, id);
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }
    await this.prisma.groupChangeRequest.update({
      where: { id },
      data: { status: 'REJECTED', decidedAt: new Date(), decidedById: teacherId, rejectionReason: dto.reason },
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
    return this.prisma.groupChangeRequest.findUniqueOrThrow({ where: { id }, include: INCLUDE_VIEW });
  }
}
