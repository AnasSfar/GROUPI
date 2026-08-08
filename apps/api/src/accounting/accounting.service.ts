import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  AccountingAccount,
  AccountingEntry,
  AccountingEntryDirection,
  AccountingEntryStatus,
  AccountingEntryType,
  AccountingPeriod,
  AdjustmentReason,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { isLockable } from '../sessions/sessions.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { RecordSessionPaymentDto } from './dto/record-session-payment.dto';
import { CorrectPaymentDto } from './dto/correct-payment.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { CreateAdminAdjustmentDto } from './dto/create-admin-adjustment.dto';

type Tx = Prisma.TransactionClient;

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000));
}

const ACCOUNT_INCLUDE = {
  period: true,
  enrollment: {
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          parentId: true,
          parent: { select: { user: { select: { email: true } } } },
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          teacherId: true,
          publicPrice: true,
          debtAlertThresholdSessions: true,
          teacher: { select: { firstName: true, lastName: true } },
          subject: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.AccountingAccountInclude;

type AccountWithRelations = Prisma.AccountingAccountGetPayload<{ include: typeof ACCOUNT_INCLUDE }>;

interface TimelinePoint {
  id: string;
  date: Date;
  balance: number;
}

/**
 * Ch.15 : moteur comptable. Décisions de modélisation — voir le commentaire du schéma Prisma
 * (section "Domaine Comptable") : pas de table `Payment`/`AccountingAdjustment` séparée (ce sont
 * des `AccountingEntry` typées), solde et indicateurs jamais stockés (RM-CPT-031), recalculés ici
 * à la demande à partir des seules écritures POSTED/LOCKED (RM-CPT-037).
 */
@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
  ) {}

  // ---------------------------------------------------------------------------------------------
  // l'expiration des Enrollment / le verrouillage des Session : transition silencieuse lazy).
  // l'expiration des Enrollment / le verrouillage des Session : transition silencieuse lazy).
  // ---------------------------------------------------------------------------------------------

  async getOrCreatePeriod(academicYearId: string, tx: Tx | PrismaService = this.prisma): Promise<AccountingPeriod> {
    const existing = await tx.accountingPeriod.findUnique({ where: { academicYearId } });
    if (existing) return existing;
    const year = await tx.academicYear.findUniqueOrThrow({ where: { id: academicYearId } });
    return tx.accountingPeriod.create({
      data: { academicYearId, openDate: year.startDate, closeDate: year.endDate, status: 'OPEN' },
    });
  }

  /**
   * RM-CPT-020/EVT-CPT-008 : à la fin de l'année académique, la période puis tous ses comptes
   * ACTIVE/CREATED sont verrouillés — appliqué à la lecture, comme le reste des transitions
   * temporelles de ce projet.
   */
  private async ensureAccountCurrent(account: AccountWithRelations): Promise<AccountWithRelations> {
    if (account.period.status !== 'OPEN' || account.period.closeDate.getTime() >= Date.now()) {
      return account;
    }
    const lockedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.accountingPeriod.update({ where: { id: account.period.id }, data: { status: 'LOCKED', lockedAt } }),
      this.prisma.accountingAccount.updateMany({
        where: { periodId: account.period.id, status: { in: ['CREATED', 'ACTIVE'] } },
        data: { status: 'LOCKED', lockedAt },
      }),
      this.prisma.accountingEntry.updateMany({
        where: { periodId: account.period.id, status: 'POSTED' },
        data: { status: 'LOCKED', lockedAt },
      }),
    ]);
    const stillOpenAccount = account.status !== 'CLOSED' && account.status !== 'ARCHIVED';
    return {
      ...account,
      status: stillOpenAccount ? 'LOCKED' : account.status,
      lockedAt: stillOpenAccount ? lockedAt : account.lockedAt,
      period: { ...account.period, status: 'LOCKED', lockedAt },
    };
  }

  /** RM-CPT-038 : compteur atomique par année civile, format ECR-<année>-000001. */
  private async nextEntryNumber(tx: Tx): Promise<string> {
    const year = new Date().getFullYear();
    const rows = await tx.$queryRaw<{ last_value: number }[]>`
      INSERT INTO accounting_entry_sequence (year, last_value) VALUES (${year}, 1)
      ON CONFLICT (year) DO UPDATE SET last_value = accounting_entry_sequence.last_value + 1
      RETURNING last_value
    `;
    return `ECR-${year}-${String(rows[0].last_value).padStart(6, '0')}`;
  }

  // ---------------------------------------------------------------------------------------------
  // Compte de suivi comptable
  // ---------------------------------------------------------------------------------------------

  /** RM-CPT-001/002/003 : créé automatiquement à l'activation d'une inscription. */
  async createAccountForEnrollment(tx: Tx, enrollmentId: string, academicYearId: string): Promise<AccountingAccount> {
    const period = await this.getOrCreatePeriod(academicYearId, tx);
    return tx.accountingAccount.create({
      data: { enrollmentId, periodId: period.id, status: 'CREATED' },
    });
  }

  private async loadAccountForEnrollment(enrollmentId: string): Promise<AccountWithRelations> {
    const account = await this.prisma.accountingAccount.findUnique({
      where: { enrollmentId },
      include: ACCOUNT_INCLUDE,
    });
    if (!account) {
      throw new NotFoundException('Compte de suivi comptable introuvable (ERR-CPT-006)');
    }
    return this.ensureAccountCurrent(account);
  }

  private assertTeacherOwnsAccount(teacherId: string, account: AccountWithRelations): void {
    if (account.enrollment.group.teacherId !== teacherId) {
      throw new ForbiddenException("Ce compte de suivi comptable n'appartient pas à votre compte");
    }
  }

  private assertParentOwnsAccount(parentId: string, account: AccountWithRelations): void {
    if (account.enrollment.student.parentId !== parentId) {
      throw new ForbiddenException("Ce compte de suivi comptable n'appartient pas à votre compte (RM-CPT-013)");
    }
  }

  private toAccountView(account: AccountWithRelations) {
    return {
      id: account.id,
      enrollmentId: account.enrollmentId,
      status: account.status,
      periodId: account.periodId,
      student: {
        id: account.enrollment.student.id,
        firstName: account.enrollment.student.firstName,
        lastName: account.enrollment.student.lastName,
      },
      group: {
        id: account.enrollment.group.id,
        name: account.enrollment.group.name,
        teacher: account.enrollment.group.teacher,
        subject: account.enrollment.group.subject,
      },
      rate: Number(account.enrollment.customPrice ?? account.enrollment.group.publicPrice),
    };
  }

  private toEntryView(entry: AccountingEntry) {
    return {
      id: entry.id,
      entryNumber: entry.entryNumber,
      type: entry.type,
      direction: entry.direction,
      status: entry.status,
      amount: Number(entry.amount),
      effectiveDate: entry.effectiveDate,
      sessionId: entry.sessionId,
      reason: entry.reason,
      reasonNote: entry.reasonNote,
      paymentMethod: entry.paymentMethod,
      reversesEntryId: entry.reversesEntryId,
      authorId: entry.authorId,
      createdAt: entry.createdAt,
    };
  }

  /**
   * Ch.15.11 : vue Professeur (ownership groupe) ou Parent (ownership élève) — même contenu, la
   * distinction ne porte que sur le contrôle d'accès (RM-CPT-013 pour le Parent). `allowSuperAdminRead`
   * suit le même principe que `EnrollmentConversationsService` (audit/support, jamais d'écriture).
   */
  async getAccountDetail(
    actorId: string,
    role: 'TEACHER' | 'PARENT' | 'SUPER_ADMIN',
    enrollmentId: string,
  ) {
    const account = await this.loadAccountForEnrollment(enrollmentId);
    if (role === 'TEACHER') this.assertTeacherOwnsAccount(actorId, account);
    else if (role === 'PARENT') this.assertParentOwnsAccount(actorId, account);

    const entries = await this.prisma.accountingEntry.findMany({
      where: { accountId: account.id },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
    });
    const indicators = await this.computeAccountIndicators(account);
    return {
      account: this.toAccountView(account),
      entries: entries.map((e) => this.toEntryView(e)),
      indicators,
    };
  }

  // ---------------------------------------------------------------------------------------------
  // Écritures — cœur du moteur (RM-CPT-004 à 040)
  // ---------------------------------------------------------------------------------------------

  /**
   * Point d'entrée unique de création d'écriture. RM-CPT-005/028 : jamais de modification/suppression
   * d'une écriture existante, toute correction passe par une nouvelle écriture (voir `correctPayment`).
   */
  private async postEntry(
    tx: Tx,
    params: {
      account: AccountWithRelations;
      type: AccountingEntryType;
      direction: AccountingEntryDirection;
      amount: number;
      effectiveDate: Date;
      authorId: string;
      sessionId?: string;
      reason?: AdjustmentReason;
      reasonNote?: string;
      paymentMethod?: string;
      reversesEntryId?: string;
    },
  ): Promise<AccountingEntry> {
    if (!(params.amount > 0)) {
      throw new BadRequestException('Montant invalide : doit être strictement positif (ERR-CPT-001)');
    }
    if (params.account.status === 'CLOSED' || params.account.status === 'ARCHIVED') {
      throw new BadRequestException('Compte clôturé ou archivé : écriture refusée (ERR-CPT-002)');
    }
    if (params.account.status === 'LOCKED' && params.type !== 'ADMIN_ADJUSTMENT') {
      throw new BadRequestException(
        'Compte verrouillé : seul un ajustement administratif est autorisé (ERR-CPT-003/008)',
      );
    }

    const entryNumber = await this.nextEntryNumber(tx);
    const entry = await tx.accountingEntry.create({
      data: {
        entryNumber,
        accountId: params.account.id,
        periodId: params.account.periodId,
        type: params.type,
        direction: params.direction,
        amount: params.amount,
        effectiveDate: params.effectiveDate,
        authorId: params.authorId,
        sessionId: params.sessionId,
        reason: params.reason,
        reasonNote: params.reasonNote,
        paymentMethod: params.paymentMethod,
        reversesEntryId: params.reversesEntryId,
      },
    });

    if (params.account.status === 'CREATED') {
      await tx.accountingAccount.update({ where: { id: params.account.id }, data: { status: 'ACTIVE' } });
    }
    return entry;
  }

  private signedAmount(e: { direction: AccountingEntryDirection; amount: Prisma.Decimal | number }): number {
    const amount = Number(e.amount);
    return e.direction === 'CREDIT' ? amount : -amount;
  }

  /**
   * RM-CPT-037 : indicateurs calculés exclusivement à partir des écritures validées — c'est-à-dire
   * tout sauf un brouillon (`CREATED`, qui n'existe pas en pratique dans ce chantier : chaque
   * écriture est postée directement). Une écriture `REVERSED` reste comptée ici : elle représente
   * un fait comptable réel qui a eu lieu, neutralisé par sa propre écriture inverse (elle aussi
   * incluse) — l'exclure en plus de compter la contrepartie annulerait l'opération deux fois.
   */
  private aggregatable<T extends { status: AccountingEntryStatus }>(entries: T[]): T[] {
    return entries.filter((e) => e.status !== 'CREATED');
  }

  async computeBalance(accountId: string): Promise<number> {
    const entries = await this.prisma.accountingEntry.findMany({
      where: { accountId },
      select: { direction: true, amount: true, status: true },
    });
    return round3(this.aggregatable(entries).reduce((sum, e) => sum + this.signedAmount(e), 0));
  }

  /**
   * NOT-CPT-003/006/EVT-CPT-012/013 : notifie uniquement au franchissement exact du seuil (comme
   * l'alerte d'abandon du Ch.14), pas à chaque nouvelle écriture qui laisse le compte dans le même état.
   *
   * `referenceEntryId` est l'écriture qui vient d'être postée : le franchissement est évalué à SA
   * position chronologique (date d'effet) dans le relevé, jamais en comparant simplement les deux
   * dernières lignes du tableau. Sans ça, une écriture SESSION facturée après coup pour une séance
   * passée (donc antérieure en date d'effet à un paiement déjà enregistré "aujourd'hui") se
   * retrouverait insérée au milieu du relevé une fois trié, et la comparaison "queue du tableau"
   * comparerait deux soldes qui n'ont jamais réellement fait suite l'un à l'autre — détecté en
   * testant ce scénario avec des données de démonstration (séances anciennes facturées après un
   * paiement du jour), qui déclenchait une fausse alerte en double.
   */
  private async checkBalanceAlerts(account: AccountWithRelations, referenceEntryId: string): Promise<void> {
    const entries = await this.prisma.accountingEntry.findMany({
      where: { accountId: account.id },
      orderBy: [{ effectiveDate: 'asc' }, { createdAt: 'asc' }],
    });
    const points = this.buildTimeline(this.aggregatable(entries));
    const idx = points.findIndex((p) => p.id === referenceEntryId);
    if (idx === -1) return; // écriture non agrégée (ne devrait pas arriver ici)

    const rate = Number(account.enrollment.customPrice ?? account.enrollment.group.publicPrice);
    const threshold = rate * account.enrollment.group.debtAlertThresholdSessions;
    const current = points[idx].balance;
    const previous = idx > 0 ? points[idx - 1].balance : 0;

    const wasDebtor = -previous >= threshold;
    const isDebtor = -current >= threshold;
    const wasCreditor = previous >= threshold;
    const isCreditor = current >= threshold;

    const studentName = `${account.enrollment.student.firstName} ${account.enrollment.student.lastName}`;

    if (isDebtor && !wasDebtor) {
      await this.notifications.notify({
        recipientUserId: account.enrollment.student.parentId,
        type: 'CPT_DEBT_ALERT',
        priority: 'IMPORTANT',
        title: 'Solde débiteur important',
        body: `Le compte de ${studentName} (groupe "${account.enrollment.group.name}") présente un solde débiteur de ${Math.abs(current).toFixed(3)} TND.`,
        refType: 'AccountingAccount',
        refId: account.id,
      });
      await this.notifications.notify({
        recipientUserId: account.enrollment.group.teacherId,
        type: 'CPT_DEBT_ALERT',
        priority: 'IMPORTANT',
        title: 'Solde débiteur important',
        body: `Le compte de ${studentName} (groupe "${account.enrollment.group.name}") présente un solde débiteur de ${Math.abs(current).toFixed(3)} TND.`,
        refType: 'AccountingAccount',
        refId: account.id,
      });
    }
    if (isCreditor && !wasCreditor) {
      await this.notifications.notify({
        recipientUserId: account.enrollment.student.parentId,
        type: 'CPT_CREDIT_ALERT',
        priority: 'INFORMATION',
        title: 'Solde créditeur important',
        body: `Le compte de ${studentName} (groupe "${account.enrollment.group.name}") présente une avance de ${current.toFixed(3)} TND.`,
        refType: 'AccountingAccount',
        refId: account.id,
      });
    }
  }

  // --- Paiements (Professeur, PERM-CPT-001/002) -----------------------------------------------

  async recordPayment(teacherId: string, enrollmentId: string, dto: RecordPaymentDto) {
    const account = await this.loadAccountForEnrollment(enrollmentId);
    this.assertTeacherOwnsAccount(teacherId, account);
    if (account.enrollment.status !== 'ACTIVE') {
      throw new BadRequestException('Inscription non active : paiement refusé (ERR-CPT-009)');
    }

    if (dto.sessionId) {
      const session = await this.prisma.session.findUnique({ where: { id: dto.sessionId } });
      if (!session || session.groupId !== account.enrollment.groupId) {
        throw new BadRequestException('Seance introuvable pour cette inscription');
      }
      const existing = await this.prisma.accountingEntry.findFirst({
        where: {
          accountId: account.id,
          sessionId: dto.sessionId,
          type: 'PAYMENT',
          direction: 'CREDIT',
          status: 'POSTED',
        },
      });
      if (existing) {
        throw new BadRequestException('Un paiement est deja enregistre pour cette seance');
      }
    }

    const effectiveDate = dto.effectiveDate ? new Date(dto.effectiveDate) : new Date();
    const entry = await this.prisma.$transaction((tx) =>
      this.postEntry(tx, {
        account,
        type: 'PAYMENT',
        direction: 'CREDIT',
        amount: dto.amount,
        effectiveDate,
        authorId: teacherId,
        sessionId: dto.sessionId,
        paymentMethod: dto.paymentMethod,
      }),
    );

    await this.notifications.notify({
      recipientUserId: account.enrollment.student.parentId,
      type: 'CPT_PAYMENT_RECORDED',
      priority: 'INFORMATION',
      title: 'Paiement enregistré',
      body: `Un paiement de ${dto.amount.toFixed(3)} TND a été enregistré pour ${account.enrollment.student.firstName} ${account.enrollment.student.lastName} (groupe "${account.enrollment.group.name}").`,
      refType: 'AccountingEntry',
      refId: entry.id,
    });
    await this.checkBalanceAlerts(account, entry.id);

    return this.toEntryView(entry);
  }

  // --- Vue Professeur "séance par séance" — miroir de AttendanceService.list/setOne (Ch.14) -----

  private async loadOwnedSession(teacherId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { group: { select: { id: true, teacherId: true, publicPrice: true } } },
    });
    if (!session) {
      throw new NotFoundException('Séance introuvable');
    }
    if (session.group.teacherId !== teacherId) {
      throw new ForbiddenException("Cette séance n'appartient pas à votre compte");
    }
    return session;
  }

  /**
   * Ch.16 : un paiement, comme une présence, se saisit séance par séance — cette vue liste les
   * inscriptions ACTIVE du groupe de la séance avec, pour chacune, si la séance a été facturée
   * (écriture SESSION postée, donc présence validée et facturable) et si elle est déjà réglée.
   */
  async listSessionPayments(teacherId: string, sessionId: string) {
    const session = await this.loadOwnedSession(teacherId, sessionId);

    const [enrollments, sessionEntries, paymentEntries] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { groupId: session.groupId, status: 'ACTIVE' },
        include: { student: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { student: { lastName: 'asc' } },
      }),
      this.prisma.accountingEntry.findMany({
        where: { sessionId, type: 'SESSION', status: { not: 'CREATED' } },
        include: { account: { select: { enrollmentId: true } } },
      }),
      this.prisma.accountingEntry.findMany({
        where: { sessionId, type: 'PAYMENT', direction: 'CREDIT', status: 'POSTED' },
        include: { account: { select: { enrollmentId: true } } },
      }),
    ]);

    const invoicedByEnrollment = new Map(sessionEntries.map((e) => [e.account.enrollmentId, e]));
    const paymentByEnrollment = new Map(paymentEntries.map((e) => [e.account.enrollmentId, e]));

    return {
      session: {
        id: session.id,
        groupId: session.groupId,
        date: session.date,
        startTime: session.startTime,
        status: session.status,
      },
      entries: enrollments.map((e) => {
        const invoiced = invoicedByEnrollment.get(e.id);
        const payment = paymentByEnrollment.get(e.id);
        return {
          enrollmentId: e.id,
          student: e.student,
          rate: Number(e.customPrice ?? session.group.publicPrice),
          invoiced: !!invoiced,
          invoicedAmount: invoiced ? Number(invoiced.amount) : null,
          payment: payment
            ? {
                entryId: payment.id,
                amount: Number(payment.amount),
                paymentMethod: payment.paymentMethod,
                effectiveDate: payment.effectiveDate,
              }
            : null,
        };
      }),
    };
  }

  /** Résout l'inscription à partir de l'élève et de la séance, puis délègue à `recordPayment`. */
  async recordSessionPayment(
    teacherId: string,
    sessionId: string,
    studentId: string,
    dto: RecordSessionPaymentDto,
  ) {
    const session = await this.loadOwnedSession(teacherId, sessionId);
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { groupId: session.groupId, studentId, status: 'ACTIVE' },
    });
    if (!enrollment) {
      throw new BadRequestException('Élève non inscrit activement à ce groupe (ERR-CPT-009)');
    }
    return this.recordPayment(teacherId, enrollment.id, { ...dto, sessionId });
  }

  private async loadReversibleOwnPayment(
    account: AccountWithRelations,
    entryId: string,
  ): Promise<AccountingEntry> {
    const original = await this.prisma.accountingEntry.findUnique({ where: { id: entryId } });
    if (!original || original.accountId !== account.id) {
      throw new NotFoundException('Écriture introuvable');
    }
    if (original.type !== 'PAYMENT') {
      throw new BadRequestException('Seul un paiement peut être corrigé ou annulé (PERM-CPT-002)');
    }
    if (original.status !== 'POSTED') {
      throw new BadRequestException('Écriture verrouillée ou déjà annulée : opération refusée (ERR-CPT-003/008)');
    }
    if (account.status === 'LOCKED' || account.status === 'CLOSED' || account.status === 'ARCHIVED') {
      throw new BadRequestException('Compte verrouillé, clôturé ou archivé : modification refusée (ERR-CPT-003)');
    }
    return original;
  }

  /** PERM-CPT-002 : correction — écriture inverse + nouvelle écriture (RM-CPT-029), jamais de modification en place. */
  async correctPayment(teacherId: string, enrollmentId: string, entryId: string, dto: CorrectPaymentDto) {
    const account = await this.loadAccountForEnrollment(enrollmentId);
    this.assertTeacherOwnsAccount(teacherId, account);
    const original = await this.loadReversibleOwnPayment(account, entryId);

    const effectiveDate = new Date();
    const corrected = await this.prisma.$transaction(async (tx) => {
      await this.postEntry(tx, {
        account,
        type: 'PAYMENT',
        direction: original.direction === 'CREDIT' ? 'DEBIT' : 'CREDIT',
        amount: Number(original.amount),
        effectiveDate,
        authorId: teacherId,
        sessionId: original.sessionId ?? undefined,
        reversesEntryId: original.id,
        reasonNote: `Correction de l'écriture ${original.entryNumber}`,
      });
      await tx.accountingEntry.update({ where: { id: original.id }, data: { status: 'REVERSED' } });
      return this.postEntry(tx, {
        account,
        type: 'PAYMENT',
        direction: 'CREDIT',
        amount: dto.amount,
        effectiveDate,
        authorId: teacherId,
        sessionId: original.sessionId ?? undefined,
        paymentMethod: original.paymentMethod ?? undefined,
        reasonNote: dto.reasonNote,
      });
    });

    // NOT-CPT-002/008
    await this.notifications.notify({
      recipientUserId: account.enrollment.student.parentId,
      type: 'CPT_PAYMENT_MODIFIED',
      priority: 'IMPORTANT',
      title: 'Paiement modifié',
      body: `Le paiement ${original.entryNumber} a été corrigé (nouveau montant : ${dto.amount.toFixed(3)} TND) pour ${account.enrollment.student.firstName} ${account.enrollment.student.lastName}.`,
      refType: 'AccountingEntry',
      refId: corrected.id,
    });
    await this.checkBalanceAlerts(account, corrected.id);

    return this.toEntryView(corrected);
  }

  /** RM-CPT-029 : "suppression" logique d'un paiement — toujours une écriture inverse, jamais une suppression réelle. */
  async cancelPayment(teacherId: string, enrollmentId: string, entryId: string) {
    const account = await this.loadAccountForEnrollment(enrollmentId);
    this.assertTeacherOwnsAccount(teacherId, account);
    const original = await this.loadReversibleOwnPayment(account, entryId);

    const reversal = await this.prisma.$transaction(async (tx) => {
      const rev = await this.postEntry(tx, {
        account,
        type: 'PAYMENT',
        direction: original.direction === 'CREDIT' ? 'DEBIT' : 'CREDIT',
        amount: Number(original.amount),
        effectiveDate: new Date(),
        authorId: teacherId,
        sessionId: original.sessionId ?? undefined,
        reversesEntryId: original.id,
        reasonNote: `Annulation de l'écriture ${original.entryNumber}`,
      });
      await tx.accountingEntry.update({ where: { id: original.id }, data: { status: 'REVERSED' } });
      return rev;
    });

    // NOT-CPT-013
    await this.notifications.notify({
      recipientUserId: account.enrollment.student.parentId,
      type: 'CPT_PAYMENT_CANCELLED',
      priority: 'IMPORTANT',
      title: 'Paiement annulé',
      body: `Le paiement ${original.entryNumber} (${Number(original.amount).toFixed(3)} TND) a été annulé pour ${account.enrollment.student.firstName} ${account.enrollment.student.lastName}.`,
      refType: 'AccountingEntry',
      refId: reversal.id,
    });
    await this.checkBalanceAlerts(account, reversal.id);

    return this.toEntryView(reversal);
  }

  /** PERM-ABO/NOT-CPT-007 : variante manuelle, le rappel automatique quotidien passe par `TemporalJobsService`. */
  async sendPaymentReminder(teacherId: string, enrollmentId: string) {
    const account = await this.loadAccountForEnrollment(enrollmentId);
    this.assertTeacherOwnsAccount(teacherId, account);
    const balance = await this.computeBalance(account.id);
    if (balance >= 0) {
      throw new BadRequestException('Ce compte ne présente aucune dette à rappeler');
    }

    await this.notifications.notify({
      recipientUserId: account.enrollment.student.parentId,
      type: 'CPT_PAYMENT_REMINDER',
      priority: 'IMPORTANT',
      title: 'Rappel de paiement',
      body: `Solde débiteur de ${Math.abs(balance).toFixed(3)} TND pour ${account.enrollment.student.firstName} ${account.enrollment.student.lastName} (groupe "${account.enrollment.group.name}").`,
      refType: 'AccountingAccount',
      refId: account.id,
      sendEmail: () =>
        this.email.sendPaymentReminder(
          account.enrollment.student.parent.user.email,
          `${account.enrollment.student.firstName} ${account.enrollment.student.lastName}`,
          Math.abs(balance),
        ),
    });
    return { sent: true, balance };
  }

  // --- Ajustements -----------------------------------------------------------------------------

  /** PERM-CPT-006 : ajustement Professeur, dans la fenêtre de 48h suivant la séance (ERR-CPT-004). */
  async createAdjustment(teacherId: string, enrollmentId: string, dto: CreateAdjustmentDto) {
    const account = await this.loadAccountForEnrollment(enrollmentId);
    this.assertTeacherOwnsAccount(teacherId, account);
    if (account.status === 'LOCKED' || account.status === 'CLOSED' || account.status === 'ARCHIVED') {
      throw new BadRequestException(
        'Compte verrouillé : un ajustement administratif est nécessaire (ERR-CPT-003/004)',
      );
    }

    const session = await this.prisma.session.findUnique({ where: { id: dto.sessionId } });
    if (!session || session.groupId !== account.enrollment.groupId) {
      throw new BadRequestException("Séance introuvable pour cette inscription");
    }
    if (session.status !== 'COMPLETED' && session.status !== 'LOCKED') {
      throw new BadRequestException('Séance non encore validée : ajustement impossible');
    }
    if (isLockable(session)) {
      throw new BadRequestException('Ajustement hors délai de 48h : un ajustement administratif est nécessaire (ERR-CPT-004)');
    }

    const entry = await this.prisma.$transaction((tx) =>
      this.postEntry(tx, {
        account,
        type: 'ADJUSTMENT',
        direction: dto.direction,
        amount: dto.amount,
        effectiveDate: new Date(),
        authorId: teacherId,
        sessionId: dto.sessionId,
        reason: dto.reason,
        reasonNote: dto.reasonNote,
      }),
    );

    // NOT-CPT-004
    await this.notifications.notify({
      recipientUserId: account.enrollment.student.parentId,
      type: 'CPT_ADJUSTMENT_CREATED',
      priority: 'IMPORTANT',
      title: 'Ajustement comptable effectué',
      body: `Un ajustement de ${dto.amount.toFixed(3)} TND a été effectué sur le compte de ${account.enrollment.student.firstName} ${account.enrollment.student.lastName} (groupe "${account.enrollment.group.name}").`,
      refType: 'AccountingEntry',
      refId: entry.id,
    });
    await this.checkBalanceAlerts(account, entry.id);

    return this.toEntryView(entry);
  }

  /** RM-CPT-020 : ajustement administratif — hors délai des 48h, ou sur un compte verrouillé. */
  async createAdminAdjustment(adminId: string, enrollmentId: string, dto: CreateAdminAdjustmentDto) {
    const account = await this.loadAccountForEnrollment(enrollmentId);
    if (dto.sessionId) {
      const session = await this.prisma.session.findUnique({ where: { id: dto.sessionId } });
      if (!session || session.groupId !== account.enrollment.groupId) {
        throw new BadRequestException("Séance introuvable pour cette inscription");
      }
    }

    const entry = await this.prisma.$transaction((tx) =>
      this.postEntry(tx, {
        account,
        type: 'ADMIN_ADJUSTMENT',
        direction: dto.direction,
        amount: dto.amount,
        effectiveDate: new Date(),
        authorId: adminId,
        sessionId: dto.sessionId,
        reason: dto.reason,
        reasonNote: dto.reasonNote,
      }),
    );

    // NOT-CPT-011 (Critique)
    await this.notifications.notify({
      recipientUserId: account.enrollment.student.parentId,
      type: 'CPT_ADMIN_ADJUSTMENT',
      priority: 'CRITICAL',
      title: 'Ajustement comptable administratif',
      body: `Un Administrateur a effectué un ajustement de ${dto.amount.toFixed(3)} TND sur le compte de ${account.enrollment.student.firstName} ${account.enrollment.student.lastName} (groupe "${account.enrollment.group.name}").`,
      refType: 'AccountingEntry',
      refId: entry.id,
    });
    await this.checkBalanceAlerts(account, entry.id);

    return this.toEntryView(entry);
  }

  // --- Facturation des séances (déclenché par AttendanceService.validate, RM-CPT-009/040) -------

  /**
   * Ch.15.9 : une écriture SESSION n'est générée qu'après validation définitive des présences, pour
   * chaque présence facturable (`isBillable`, déjà calculé par `AttendanceService`). Le montant est
   * le tarif appliqué à l'inscription (`customPrice` sinon `Group.publicPrice`).
   */
  async billValidatedSession(
    session: { id: string; groupId: string; date: Date },
    billableAttendances: { enrollmentId: string; studentId: string }[],
  ): Promise<void> {
    for (const attendance of billableAttendances) {
      try {
        const account = await this.prisma.accountingAccount.findUnique({
          where: { enrollmentId: attendance.enrollmentId },
          include: ACCOUNT_INCLUDE,
        });
        if (!account) continue; // compte pas encore créé (ne devrait pas arriver pour une inscription ACTIVE)
        const current = await this.ensureAccountCurrent(account);
        if (current.status === 'CLOSED' || current.status === 'ARCHIVED') continue;

        const rate = Number(current.enrollment.customPrice ?? current.enrollment.group.publicPrice);
        const entry = await this.prisma.$transaction((tx) =>
          this.postEntry(tx, {
            account: current,
            type: 'SESSION',
            direction: 'DEBIT',
            amount: rate,
            effectiveDate: session.date,
            authorId: current.enrollment.group.teacherId,
            sessionId: session.id,
          }),
        );

        // NOT-CPT-005 : information, pas d'e-mail.
        await this.notifications.notify({
          recipientUserId: current.enrollment.student.parentId,
          type: 'CPT_SESSION_BILLED',
          priority: 'INFORMATION',
          title: 'Nouvelle séance facturée',
          body: `Une séance du ${session.date.toLocaleDateString('fr-FR')} a été facturée ${rate.toFixed(3)} TND pour ${current.enrollment.student.firstName} ${current.enrollment.student.lastName}.`,
          refType: 'AccountingEntry',
          refId: entry.id,
        });
        await this.checkBalanceAlerts(current, entry.id);
      } catch (err) {
        // Ch.24 (RM générale) : un incident de facturation ne doit jamais faire échouer la
        // validation des présences déjà actée — journalisé pour investigation, comme les échecs
        // d'envoi d'e-mail dans EmailService.
        this.logger.error(
          `Échec de facturation de la séance ${session.id} pour l'inscription ${attendance.enrollmentId} : ${(err as Error).message}`,
        );
      }
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Indicateurs financiers (Ch.15.12) — jamais stockés (RM-CPT-031), recalculés à la demande.
  // ---------------------------------------------------------------------------------------------

  private buildTimeline(entries: { id: string; effectiveDate: Date; createdAt: Date; direction: AccountingEntryDirection; amount: Prisma.Decimal | number }[]): TimelinePoint[] {
    const sorted = [...entries].sort(
      (a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime() || a.createdAt.getTime() - b.createdAt.getTime(),
    );
    let balance = 0;
    return sorted.map((e) => {
      balance += this.signedAmount(e);
      return { id: e.id, date: e.effectiveDate, balance };
    });
  }

  private timeWeightedStats(points: TimelinePoint[], now: Date) {
    let creditorDays = 0;
    let debtorDays = 0;
    let weightedSum = 0;
    let totalDays = 0;
    let highestCredit = 0;
    let highestDebt = 0;
    for (let i = 0; i < points.length; i++) {
      const start = points[i].date;
      const end = i + 1 < points.length ? points[i + 1].date : now;
      const days = daysBetween(start, end);
      if (points[i].balance > 0) creditorDays += days;
      else if (points[i].balance < 0) debtorDays += days;
      weightedSum += points[i].balance * days;
      totalDays += days;
      if (points[i].balance > highestCredit) highestCredit = points[i].balance;
      if (points[i].balance < highestDebt) highestDebt = points[i].balance;
    }
    const average = totalDays > 0 ? weightedSum / totalDays : (points.at(-1)?.balance ?? 0);
    return { creditorDays, debtorDays, average, highestCredit, highestDebt: Math.abs(highestDebt) };
  }

  /** Ancienneté de la dette courante : jours depuis le début de la séquence débitrice en cours. */
  private currentDebtAge(points: TimelinePoint[], now: Date): number {
    if (points.length === 0) return 0;
    const last = points.at(-1)!;
    if (last.balance >= 0) return 0;
    let idx = points.length - 1;
    while (idx > 0 && points[idx - 1].balance < 0) idx--;
    return daysBetween(points[idx].date, now);
  }

  /** Ch.15.12.1 : indicateurs du compte de suivi comptable (~23 indicateurs). */
  async computeAccountIndicators(account: AccountWithRelations) {
    const now = new Date();
    const allEntries = await this.prisma.accountingEntry.findMany({
      where: { accountId: account.id },
      orderBy: [{ effectiveDate: 'asc' }, { createdAt: 'asc' }],
    });
    const posted = this.aggregatable(allEntries);
    const payments = posted.filter((e) => e.type === 'PAYMENT');
    const receivedPayments = payments.filter((e) => e.direction === 'CREDIT');
    const sessions = posted.filter((e) => e.type === 'SESSION');
    const adjustments = posted.filter((e) => e.type === 'ADJUSTMENT' || e.type === 'ADMIN_ADJUSTMENT');
    const cancelledPayments = allEntries.filter((e) => e.type === 'PAYMENT' && e.status === 'REVERSED');

    const balance = posted.reduce((sum, e) => sum + this.signedAmount(e), 0);
    const paidTotal = payments.reduce((sum, e) => sum + this.signedAmount(e), 0);
    const invoicedTotal = sessions.reduce((sum, e) => sum + Number(e.amount), 0);
    const remainingToPay = balance < 0 ? Math.max(0, invoicedTotal - paidTotal) : 0;

    const lastPayment = [...receivedPayments].sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())[0];
    const lastMovement = [...allEntries].filter((e) => e.status !== 'CREATED').sort(
      (a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime(),
    )[0];
    const lastAdjustment = adjustments.at(-1);

    const points = this.buildTimeline(posted);
    const stats = this.timeWeightedStats(points, now);
    const debtAge = this.currentDebtAge(points, now);

    const totalDiscounts = adjustments
      .filter((e) => e.reason === 'EXCEPTIONAL_DISCOUNT' && e.direction === 'CREDIT')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const remindersSent = await this.prisma.activity.count({
      where: { refType: 'AccountingAccount', refId: account.id, type: 'CPT_PAYMENT_REMINDER' },
    });

    return {
      currentBalance: round3(balance),
      paidAmount: round3(paidTotal),
      invoicedAmount: round3(invoicedTotal),
      remainingToPay: round3(remainingToPay),
      paymentCount: receivedPayments.length,
      averagePaidAmount: receivedPayments.length > 0 ? round3(paidTotal / receivedPayments.length) : 0,
      averageInvoicedAmount: sessions.length > 0 ? round3(invoicedTotal / sessions.length) : 0,
      billedSessionCount: sessions.length,
      lastPaymentAmount: lastPayment ? round3(Number(lastPayment.amount)) : null,
      lastPaymentDate: lastPayment?.effectiveDate ?? null,
      daysSinceLastPayment: lastPayment ? daysBetween(lastPayment.effectiveDate, now) : null,
      debtAgeDays: debtAge,
      averageBalance: round3(stats.average),
      balanceHistory: points.map((p) => ({ date: p.date, balance: round3(p.balance) })),
      creditorDays: stats.creditorDays,
      debtorDays: stats.debtorDays,
      highestCredit: round3(stats.highestCredit),
      highestDebt: round3(stats.highestDebt),
      adjustmentCount: adjustments.length,
      lastAdjustment: lastAdjustment
        ? {
            date: lastAdjustment.effectiveDate,
            amount: round3(Number(lastAdjustment.amount)),
            direction: lastAdjustment.direction,
            type: lastAdjustment.type,
          }
        : null,
      totalAdjustmentAmount: round3(adjustments.reduce((sum, e) => sum + Number(e.amount), 0)),
      totalDiscountsGranted: round3(totalDiscounts),
      paymentRemindersSent: remindersSent,
      daysSinceLastMovement: lastMovement ? daysBetween(lastMovement.effectiveDate, now) : null,
      cancelledPaymentCount: cancelledPayments.length,
      paymentRate: invoicedTotal > 0 ? round3((paidTotal / invoicedTotal) * 100) : null,
    };
  }

  /**
   * Apparie chronologiquement chaque séance facturée avec le paiement suivant (FIFO simple) pour
   * approximer un délai d'encaissement — le référentiel ne décrit aucun rattachement paiement <->
   * facturation (les paiements sont globaux au compte, RM-CPT-018), cette heuristique est donc une
   * simplification assumée plutôt qu'une reconstitution exacte d'un lettrage comptable.
   */
  private collectionDelays(
    sessions: { effectiveDate: Date }[],
    payments: { effectiveDate: Date }[],
  ): number[] {
    const sortedSessions = [...sessions].sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime());
    const sortedPayments = [...payments].sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime());
    const delays: number[] = [];
    let pIdx = 0;
    for (const s of sortedSessions) {
      while (pIdx < sortedPayments.length && sortedPayments[pIdx].effectiveDate < s.effectiveDate) pIdx++;
      if (pIdx < sortedPayments.length) {
        delays.push(daysBetween(s.effectiveDate, sortedPayments[pIdx].effectiveDate));
        pIdx++;
      }
    }
    return delays;
  }

  /** RM-CPT-014 : séances PLANNED futures × tarif appliqué, pour les inscriptions ACTIVE du groupe. */
  private async computeForecastRevenue(scope: { teacherId?: string; groupId?: string }): Promise<number> {
    const sessions = await this.prisma.session.findMany({
      where: {
        status: 'PLANNED',
        date: { gte: new Date() },
        group: {
          ...(scope.teacherId ? { teacherId: scope.teacherId } : {}),
          ...(scope.groupId ? { id: scope.groupId } : {}),
        },
      },
      select: {
        group: {
          select: {
            publicPrice: true,
            enrollments: { where: { status: 'ACTIVE' }, select: { customPrice: true } },
          },
        },
      },
    });
    let total = 0;
    for (const s of sessions) {
      for (const e of s.group.enrollments) {
        total += Number(e.customPrice ?? s.group.publicPrice);
      }
    }
    return total;
  }

  private async loadAccountsForScope(scope: { teacherId?: string; groupId?: string }) {
    return this.prisma.accountingAccount.findMany({
      where: {
        enrollment: {
          ...(scope.groupId ? { groupId: scope.groupId } : {}),
          group: scope.teacherId ? { teacherId: scope.teacherId } : undefined,
        },
      },
      include: { enrollment: { include: { group: true } } },
    });
  }

  /** Ch.15.12.2/15.12.3 : agrégats communs professeur/groupe — la seule différence est le périmètre des comptes. */
  private async computeAggregateIndicators(scope: { teacherId?: string; groupId?: string }) {
    const now = new Date();
    const accounts = await this.loadAccountsForScope(scope);
    const accountIds = accounts.map((a) => a.id);
    const entries =
      accountIds.length > 0
        ? await this.prisma.accountingEntry.findMany({ where: { accountId: { in: accountIds } } })
        : [];
    const byAccount = new Map<string, typeof entries>();
    for (const e of entries) {
      const list = byAccount.get(e.accountId) ?? [];
      list.push(e);
      byAccount.set(e.accountId, list);
    }

    let invoicedTotal = 0;
    let paidTotal = 0;
    let debtorCount = 0;
    let creditorCount = 0;
    let balanceSum = 0;
    let invoicedThisMonth = 0;
    let invoicedThisYear = 0;
    let paymentsThisMonth = 0;
    let regularizedDebtors = 0;
    let everDebtorCount = 0;
    const debtAmounts: number[] = [];
    const creditAmounts: number[] = [];
    const debtAges: number[] = [];
    const allCollectionDelays: number[] = [];
    const monthlyPayments = new Map<string, number>();
    const monthKeyOf = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const nowMonthKey = monthKeyOf(now);
    let alertCount = 0;
    let paymentCount = 0;
    const billedSessionIds = new Set<string>();

    for (const account of accounts) {
      const list = byAccount.get(account.id) ?? [];
      const posted = this.aggregatable(list);
      const sessions = posted.filter((e) => e.type === 'SESSION');
      const payments = posted.filter((e) => e.type === 'PAYMENT');
      const receivedPayments = payments.filter((e) => e.direction === 'CREDIT');

      const balance = posted.reduce((sum, e) => sum + this.signedAmount(e), 0);
      balanceSum += balance;
      if (balance < 0) {
        debtorCount++;
        debtAmounts.push(-balance);
      }
      if (balance > 0) {
        creditorCount++;
        creditAmounts.push(balance);
      }

      const accountInvoiced = sessions.reduce((sum, e) => sum + Number(e.amount), 0);
      const accountPaid = payments.reduce((sum, e) => sum + this.signedAmount(e), 0);
      invoicedTotal += accountInvoiced;
      paidTotal += accountPaid;
      paymentCount += receivedPayments.length;

      for (const s of sessions) {
        if (s.effectiveDate.getUTCFullYear() === now.getUTCFullYear()) invoicedThisYear += Number(s.amount);
        if (monthKeyOf(s.effectiveDate) === nowMonthKey) invoicedThisMonth += Number(s.amount);
        if (s.sessionId) billedSessionIds.add(s.sessionId);
      }
      for (const p of receivedPayments) {
        if (monthKeyOf(p.effectiveDate) === nowMonthKey) paymentsThisMonth++;
        const key = monthKeyOf(p.effectiveDate);
        monthlyPayments.set(key, (monthlyPayments.get(key) ?? 0) + Number(p.amount));
      }

      const rate = Number(account.enrollment.customPrice ?? account.enrollment.group.publicPrice);
      const threshold = rate * account.enrollment.group.debtAlertThresholdSessions;
      if (balance < 0 && -balance > threshold) alertCount++;

      const points = this.buildTimeline(posted);
      const age = this.currentDebtAge(points, now);
      if (age > 0) debtAges.push(age);
      const everDebtor = points.some((p) => p.balance < 0);
      if (everDebtor) {
        everDebtorCount++;
        if (balance >= 0) regularizedDebtors++;
      }

      allCollectionDelays.push(...this.collectionDelays(sessions, receivedPayments));
    }

    const accountCount = accounts.length;
    const receivable = invoicedTotal - paidTotal;
    const collectionRate = invoicedTotal > 0 ? (paidTotal / invoicedTotal) * 100 : null;
    const unpaidRate = invoicedTotal > 0 ? (Math.max(0, receivable) / invoicedTotal) * 100 : null;
    const debtorRate = accountCount > 0 ? (debtorCount / accountCount) * 100 : null;
    const creditorRate = accountCount > 0 ? (creditorCount / accountCount) * 100 : null;
    const averageDelay =
      allCollectionDelays.length > 0
        ? allCollectionDelays.reduce((a, b) => a + b, 0) / allCollectionDelays.length
        : null;

    let bestMonth: string | null = null;
    let bestAmount = -Infinity;
    let worstMonth: string | null = null;
    let worstAmount = Infinity;
    for (const [key, total] of monthlyPayments) {
      if (total > bestAmount) {
        bestAmount = total;
        bestMonth = key;
      }
      if (total < worstAmount) {
        worstAmount = total;
        worstMonth = key;
      }
    }

    return {
      invoicedTotal: round3(invoicedTotal),
      paidTotal: round3(paidTotal),
      receivable: round3(Math.max(0, receivable)),
      accountCount,
      paymentCount,
      billedSessionCount: billedSessionIds.size,
      debtorAccountCount: debtorCount,
      creditorAccountCount: creditorCount,
      averageAccountBalance: accountCount > 0 ? round3(balanceSum / accountCount) : 0,
      collectionRate: collectionRate !== null ? round3(collectionRate) : null,
      unpaidRate: unpaidRate !== null ? round3(unpaidRate) : null,
      debtorRate: debtorRate !== null ? round3(debtorRate) : null,
      creditorRate: creditorRate !== null ? round3(creditorRate) : null,
      averageDebt: debtAmounts.length > 0 ? round3(debtAmounts.reduce((a, b) => a + b, 0) / debtAmounts.length) : 0,
      averageCredit: creditAmounts.length > 0 ? round3(creditAmounts.reduce((a, b) => a + b, 0) / creditAmounts.length) : 0,
      totalDebt: round3(debtAmounts.reduce((a, b) => a + b, 0)),
      totalCredit: round3(creditAmounts.reduce((a, b) => a + b, 0)),
      averageOutstandingPerEnrollment: accountCount > 0 ? round3(Math.max(0, receivable) / accountCount) : 0,
      averagePaymentPerEnrollment: accountCount > 0 ? round3(paidTotal / accountCount) : 0,
      averageInvoicedPerEnrollment: accountCount > 0 ? round3(invoicedTotal / accountCount) : 0,
      alertAccountCount: alertCount,
      oldestDebtDays: debtAges.length > 0 ? Math.max(...debtAges) : 0,
      averageDebtAgeDays: debtAges.length > 0 ? round3(debtAges.reduce((a, b) => a + b, 0) / debtAges.length) : 0,
      paymentsThisMonth,
      revenueThisMonth: round3(invoicedThisMonth),
      revenueThisYear: round3(invoicedThisYear),
      averageCollectionDelayDays: averageDelay !== null ? round3(averageDelay) : null,
      bestCollectionMonth: bestMonth,
      worstCollectionMonth: worstMonth,
      /** Proportion des comptes ayant déjà été débiteurs et actuellement régularisés (solde = 0). */
      debtRegularizationRate: everDebtorCount > 0 ? round3((regularizedDebtors / everDebtorCount) * 100) : null,
    };
  }

  /**
   * Ch.15.12.2 : indicateurs Professeur. `Nombre de comptes en risque élevé`/`Retard moyen de
   * paiement` sont des doublons littéraux de `Nombre de comptes en alerte`/`Délai moyen
   * d'encaissement` dans le référentiel (même définition) — réutilisés tels quels plutôt que
   * recalculés deux fois (même traitement que les doublons NOT-CPT-006/010 côté notifications).
   */
  async getTeacherIndicators(teacherId: string) {
    const [aggregate, forecastRevenue] = await Promise.all([
      this.computeAggregateIndicators({ teacherId }),
      this.computeForecastRevenue({ teacherId }),
    ]);
    return {
      forecastRevenue: round3(forecastRevenue),
      realizedRevenue: aggregate.invoicedTotal,
      collectedRevenue: aggregate.paidTotal,
      receivableRevenue: aggregate.receivable,
      debtorAccountCount: aggregate.debtorAccountCount,
      creditorAccountCount: aggregate.creditorAccountCount,
      averageAccountBalance: aggregate.averageAccountBalance,
      averageLatePaymentDays: aggregate.averageCollectionDelayDays,
      collectionRate: aggregate.collectionRate,
      unpaidRate: aggregate.unpaidRate,
      totalOutstanding: aggregate.receivable,
      oldestDebtDays: aggregate.oldestDebtDays,
      paymentsThisMonth: aggregate.paymentsThisMonth,
      revenueThisMonth: aggregate.revenueThisMonth,
      revenueThisYear: aggregate.revenueThisYear,
      alertAccountCount: aggregate.alertAccountCount,
      averageOutstandingPerEnrollment: aggregate.averageOutstandingPerEnrollment,
      highRiskAccountCount: aggregate.alertAccountCount,
      averagePaymentAmount: aggregate.paymentCount > 0 ? round3(aggregate.paidTotal / aggregate.paymentCount) : 0,
      averageCollectionDelayDays: aggregate.averageCollectionDelayDays,
      bestCollectionMonth: aggregate.bestCollectionMonth,
      worstCollectionMonth: aggregate.worstCollectionMonth,
      debtRegularizationRate: aggregate.debtRegularizationRate,
      globalPaymentRate: aggregate.collectionRate,
    };
  }

  /** Ch.15.12.3 : indicateurs du groupe — même remarque sur les doublons littéraux du référentiel. */
  async getGroupIndicators(teacherId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Groupe introuvable');
    if (group.teacherId !== teacherId) {
      throw new ForbiddenException("Ce groupe n'appartient pas à votre compte");
    }
    const aggregate = await this.computeAggregateIndicators({ groupId });
    return {
      billedSessionCount: aggregate.billedSessionCount,
      totalInvoiced: aggregate.invoicedTotal,
      totalCollected: aggregate.paidTotal,
      remainingToReceive: aggregate.receivable,
      debtorAccountCount: aggregate.debtorAccountCount,
      creditorAccountCount: aggregate.creditorAccountCount,
      averageEnrollmentBalance: aggregate.averageAccountBalance,
      averageLatePaymentDays: aggregate.averageCollectionDelayDays,
      groupPaymentRate: aggregate.collectionRate,
      averageDebtPerEnrollment: aggregate.averageDebt,
      averageCreditPerEnrollment: aggregate.averageCredit,
      totalDebt: aggregate.totalDebt,
      totalCredit: aggregate.totalCredit,
      groupCollectionRate: aggregate.collectionRate,
      debtorRate: aggregate.debtorRate,
      creditorRate: aggregate.creditorRate,
      averageOutstandingPerEnrollment: aggregate.averageOutstandingPerEnrollment,
      averagePaymentPerEnrollment: aggregate.averagePaymentPerEnrollment,
      averageInvoicedPerEnrollment: aggregate.averageInvoicedPerEnrollment,
      alertAccountCount: aggregate.alertAccountCount,
      averageDebtAgeDays: aggregate.averageDebtAgeDays,
    };
  }

  /** Vue Professeur "Paiements" : une ligne par compte eleve, avec statut paye / a payer / avance. */
  async listTeacherAccounts(teacherId: string, groupId?: string) {
    if (groupId) {
      const group = await this.prisma.group.findUnique({ where: { id: groupId } });
      if (!group) throw new NotFoundException('Groupe introuvable');
      if (group.teacherId !== teacherId) {
        throw new ForbiddenException("Ce groupe n'appartient pas a votre compte");
      }
    }

    const accounts = await this.prisma.accountingAccount.findMany({
      where: {
        enrollment: {
          ...(groupId ? { groupId } : {}),
          group: { teacherId },
        },
      },
      include: ACCOUNT_INCLUDE,
      orderBy: [{ enrollment: { group: { name: 'asc' } } }, { enrollment: { student: { lastName: 'asc' } } }],
    });

    return Promise.all(
      accounts.map(async (raw) => {
        const account = await this.ensureAccountCurrent(raw);
        const indicators = await this.computeAccountIndicators(account);
        const currentBalance = indicators.currentBalance;
        return {
          account: this.toAccountView(account),
          currentBalance,
          paidAmount: indicators.paidAmount,
          invoicedAmount: indicators.invoicedAmount,
          remainingToPay: indicators.remainingToPay,
          paymentCount: indicators.paymentCount,
          lastPaymentAmount: indicators.lastPaymentAmount,
          lastPaymentDate: indicators.lastPaymentDate,
          paymentRate: indicators.paymentRate,
          status: currentBalance < 0 ? 'TO_PAY' : currentBalance > 0 ? 'CREDIT' : 'PAID',
        };
      }),
    );
  }
  /**
   * Ch.16.3 "Paiements" : comptes en solde négatif (Parents en retard de paiement), triés du plus
   * débiteur au moins débiteur. Réutilise `computeBalance`/`ACCOUNT_INCLUDE` plutôt que de
   * recalculer un solde — voir la remarque du chantier Ch.16 dans progress.md.
   */
  async listDebtorAccounts(teacherId: string, limit = 20) {
    const accounts = await this.prisma.accountingAccount.findMany({
      where: { enrollment: { group: { teacherId } } },
      include: ACCOUNT_INCLUDE,
    });
    const withBalance = await Promise.all(
      accounts.map(async (a) => {
        const balance = await this.computeBalance(a.id);
        const rate = Number(a.enrollment.customPrice ?? a.enrollment.group.publicPrice);
        // RM-CPT-022 : même seuil que l'alerte de compte débiteur du Ch.15.
        const threshold = rate * a.enrollment.group.debtAlertThresholdSessions;
        return { account: this.toAccountView(a), balance, alert: balance < 0 && -balance > threshold };
      }),
    );
    return withBalance
      .filter((a) => a.balance < 0)
      .sort((a, b) => a.balance - b.balance)
      .slice(0, limit);
  }

  /** Ch.16.3 "Paiements" : derniers paiements enregistrés (écritures PAYMENT créditrices). */
  async listRecentPayments(teacherId: string, limit = 10) {
    const entries = await this.prisma.accountingEntry.findMany({
      where: {
        type: 'PAYMENT',
        direction: 'CREDIT',
        status: { not: 'CREATED' },
        account: { enrollment: { group: { teacherId } } },
      },
      include: { account: { include: ACCOUNT_INCLUDE } },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    return entries.map((e) => ({
      ...this.toEntryView(e),
      account: this.toAccountView(e.account),
    }));
  }

  // --- Vue Parent (Ch.15.11) ---------------------------------------------------------------------

  /** Résumé par enfant : groupes suivis, professeur, matière, tarif, solde actuel. */
  async getParentChildSummary(parentId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student || student.parentId !== parentId) {
      throw new ForbiddenException("Cet élève n'appartient pas à votre compte");
    }

    const accounts = await this.prisma.accountingAccount.findMany({
      where: { enrollment: { studentId } },
      include: ACCOUNT_INCLUDE,
    });

    return Promise.all(
      accounts.map(async (raw) => {
        const account = await this.ensureAccountCurrent(raw);
        const balance = await this.computeBalance(account.id);
        return { ...this.toAccountView(account), currentBalance: balance };
      }),
    );
  }
}
