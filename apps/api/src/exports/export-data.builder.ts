import { Injectable } from '@nestjs/common';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';
import { ExportTableData } from './renderers';

export interface ExportCriteria {
  groupIds?: string[];
  studentId?: string;
  subjectId?: string;
  schoolLevelId?: string;
  academicYearId?: string;
  dateFrom?: string;
  dateTo?: string;
  period?: 'CURRENT_YEAR' | 'ALL';
}

const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: 'Présent',
  LATE: 'Retard',
  EXCUSED_ABSENT: 'Absent excusé',
  UNEXCUSED_ABSENT: 'Absent non excusé',
  NOT_SET: 'Non renseigné',
};

const INDICATOR_LABELS: Record<string, string> = {
  groupCount: 'Nombre de groupes',
  activeEnrollmentCount: 'Inscriptions actives',
  completedSessionCount: 'Séances réalisées',
  forecastRevenue: "CA prévisionnel (TND)",
  realizedRevenue: 'CA réalisé (TND)',
  collectedRevenue: 'CA encaissé (TND)',
  receivableRevenue: 'CA à recevoir (TND)',
  debtorAccountCount: 'Comptes débiteurs',
  creditorAccountCount: 'Comptes créditeurs',
  averageAccountBalance: 'Solde moyen des comptes (TND)',
  collectionRate: "Taux d'encaissement (%)",
  unpaidRate: "Taux d'impayés (%)",
  totalOutstanding: 'Encours total (TND)',
  oldestDebtDays: 'Plus ancienne dette (j.)',
  paymentsThisMonth: 'Paiements du mois',
  revenueThisMonth: 'CA du mois (TND)',
  revenueThisYear: "CA de l'année (TND)",
  alertAccountCount: 'Comptes en alerte',
  averagePaymentAmount: 'Montant moyen des paiements (TND)',
  averageCollectionDelayDays: "Délai moyen d'encaissement (j.)",
  bestCollectionMonth: 'Meilleur mois',
  worstCollectionMonth: 'Pire mois',
  debtRegularizationRate: 'Taux de régularisation des dettes (%)',
};

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Ch.17.4/17.5/17.11 : construit les lignes brutes de chaque type d'export, avant mise en forme
 * (PDF/Excel/CSV, voir `renderers.ts`). Le périmètre est toujours passé explicitement par
 * l'appelant (`ExportsService`), qui a déjà validé les droits d'accès (RM-EXP-002/003/014) — ce
 * service ne fait plus aucun contrôle d'autorisation, seulement de la lecture scoping.
 */
@Injectable()
export class ExportDataBuilder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
  ) {}

  private dateRange(criteria: ExportCriteria): Prisma.DateTimeFilter | undefined {
    if (!criteria.dateFrom && !criteria.dateTo) return undefined;
    const range: Prisma.DateTimeFilter = {};
    if (criteria.dateFrom) range.gte = new Date(criteria.dateFrom);
    if (criteria.dateTo) range.lte = new Date(criteria.dateTo);
    return range;
  }

  /** RM-EXP-010 : Parent — "année académique en cours ou historique complet". */
  private async resolveParentDateFrom(period: 'CURRENT_YEAR' | 'ALL' | undefined): Promise<Date | undefined> {
    if (period !== 'CURRENT_YEAR') return undefined;
    const year = await this.prisma.academicYear.findFirst({ where: { status: 'OPEN' }, orderBy: { startDate: 'desc' } });
    return year?.startDate;
  }

  // --- Professeur (Ch.17.4) --------------------------------------------------------------------

  /** teacherId `null` = portée globale (Super Admin uniquement, Ch.17.4 dernier §). */
  async buildGroups(teacherId: string | null, criteria: ExportCriteria): Promise<ExportTableData> {
    const groups = await this.prisma.group.findMany({
      where: {
        ...(teacherId ? { teacherId } : {}),
        ...(criteria.groupIds ? { id: { in: criteria.groupIds } } : {}),
        ...(criteria.subjectId ? { subjectId: criteria.subjectId } : {}),
        ...(criteria.schoolLevelId ? { schoolLevelId: criteria.schoolLevelId } : {}),
        ...(criteria.academicYearId ? { academicYearId: criteria.academicYearId } : {}),
      },
      include: {
        subject: true,
        schoolLevel: true,
        academicYear: true,
        teacher: true,
        _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const columns = [
      { key: 'name', label: 'Groupe' },
      { key: 'subject', label: 'Matière' },
      { key: 'level', label: 'Niveau' },
      { key: 'academicYear', label: 'Année académique' },
      { key: 'status', label: 'Statut' },
      { key: 'capacity', label: 'Capacité' },
      { key: 'enrolled', label: 'Inscrits actifs' },
      { key: 'publicPrice', label: 'Tarif public (TND)' },
      { key: 'teachingMode', label: 'Mode' },
      { key: 'startDate', label: 'Date de début' },
      ...(teacherId ? [] : [{ key: 'teacher', label: 'Professeur' }]),
    ];
    const rows = groups.map((g) => ({
      name: g.name,
      subject: g.subject.name,
      level: g.schoolLevel.name,
      academicYear: g.academicYear.label,
      status: g.status,
      capacity: g.capacity,
      enrolled: g._count.enrollments,
      publicPrice: Number(g.publicPrice),
      teachingMode: g.teachingMode === 'PRESENTIAL' ? 'Présentiel' : 'En ligne',
      startDate: dateOnly(g.startDate),
      ...(teacherId ? {} : { teacher: `${g.teacher.firstName} ${g.teacher.lastName}` }),
    }));
    return { columns, rows };
  }

  async buildStudents(teacherId: string | null, criteria: ExportCriteria): Promise<ExportTableData> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        group: {
          ...(teacherId ? { teacherId } : {}),
          ...(criteria.groupIds ? { id: { in: criteria.groupIds } } : {}),
          ...(criteria.subjectId ? { subjectId: criteria.subjectId } : {}),
          ...(criteria.schoolLevelId ? { schoolLevelId: criteria.schoolLevelId } : {}),
        },
        ...(criteria.studentId ? { studentId: criteria.studentId } : {}),
      },
      include: {
        student: { include: { parent: { include: { user: true } } } },
        group: { select: { name: true, subject: { select: { name: true } }, schoolLevel: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const columns = [
      { key: 'student', label: 'Élève' },
      { key: 'group', label: 'Groupe' },
      { key: 'subject', label: 'Matière' },
      { key: 'level', label: 'Niveau' },
      { key: 'status', label: "Statut d'inscription" },
      { key: 'parentEmail', label: 'Email du parent' },
      { key: 'parentPhone', label: 'Téléphone du parent' },
    ];
    const rows = enrollments.map((e) => ({
      student: `${e.student.firstName} ${e.student.lastName}`,
      group: e.group.name,
      subject: e.group.subject.name,
      level: e.group.schoolLevel.name,
      status: e.status,
      parentEmail: e.student.parent.user.email,
      parentPhone: e.student.parent.phone,
    }));
    return { columns, rows };
  }

  async buildAttendance(teacherId: string | null, criteria: ExportCriteria, latenessOnly: boolean): Promise<ExportTableData> {
    const range = this.dateRange(criteria);
    const attendances = await this.prisma.attendance.findMany({
      where: {
        session: {
          ...(range ? { date: range } : {}),
          group: {
            ...(teacherId ? { teacherId } : {}),
            ...(criteria.groupIds ? { id: { in: criteria.groupIds } } : {}),
            ...(criteria.subjectId ? { subjectId: criteria.subjectId } : {}),
            ...(criteria.schoolLevelId ? { schoolLevelId: criteria.schoolLevelId } : {}),
          },
        },
        ...(criteria.studentId ? { studentId: criteria.studentId } : {}),
        ...(latenessOnly ? { status: 'LATE' as const } : { status: { not: 'NOT_SET' } }),
      },
      include: { student: true, session: { include: { group: { select: { name: true } } } } },
      orderBy: { session: { date: 'desc' } },
    });

    const columns = [
      { key: 'student', label: 'Élève' },
      { key: 'group', label: 'Groupe' },
      { key: 'date', label: 'Date de la séance' },
      { key: 'status', label: 'Statut' },
      { key: 'lateDuration', label: 'Retard (min)' },
      { key: 'comment', label: 'Commentaire' },
    ];
    const rows = attendances.map((a) => ({
      student: `${a.student.firstName} ${a.student.lastName}`,
      group: a.session.group.name,
      date: dateOnly(a.session.date),
      status: ATTENDANCE_LABEL[a.status],
      lateDuration: a.lateDuration ?? '',
      comment: a.comment ?? '',
    }));
    return { columns, rows };
  }

  /** 17.4 : commentaires pédagogiques — réservé à l'offre Pro (vérifié par `ExportsService`). */
  async buildPedagogicalComments(teacherId: string | null, criteria: ExportCriteria): Promise<ExportTableData> {
    const comments = await this.prisma.enrollmentComment.findMany({
      where: {
        deletedAt: null,
        enrollment: {
          group: {
            ...(teacherId ? { teacherId } : {}),
            ...(criteria.groupIds ? { id: { in: criteria.groupIds } } : {}),
          },
          ...(criteria.studentId ? { studentId: criteria.studentId } : {}),
        },
      },
      include: { enrollment: { include: { student: true, group: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    const columns = [
      { key: 'student', label: 'Élève' },
      { key: 'group', label: 'Groupe' },
      { key: 'author', label: 'Auteur' },
      { key: 'date', label: 'Date' },
      { key: 'body', label: 'Commentaire' },
    ];
    const rows = comments.map((c) => ({
      student: `${c.enrollment.student.firstName} ${c.enrollment.student.lastName}`,
      group: c.enrollment.group.name,
      author: c.authorRole === 'TEACHER' ? 'Professeur' : 'Parent',
      date: dateOnly(c.createdAt),
      body: c.body,
    }));
    return { columns, rows };
  }

  async buildAccountingAccounts(teacherId: string | null, criteria: ExportCriteria): Promise<ExportTableData> {
    const accounts = await this.prisma.accountingAccount.findMany({
      where: {
        enrollment: {
          group: {
            ...(teacherId ? { teacherId } : {}),
            ...(criteria.groupIds ? { id: { in: criteria.groupIds } } : {}),
          },
          ...(criteria.studentId ? { studentId: criteria.studentId } : {}),
        },
      },
      include: { enrollment: { include: { student: true, group: { select: { name: true } } } } },
    });

    const columns = [
      { key: 'student', label: 'Élève' },
      { key: 'group', label: 'Groupe' },
      { key: 'status', label: 'Statut du compte' },
      { key: 'balance', label: 'Solde (TND)' },
    ];
    const rows = [];
    for (const a of accounts) {
      const balance = await this.accounting.computeBalance(a.id);
      rows.push({
        student: `${a.enrollment.student.firstName} ${a.enrollment.student.lastName}`,
        group: a.enrollment.group.name,
        status: a.status,
        balance,
      });
    }
    return { columns, rows };
  }

  async buildPayments(teacherId: string | null, criteria: ExportCriteria): Promise<ExportTableData> {
    const range = this.dateRange(criteria);
    const entries = await this.prisma.accountingEntry.findMany({
      where: {
        type: 'PAYMENT',
        ...(range ? { effectiveDate: range } : {}),
        account: {
          enrollment: {
            group: {
              ...(teacherId ? { teacherId } : {}),
              ...(criteria.groupIds ? { id: { in: criteria.groupIds } } : {}),
            },
            ...(criteria.studentId ? { studentId: criteria.studentId } : {}),
          },
        },
      },
      include: {
        account: { include: { enrollment: { include: { student: true, group: { select: { name: true } } } } } },
      },
      orderBy: { effectiveDate: 'desc' },
    });

    const columns = [
      { key: 'entryNumber', label: 'N° écriture' },
      { key: 'student', label: 'Élève' },
      { key: 'group', label: 'Groupe' },
      { key: 'date', label: 'Date' },
      { key: 'amount', label: 'Montant (TND)' },
      { key: 'direction', label: 'Sens' },
      { key: 'status', label: 'Statut' },
      { key: 'method', label: 'Moyen de paiement' },
    ];
    const rows = entries.map((e) => ({
      entryNumber: e.entryNumber,
      student: `${e.account.enrollment.student.firstName} ${e.account.enrollment.student.lastName}`,
      group: e.account.enrollment.group.name,
      date: dateOnly(e.effectiveDate),
      amount: Number(e.amount),
      direction: e.direction === 'CREDIT' ? 'Paiement' : 'Annulation/correction',
      status: e.status,
      method: e.paymentMethod ?? '',
    }));
    return { columns, rows };
  }

  /** Ch.17.4 "les statistiques" — indicateurs globaux Professeur (RM-EXP-013 : dès l'offre Intermédiaire). */
  async buildStatistics(teacherId: string): Promise<ExportTableData> {
    const [indicators, groupCount, activeEnrollmentCount, completedSessionCount] = await Promise.all([
      this.accounting.getTeacherIndicators(teacherId),
      this.prisma.group.count({ where: { teacherId } }),
      this.prisma.enrollment.count({ where: { group: { teacherId }, status: 'ACTIVE' } }),
      this.prisma.session.count({ where: { group: { teacherId }, status: { in: ['COMPLETED', 'LOCKED'] } } }),
    ]);
    const flat: Record<string, unknown> = { groupCount, activeEnrollmentCount, completedSessionCount, ...indicators };

    const columns = [
      { key: 'indicator', label: 'Indicateur' },
      { key: 'value', label: 'Valeur' },
    ];
    const rows = Object.entries(flat).map(([key, value]) => ({
      indicator: INDICATOR_LABELS[key] ?? key,
      value: value === null || value === undefined ? '—' : String(value),
    }));
    return { columns, rows };
  }

  /** Ch.17.4 "les indicateurs des tableaux de bord" — un jeu d'indicateurs financiers par groupe. */
  async buildDashboardIndicators(teacherId: string, criteria: ExportCriteria): Promise<ExportTableData> {
    const groups = await this.prisma.group.findMany({
      where: { teacherId, ...(criteria.groupIds ? { id: { in: criteria.groupIds } } : {}) },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const columns = [
      { key: 'group', label: 'Groupe' },
      { key: 'totalInvoiced', label: 'Total facturé (TND)' },
      { key: 'totalCollected', label: 'Total encaissé (TND)' },
      { key: 'remainingToReceive', label: 'Restant à recevoir (TND)' },
      { key: 'debtorAccountCount', label: 'Comptes débiteurs' },
      { key: 'creditorAccountCount', label: 'Comptes créditeurs' },
      { key: 'groupPaymentRate', label: 'Taux de paiement (%)' },
    ];
    const rows = [];
    for (const g of groups) {
      const ind = await this.accounting.getGroupIndicators(teacherId, g.id);
      rows.push({
        group: g.name,
        totalInvoiced: ind.totalInvoiced,
        totalCollected: ind.totalCollected,
        remainingToReceive: ind.remainingToReceive,
        debtorAccountCount: ind.debtorAccountCount,
        creditorAccountCount: ind.creditorAccountCount,
        groupPaymentRate: ind.groupPaymentRate ?? '',
      });
    }
    return { columns, rows };
  }

  // --- Parent (Ch.17.4, PDF uniquement, organisé par enfant) -----------------------------------

  private async parentStudentIds(parentId: string, studentId: string | undefined): Promise<string[]> {
    const students = await this.prisma.student.findMany({
      where: { parentId, ...(studentId ? { id: studentId } : {}) },
      select: { id: true },
    });
    return students.map((s) => s.id);
  }

  async buildParentAttendance(parentId: string, criteria: ExportCriteria): Promise<ExportTableData> {
    const studentIds = await this.parentStudentIds(parentId, criteria.studentId);
    const dateFrom = await this.resolveParentDateFrom(criteria.period);
    const attendances = await this.prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        status: { not: 'NOT_SET' },
        ...(dateFrom ? { session: { date: { gte: dateFrom } } } : {}),
      },
      include: { student: true, session: { include: { group: { select: { name: true } } } } },
      orderBy: [{ student: { firstName: 'asc' } }, { session: { date: 'desc' } }],
    });
    const columns = [
      { key: 'child', label: 'Enfant' },
      { key: 'group', label: 'Groupe' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Statut' },
      { key: 'lateDuration', label: 'Retard (min)' },
    ];
    const rows = attendances.map((a) => ({
      child: `${a.student.firstName} ${a.student.lastName}`,
      group: a.session.group.name,
      date: dateOnly(a.session.date),
      status: ATTENDANCE_LABEL[a.status],
      lateDuration: a.lateDuration ?? '',
    }));
    return { columns, rows };
  }

  async buildParentComments(parentId: string, criteria: ExportCriteria): Promise<ExportTableData> {
    const studentIds = await this.parentStudentIds(parentId, criteria.studentId);
    const dateFrom = await this.resolveParentDateFrom(criteria.period);
    const comments = await this.prisma.enrollmentComment.findMany({
      where: {
        deletedAt: null,
        enrollment: { studentId: { in: studentIds } },
        ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
      },
      include: { enrollment: { include: { student: true, group: { select: { name: true } } } } },
      orderBy: [{ enrollment: { student: { firstName: 'asc' } } }, { createdAt: 'desc' }],
    });
    const columns = [
      { key: 'child', label: 'Enfant' },
      { key: 'group', label: 'Groupe' },
      { key: 'author', label: 'Auteur' },
      { key: 'date', label: 'Date' },
      { key: 'body', label: 'Commentaire' },
    ];
    const rows = comments.map((c) => ({
      child: `${c.enrollment.student.firstName} ${c.enrollment.student.lastName}`,
      group: c.enrollment.group.name,
      author: c.authorRole === 'TEACHER' ? 'Professeur' : 'Parent',
      date: dateOnly(c.createdAt),
      body: c.body,
    }));
    return { columns, rows };
  }

  async buildParentAccounting(parentId: string, criteria: ExportCriteria): Promise<ExportTableData> {
    const studentIds = await this.parentStudentIds(parentId, criteria.studentId);
    const accounts = await this.prisma.accountingAccount.findMany({
      where: { enrollment: { studentId: { in: studentIds } } },
      include: { enrollment: { include: { student: true, group: { select: { name: true } } } } },
      orderBy: { enrollment: { student: { firstName: 'asc' } } },
    });
    const columns = [
      { key: 'child', label: 'Enfant' },
      { key: 'group', label: 'Groupe' },
      { key: 'status', label: 'Statut du compte' },
      { key: 'balance', label: 'Solde (TND)' },
    ];
    const rows = [];
    for (const a of accounts) {
      const balance = await this.accounting.computeBalance(a.id);
      rows.push({
        child: `${a.enrollment.student.firstName} ${a.enrollment.student.lastName}`,
        group: a.enrollment.group.name,
        status: a.status,
        balance,
      });
    }
    return { columns, rows };
  }

  async buildParentPayments(parentId: string, criteria: ExportCriteria): Promise<ExportTableData> {
    const studentIds = await this.parentStudentIds(parentId, criteria.studentId);
    const dateFrom = await this.resolveParentDateFrom(criteria.period);
    const entries = await this.prisma.accountingEntry.findMany({
      where: {
        type: 'PAYMENT',
        account: { enrollment: { studentId: { in: studentIds } } },
        ...(dateFrom ? { effectiveDate: { gte: dateFrom } } : {}),
      },
      include: { account: { include: { enrollment: { include: { student: true, group: { select: { name: true } } } } } } },
      orderBy: [{ account: { enrollment: { student: { firstName: 'asc' } } } }, { effectiveDate: 'desc' }],
    });
    const columns = [
      { key: 'child', label: 'Enfant' },
      { key: 'group', label: 'Groupe' },
      { key: 'date', label: 'Date' },
      { key: 'amount', label: 'Montant (TND)' },
      { key: 'direction', label: 'Sens' },
      { key: 'status', label: 'Statut' },
    ];
    const rows = entries.map((e) => ({
      child: `${e.account.enrollment.student.firstName} ${e.account.enrollment.student.lastName}`,
      group: e.account.enrollment.group.name,
      date: dateOnly(e.effectiveDate),
      amount: Number(e.amount),
      direction: e.direction === 'CREDIT' ? 'Paiement' : 'Annulation/correction',
      status: e.status,
    }));
    return { columns, rows };
  }

  // --- Administrateur (Ch.17.4/RM-EXP-011) ------------------------------------------------------

  /** Statistiques agrégées de la plateforme — aucune donnée nominative individuelle. */
  async buildAdminStatistics(): Promise<ExportTableData> {
    const [
      teacherCount,
      parentCount,
      validatedTeacherCount,
      activeGroupCount,
      activeEnrollmentCount,
      subscriptionsActive,
      totalPaidEntries,
      exportsLast30Days,
    ] = await Promise.all([
      this.prisma.teacherProfile.count(),
      this.prisma.parentProfile.count(),
      this.prisma.teacherProfile.count({ where: { status: 'VALIDATED' } }),
      this.prisma.group.count({ where: { status: { in: ['ACTIVE', 'FULL'] } } }),
      this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.accountingEntry.aggregate({ where: { type: 'PAYMENT', direction: 'CREDIT' }, _sum: { amount: true } }),
      this.prisma.exportAudit.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } } }),
    ]);

    const flat: Record<string, unknown> = {
      teacherCount,
      validatedTeacherCount,
      parentCount,
      activeGroupCount,
      activeEnrollmentCount,
      subscriptionsActive,
      totalPaymentsCollected: Number(totalPaidEntries._sum.amount ?? 0),
      exportsLast30Days,
    };
    const labels: Record<string, string> = {
      teacherCount: 'Professeurs (total)',
      validatedTeacherCount: 'Professeurs validés',
      parentCount: 'Parents (total)',
      activeGroupCount: 'Groupes actifs/complets',
      activeEnrollmentCount: 'Inscriptions actives',
      subscriptionsActive: 'Abonnements actifs',
      totalPaymentsCollected: 'Total des paiements encaissés (TND)',
      exportsLast30Days: 'Exports réalisés (30 derniers jours)',
    };
    const columns = [
      { key: 'indicator', label: 'Indicateur' },
      { key: 'value', label: 'Valeur' },
    ];
    const rows = Object.entries(flat).map(([key, value]) => ({ indicator: labels[key] ?? key, value: String(value) }));
    return { columns, rows };
  }

  // --- Portabilité RGPD (Ch.17.4 dernier §) ------------------------------------------------------

  /**
   * Rassemble les données personnelles de l'utilisateur dans un format aplati "section/champ/valeur"
   * — volontairement générique plutôt qu'un modèle par rôle, pour rester correct quel que soit le
   * rôle sans dupliquer la logique. Reste un sous-ensemble représentatif (profil + éléments
   * pédagogiques/commerciaux propres à l'utilisateur), pas une extraction exhaustive de toutes les
   * tables où son identifiant apparaît (voir progress.md, "Hors scope").
   */
  async buildRgpdPersonalData(userId: string): Promise<ExportTableData> {
    const rows: { section: string; field: string; value: string }[] = [];
    const push = (section: string, field: string, value: unknown) =>
      rows.push({ section, field, value: value === null || value === undefined ? '' : String(value) });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { teacherProfile: true, parentProfile: true },
    });
    push('Compte', 'Email', user.email);
    push('Compte', 'Rôles', user.roles.join(', '));
    push('Compte', 'Statut', user.status);
    push('Compte', 'Créé le', dateOnly(user.createdAt));
    push('Compte', 'Dernière connexion', user.lastLoginAt ? user.lastLoginAt.toISOString() : '');

    if (user.teacherProfile) {
      const t = user.teacherProfile;
      push('Profil Professeur', 'Nom', `${t.firstName} ${t.lastName}`);
      push('Profil Professeur', 'Téléphone', t.phone);
      push('Profil Professeur', 'Ville', t.city);
      const groups = await this.prisma.group.findMany({ where: { teacherId: userId }, select: { name: true } });
      push('Profil Professeur', 'Groupes créés', groups.map((g) => g.name).join(', '));
      const subs = await this.prisma.subscription.findMany({
        where: { teacherId: userId },
        include: { plan: true },
      });
      push(
        'Profil Professeur',
        'Historique des abonnements',
        subs.map((s) => `${s.plan.name} (${s.status})`).join(', '),
      );
    }

    if (user.parentProfile) {
      const p = user.parentProfile;
      push('Profil Parent', 'Nom', `${p.firstName} ${p.lastName}`);
      push('Profil Parent', 'Téléphone', p.phone);
      push('Profil Parent', 'Ville', p.city);
      const students = await this.prisma.student.findMany({ where: { parentId: userId } });
      for (const s of students) {
        push('Enfant', `${s.firstName} ${s.lastName}`, s.status);
      }
      const enrollments = await this.prisma.enrollment.findMany({
        where: { student: { parentId: userId } },
        include: { student: true, group: { select: { name: true } } },
      });
      for (const e of enrollments) {
        push('Inscription', `${e.student.firstName} ${e.student.lastName} — ${e.group.name}`, e.status);
      }
    }

    return {
      columns: [
        { key: 'section', label: 'Catégorie' },
        { key: 'field', label: 'Champ' },
        { key: 'value', label: 'Valeur' },
      ],
      rows,
    };
  }
}
