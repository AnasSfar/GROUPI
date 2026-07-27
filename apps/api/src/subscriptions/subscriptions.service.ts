import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SuspendSubscriptionDto } from './dto/suspend-subscription.dto';

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

const INCLUDE_VIEW = {
  plan: true,
  academicYear: { select: { id: true, label: true, status: true, endDate: true } },
  teacher: { select: { id: true, firstName: true, lastName: true, user: { select: { email: true } } } },
} satisfies Prisma.SubscriptionInclude;

type SubscriptionView = Prisma.SubscriptionGetPayload<{ include: typeof INCLUDE_VIEW }>;

/**
 * Ch.21 : abonnements Professeur — offres seedées (Découverte/Intermédiaire/Pro), souscription,
 * validation manuelle du paiement (espèces, V1), suspension/réactivation par un Admin. Le contrôle
 * des droits liés à l'offre active (Ch.22) et les rappels d'échéance temporels (NOT-ABO-001/002/003,
 * pas de scheduler dans ce projet) sont hors scope — voir progress.md.
 */
@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * RM-ABO-002/RM-SUB-024 : tout abonnement expire à `expiresAt`, quel que soit son statut courant
   * (y compris encore en attente de paiement) — appliqué paresseusement à la lecture, même principe
   * que l'expiration des `Enrollment`/`PreEnrollment`.
   */
  private async expireIfDue(sub: SubscriptionView): Promise<SubscriptionView> {
    if (sub.status === 'EXPIRED') {
      return sub;
    }
    if (!sub.expiresAt || sub.expiresAt > new Date()) {
      return sub;
    }
    await this.prisma.subscription.update({ where: { id: sub.id }, data: { status: 'EXPIRED' } });
    return this.prisma.subscription.findUniqueOrThrow({ where: { id: sub.id }, include: INCLUDE_VIEW });
  }

  private async expireManyIfDue(subs: SubscriptionView[]): Promise<SubscriptionView[]> {
    return Promise.all(subs.map((s) => this.expireIfDue(s)));
  }

  private async loadById(id: string): Promise<SubscriptionView> {
    const sub = await this.prisma.subscription.findUnique({ where: { id }, include: INCLUDE_VIEW });
    if (!sub) {
      throw new NotFoundException('Abonnement introuvable');
    }
    return this.expireIfDue(sub);
  }

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({ orderBy: { price: 'asc' } });
  }

  async listMine(teacherId: string): Promise<SubscriptionView[]> {
    const subs = await this.prisma.subscription.findMany({
      where: { teacherId },
      include: INCLUDE_VIEW,
      orderBy: { requestedAt: 'desc' },
    });
    return this.expireManyIfDue(subs);
  }

  async listAll(status?: SubscriptionStatus): Promise<SubscriptionView[]> {
    const subs = await this.prisma.subscription.findMany({
      where: status ? { status } : undefined,
      include: INCLUDE_VIEW,
      orderBy: { requestedAt: 'desc' },
    });
    return this.expireManyIfDue(subs);
  }

  /** Ch.21.2/21.6 : souscription — la Découverte (gratuite) s'active immédiatement, les offres
   * payantes restent `PENDING_PAYMENT` jusqu'à validation manuelle par un Admin (Ch.21.6). */
  async subscribe(teacherId: string, dto: CreateSubscriptionDto): Promise<SubscriptionView> {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } });
    if (!plan) {
      throw new NotFoundException('Offre introuvable');
    }

    const academicYear = await this.prisma.academicYear.findUnique({ where: { id: dto.academicYearId } });
    if (!academicYear) {
      throw new NotFoundException('Année académique introuvable');
    }
    if (academicYear.status !== 'OPEN') {
      throw new BadRequestException('Année académique déjà clôturée : souscription refusée (ERR-ABO-003)');
    }

    const existing = await this.prisma.subscription.findUnique({
      where: { teacherId_academicYearId: { teacherId, academicYearId: academicYear.id } },
    });
    if (existing) {
      throw new BadRequestException(
        'Un abonnement existe déjà pour cette année académique (ERR-ABO-005/RM-ABO-005)',
      );
    }

    if (plan.isTrial) {
      const trialAlreadyUsed = await this.prisma.subscription.findFirst({
        where: { teacherId, plan: { isTrial: true } },
      });
      if (trialAlreadyUsed) {
        throw new BadRequestException("L'offre Découverte a déjà été utilisée (ERR-SUB-004/RM-SUB-005)");
      }
    }

    const now = new Date();
    const isFree = plan.price === 0;
    const expiresAt = plan.durationDays
      ? new Date(Math.min(addDays(now, plan.durationDays).getTime(), academicYear.endDate.getTime()))
      : academicYear.endDate;

    const created = await this.prisma.subscription.create({
      data: {
        teacherId,
        planId: plan.id,
        academicYearId: academicYear.id,
        status: isFree ? 'ACTIVE' : 'PENDING_PAYMENT',
        requestedAt: now,
        activatedAt: isFree ? now : null,
        expiresAt,
      },
      include: INCLUDE_VIEW,
    });

    if (isFree) {
      // NOT-ABO-005 (Information — pas d'e-mail, RM-NOT-008/009)
      await this.notifications.notify({
        recipientUserId: teacherId,
        type: 'SUBSCRIPTION_ACTIVATED',
        priority: 'INFORMATION',
        title: 'Abonnement activé',
        body: `Votre abonnement "${plan.name}" est actif jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.`,
        refType: 'Subscription',
        refId: created.id,
      });
    }

    return created;
  }

  /** PERM-ABO-005 : validation manuelle du paiement (espèces, V1). */
  async validatePayment(adminId: string, id: string): Promise<SubscriptionView> {
    const sub = await this.loadById(id);
    if (sub.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('Cet abonnement n’est pas en attente de paiement');
    }
    await this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date(),
        paidAt: new Date(),
        paymentMethod: 'CASH',
        validatedById: adminId,
      },
    });
    const updated = await this.loadById(id);
    // NOT-ABO-005 (Information — pas d'e-mail, RM-NOT-008/009)
    await this.notifications.notify({
      recipientUserId: sub.teacherId,
      type: 'SUBSCRIPTION_ACTIVATED',
      priority: 'INFORMATION',
      title: 'Abonnement activé',
      body: `Votre abonnement "${sub.plan.name}" a été validé et est actif jusqu'au ${updated.expiresAt?.toLocaleDateString('fr-FR')}.`,
      refType: 'Subscription',
      refId: sub.id,
    });
    return updated;
  }

  /** PERM-ABO-006/RM-ABO-007 : suspension pour non-paiement ou décision administrative. */
  async suspend(adminId: string, id: string, dto: SuspendSubscriptionDto): Promise<SubscriptionView> {
    const sub = await this.loadById(id);
    if (sub.status !== 'ACTIVE') {
      throw new BadRequestException('Seul un abonnement actif peut être suspendu');
    }
    await this.prisma.subscription.update({
      where: { id },
      data: { status: 'SUSPENDED', suspendedAt: new Date(), suspendedById: adminId, suspensionReason: dto.reason },
    });
    const updated = await this.loadById(id);
    // NOT-ABO-006 (Critique -> e-mail, RM-NOT-008/009)
    await this.notifications.notify({
      recipientUserId: sub.teacherId,
      type: 'SUBSCRIPTION_SUSPENDED',
      priority: 'CRITICAL',
      title: 'Abonnement suspendu',
      body:
        `Votre abonnement "${sub.plan.name}" a été suspendu` +
        (dto.reason ? ` : ${dto.reason}` : '.') +
        ' Contactez l’administration GROUPI pour régulariser votre situation.',
      refType: 'Subscription',
      refId: sub.id,
      sendEmail: () => this.email.sendSubscriptionSuspended(sub.teacher.user.email, sub.plan.name),
    });
    return updated;
  }

  /** PERM-ABO-007/RM-ABO-009 : réactivation après régularisation, aucune donnée perdue. */
  async reactivate(adminId: string, id: string): Promise<SubscriptionView> {
    const sub = await this.loadById(id);
    if (sub.status !== 'SUSPENDED') {
      throw new BadRequestException('Réactivation impossible : cet abonnement n’est pas suspendu (ERR-ABO-004)');
    }
    await this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        reactivatedAt: new Date(),
        suspendedAt: null,
        suspendedById: null,
        suspensionReason: null,
      },
    });
    const updated = await this.loadById(id);
    // NOT-ABO-007 (Important -> e-mail, RM-NOT-008/009)
    await this.notifications.notify({
      recipientUserId: sub.teacherId,
      type: 'SUBSCRIPTION_REACTIVATED',
      priority: 'IMPORTANT',
      title: 'Abonnement réactivé',
      body: `Votre abonnement "${sub.plan.name}" a été réactivé. Vos droits sont rétablis, aucune donnée n’a été perdue.`,
      refType: 'Subscription',
      refId: sub.id,
      sendEmail: () => this.email.sendSubscriptionReactivated(sub.teacher.user.email, sub.plan.name),
    });
    return updated;
  }

  /**
   * Ch.22.2/22.4/22.7 : porte d'entrée unique pour toute opération de création/modification d'un
   * Professeur (appelée par `SubscriptionGuard`, jamais directement par un contrôleur). La
   * consultation n'est jamais concernée (filtrée en amont par le guard, GET toujours autorisé) — de
   * même que les Admins/Super Admin, dont les droits ne dépendent jamais d'un abonnement (RM-PERM-009).
   *
   * "L'année académique en cours" n'est pas unique dans ce projet : `POST /referentials/academic-years`
   * assume explicitement une cohabitation possible de plusieurs années OPEN pendant une période de
   * transition (voir son commentaire). On considère donc le Professeur autorisé dès qu'il dispose
   * d'un abonnement exploitable (actif, ou expiré dans son délai de grâce) pour au moins une année
   * OPEN, plutôt que de deviner laquelle est "la" bonne.
   */
  async assertCanWrite(teacherId: string): Promise<void> {
    const subs = await this.prisma.subscription.findMany({
      where: { teacherId, academicYear: { status: 'OPEN' } },
    });

    if (subs.length === 0) {
      throw new ForbiddenException("Aucun abonnement actif pour l'année académique en cours (ERR-PERM-001)");
    }

    const now = new Date();
    let sawSuspended = false;
    let sawExpiredPastGrace = false;

    for (const sub of subs) {
      let status = sub.status;
      if (status !== 'EXPIRED' && sub.expiresAt && sub.expiresAt <= now) {
        await this.prisma.subscription.update({ where: { id: sub.id }, data: { status: 'EXPIRED' } });
        status = 'EXPIRED';
      }

      if (status === 'ACTIVE') {
        return;
      }
      if (status === 'EXPIRED' && sub.expiresAt) {
        // RM-PERM-008/ERR-PERM-006 : délai de grâce de 7 jours, modification encore autorisée.
        const graceDeadline = new Date(sub.expiresAt.getTime() + 7 * 86_400_000);
        if (now <= graceDeadline) {
          return;
        }
        sawExpiredPastGrace = true;
      }
      if (status === 'SUSPENDED') {
        sawSuspended = true;
      }
    }

    if (sawSuspended) {
      throw new ForbiddenException('Abonnement suspendu : aucune nouvelle opération autorisée (ERR-PERM-003)');
    }
    if (sawExpiredPastGrace) {
      throw new ForbiddenException(
        'Abonnement expiré (délai de grâce dépassé) : passage en lecture seule, souscrivez un nouvel abonnement (ERR-PERM-001/RM-SUB-020)',
      );
    }
    // PENDING_PAYMENT : aucun droit tant que le paiement n'est pas validé.
    throw new ForbiddenException(
      "Abonnement en attente de validation du paiement : aucune opération autorisée (ERR-PERM-001)",
    );
  }
}
