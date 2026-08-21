import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SuspendSubscriptionDto } from './dto/suspend-subscription.dto';
import { ChangePlanDto } from './dto/change-plan.dto';

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
 * Ch.21 : abonnements Professeur - offres seed, souscription, validation manuelle du paiement,
 * suspension/reactivation par un Admin. Les droits lies a l'offre active (Ch.22) sont geres
 * par `SubscriptionGuard`; les rappels NOT-ABO-001/002/003/004 et RM-CYC-020 passent par
 * `TemporalJobsService`.
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

      // RM-SUB-019 : anti-fraude multi-comptes — bloque aussi le contournement via un AUTRE compte
      // (même Professeur, numéro de téléphone identique) qui a déjà consommé un essai par le passé.
      const teacherProfile = await this.prisma.teacherProfile.findUnique({
        where: { id: teacherId },
        select: { phone: true },
      });
      if (teacherProfile?.phone) {
        const sameNumberOtherAccount = await this.prisma.teacherProfile.findFirst({
          where: {
            id: { not: teacherId },
            phone: teacherProfile.phone,
            subscriptions: { some: { plan: { isTrial: true } } },
          },
          select: { id: true },
        });
        if (sameNumberOtherAccount) {
          throw new BadRequestException(
            "Un autre compte utilisant ce même numéro de téléphone a déjà bénéficié de l'offre Découverte : souscription refusée (ERR-SUB-004/RM-SUB-019)",
          );
        }
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

  /**
   * RM-SUB-012/013 : changement d'offre en cours d'année pour l'abonnement ACTIVE du Professeur sur
   * l'année académique en cours — met à jour la ligne existante (jamais de nouvelle `Subscription` :
   * la contrainte `@@unique([teacherId, academicYearId])` l'interdirait de toute façon, et RM-ABO-004
   * proscrit toute reconduction/duplication implicite). `activatedAt`/`expiresAt` ne changent pas.
   * Montée de gamme toujours autorisée ; descente refusée si la capacité actuelle (inscriptions
   * `ACTIVE`) dépasse la nouvelle limite (RM-SUB-013/ERR-SUB-003). La Découverte n'est jamais une
   * destination de changement, elle n'est accessible qu'à la 1ère souscription (RM-SUB-005).
   */
  async changePlan(teacherId: string, dto: ChangePlanDto): Promise<SubscriptionView> {
    const newPlan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.newPlanId } });
    if (!newPlan) {
      throw new NotFoundException('Offre introuvable');
    }
    if (newPlan.isTrial) {
      throw new BadRequestException(
        "L'offre Découverte n'est accessible qu'à la première souscription, jamais en changement d'offre (ERR-SUB-003/RM-SUB-005)",
      );
    }

    const subs = await this.prisma.subscription.findMany({
      where: { teacherId, status: 'ACTIVE', academicYear: { status: 'OPEN' } },
      include: INCLUDE_VIEW,
    });
    // Expiration paresseuse (RM-ABO-002/RM-SUB-024) avant de choisir l'abonnement à faire évoluer.
    const usable = (await this.expireManyIfDue(subs)).find((s) => s.status === 'ACTIVE');
    if (!usable) {
      throw new ForbiddenException(
        "Aucun abonnement actif pour l'année académique en cours : changement d'offre impossible (ERR-PERM-001)",
      );
    }

    if (usable.planId === newPlan.id) {
      throw new BadRequestException('Cette offre est déjà celle actuellement souscrite');
    }

    const currentMax = usable.plan.maxActiveEnrollments;
    const newMax = newPlan.maxActiveEnrollments;
    const isDowngrade = newMax !== null && (currentMax === null || newMax < currentMax);

    if (isDowngrade) {
      const activeEnrollments = await this.prisma.enrollment.count({
        where: { status: 'ACTIVE', group: { teacherId } },
      });
      if (activeEnrollments > newMax) {
        throw new BadRequestException(
          `Retour vers une offre inférieure refusé : ${activeEnrollments} inscription(s) active(s) dépasse(nt) la capacité de la nouvelle offre "${newPlan.name}" (${newMax}) (ERR-SUB-003/RM-SUB-013)`,
        );
      }
    }

    const oldPlan = usable.plan;
    await this.prisma.subscription.update({ where: { id: usable.id }, data: { planId: newPlan.id } });

    await this.prisma.auditLog.create({
      data: {
        userId: teacherId,
        action: 'SUBSCRIPTION_PLAN_CHANGED',
        targetType: 'Subscription',
        targetId: usable.id,
        oldValues: { planId: oldPlan.id, planCode: oldPlan.code },
        newValues: { planId: newPlan.id, planCode: newPlan.code },
      },
    });

    const updated = await this.loadById(usable.id);
    // Information — pas d'e-mail, RM-NOT-008/009.
    await this.notifications.notify({
      recipientUserId: teacherId,
      type: 'SUBSCRIPTION_PLAN_CHANGED',
      priority: 'INFORMATION',
      title: 'Offre modifiée',
      body: `Votre abonnement est passé de "${oldPlan.name}" à "${newPlan.name}".`,
      refType: 'Subscription',
      refId: usable.id,
    });

    return updated;
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
    const teacherEmail = sub.teacher.user.email;
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
      sendEmail: teacherEmail ? () => this.email.sendSubscriptionSuspended(teacherEmail, sub.plan.name) : undefined,
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
    const teacherEmail = sub.teacher.user.email;
    // NOT-ABO-007 (Important -> e-mail, RM-NOT-008/009)
    await this.notifications.notify({
      recipientUserId: sub.teacherId,
      type: 'SUBSCRIPTION_REACTIVATED',
      priority: 'IMPORTANT',
      title: 'Abonnement réactivé',
      body: `Votre abonnement "${sub.plan.name}" a été réactivé. Vos droits sont rétablis, aucune donnée n’a été perdue.`,
      refType: 'Subscription',
      refId: sub.id,
      sendEmail: teacherEmail ? () => this.email.sendSubscriptionReactivated(teacherEmail, sub.plan.name) : undefined,
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
      include: { plan: true },
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
        if (sub.plan.isTrial) {
          // RM-SUB-020 : contrairement aux offres payantes, la Découverte bascule en lecture seule
          // IMMÉDIATEMENT à `expiresAt` — pas de délai de grâce de 7 jours (celui-ci, RM-PERM-008,
          // ne concerne que Intermédiaire/Pro).
          sawExpiredPastGrace = true;
        } else {
          // RM-PERM-008/ERR-PERM-006 : délai de grâce de 7 jours, modification encore autorisée.
          const graceDeadline = new Date(sub.expiresAt.getTime() + 7 * 86_400_000);
          if (now <= graceDeadline) {
            return;
          }
          sawExpiredPastGrace = true;
        }
      }
      if (status === 'SUSPENDED') {
        sawSuspended = true;
      }
    }

    if (sawSuspended) {
      // RM-SUB-022 : la suspension pour impayé bloque l'écriture IMMÉDIATEMENT, sans délai de grâce
      // (déjà correct ici). La fenêtre de "consultation" de 7 jours mentionnée par RM-SUB-022 ne
      // concerne que la lecture, qui n'est de toute façon jamais coupée dans ce projet (GET toujours
      // autorisé, cf. `SubscriptionGuard`) — il n'existe donc aucune borne à implémenter au-delà de
      // ce qui est déjà en place, et on n'invente pas de mécanisme de coupure de lecture.
      throw new ForbiddenException('Abonnement suspendu : aucune nouvelle opération autorisée (ERR-PERM-003)');
    }
    if (sawExpiredPastGrace) {
      // RM-PERM-004 : le message doit nommer l'offre qui débloquerait l'action plutôt que de rester
      // générique — ici aucune fonctionnalité précise n'est connue de cette méthode (elle est appelée
      // de façon générique par `SubscriptionGuard`/les services métier, sans contexte de fonctionnalité),
      // donc on reste générique mais on nomme explicitement les offres payantes qui débloquent l'accès.
      throw new ForbiddenException(
        "Abonnement expiré (délai de grâce dépassé) : passage en lecture seule. Souscrivez ou renouvelez une offre Intermédiaire ou Pro pour retrouver les droits de modification (ERR-PERM-001/RM-SUB-020/RM-PERM-004)",
      );
    }
    // PENDING_PAYMENT : aucun droit tant que le paiement n'est pas validé.
    throw new ForbiddenException(
      "Abonnement en attente de validation du paiement : aucune opération autorisée (ERR-PERM-001)",
    );
  }

  /**
   * Ch.17.4/22 : variante "lecture" d'`assertCanWrite` — utilisée par l'export (Ch.17), qui est
   * fonctionnellement une lecture mais doit tout de même être bloquée pour l'offre Découverte
   * (RM-EXP-001). Ne lève jamais : renvoie l'offre exploitable (ACTIVE, ou EXPIRED dans son délai
   * de grâce) pour une année académique OPEN, ou `null` si aucune ne l'est — l'appelant décide du
   * message d'erreur adapté à son propre contexte plutôt que de réutiliser celui de l'écriture.
   */
  async getActivePlan(teacherId: string): Promise<SubscriptionPlan | null> {
    const subs = await this.prisma.subscription.findMany({
      where: { teacherId, academicYear: { status: 'OPEN' } },
      include: { plan: true },
    });

    const now = new Date();
    for (const sub of subs) {
      let status = sub.status;
      if (status !== 'EXPIRED' && sub.expiresAt && sub.expiresAt <= now) {
        await this.prisma.subscription.update({ where: { id: sub.id }, data: { status: 'EXPIRED' } });
        status = 'EXPIRED';
      }
      if (status === 'ACTIVE') {
        return sub.plan;
      }
      if (status === 'EXPIRED' && sub.expiresAt && !sub.plan.isTrial) {
        // RM-SUB-020 : la Découverte n'a pas de délai de grâce (cf. `assertCanWrite`) — seules les
        // offres payantes restent exploitables 7 jours après expiration.
        const graceDeadline = new Date(sub.expiresAt.getTime() + 7 * 86_400_000);
        if (now <= graceDeadline) {
          return sub.plan;
        }
      }
    }
    return null;
  }
  async assertActiveEnrollmentCapacity(teacherId: string, additionalSeats: number, errorCode: string): Promise<void> {
    if (additionalSeats <= 0) return;
    const plan = await this.getActivePlan(teacherId);
    if (!plan) {
      throw new ForbiddenException("Aucun abonnement exploitable pour verifier la capacite d'inscription (ERR-PERM-001)");
    }
    if (plan.maxActiveEnrollments === null) return;
    const activeEnrollments = await this.prisma.enrollment.count({
      where: { status: 'ACTIVE', group: { teacherId } },
    });
    if (activeEnrollments + additionalSeats > plan.maxActiveEnrollments) {
      throw new ForbiddenException(
        `Capacite maximale de l'abonnement atteinte (${plan.maxActiveEnrollments} inscription(s) active(s), ${errorCode})`,
      );
    }
  }
}