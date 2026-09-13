// `sessions.service.ts` (real import of `AccountingService`, used only by `createAdjustment`,
// untouched by this avenant) transitively pulls in `GroupsService`, which currently has unrelated
// pre-existing TS errors from another in-flight chantier (Group.subjectId nullable pour les
// groupes de niveau). A factory mock stops Jest from ever loading/type-checking that real module,
// so this spec — scoped to Ch. E (CA prévisionnel) — isn't blocked by an unrelated chantier.
jest.mock('../sessions/sessions.service', () => ({
  isLockable: jest.fn().mockReturnValue(false),
}));

import { AccountingService } from './accounting.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Unit tests for AccountingService — Avenant 01, Ch. E (CA prévisionnel du tableau de bord
 * Professeur). PrismaService/NotificationsService are all mocked; no real database.
 *
 * Focuses on the three changes introduced by this avenant:
 *  - E.1/E.5  : `currentRevenuePeriods`/`computePeriodRevenueSet` n'exposent plus que
 *               `currentMonth` et `currentAcademicYear` (le "trimestre en cours" est supprimé).
 *  - E.2/RM-DSH-051 : la borne "année" est l'année académique `OPEN` courante, jamais l'année
 *               civile — vérifié à la fois sur `currentAcademicYearBounds` et sur
 *               `computeAggregateIndicators` (`revenueThisYear`).
 *  - RM-CAL-050 : les groupes de niveau (`Group.kind = LEVEL_POOL`) sont exclus du calcul.
 */
function makePrismaMock() {
  return {
    academicYear: {
      findFirst: jest.fn(),
    },
    session: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    accountingAccount: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    accountingEntry: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

describe('AccountingService — Avenant 01 Ch. E (CA prévisionnel)', () => {
  let service: AccountingService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new AccountingService(
      prisma as unknown as PrismaService,
      { notify: jest.fn().mockResolvedValue({}) } as unknown as NotificationsService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------
  // E.2/RM-DSH-051 : currentAcademicYearBounds
  // ---------------------------------------------------------------------
  describe('currentAcademicYearBounds', () => {
    const now = new Date('2026-02-15T00:00:00Z');

    it('returns the OPEN academic year containing today', async () => {
      const containing = {
        startDate: new Date('2025-09-01T00:00:00Z'),
        endDate: new Date('2026-08-31T00:00:00Z'),
      };
      prisma.academicYear.findFirst.mockResolvedValueOnce(containing);

      const bounds = await (service as any).currentAcademicYearBounds(now);

      expect(bounds).toEqual({ start: containing.startDate, end: containing.endDate });
      expect(prisma.academicYear.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.academicYear.findFirst).toHaveBeenCalledWith({
        where: { status: 'OPEN', startDate: { lte: now }, endDate: { gte: now } },
      });
    });

    it('falls back to the most recent OPEN academic year when none contains today', async () => {
      const mostRecentOpen = {
        startDate: new Date('2026-09-01T00:00:00Z'),
        endDate: new Date('2027-08-31T00:00:00Z'),
      };
      prisma.academicYear.findFirst
        .mockResolvedValueOnce(null) // no year contains "now"
        .mockResolvedValueOnce(mostRecentOpen);

      const bounds = await (service as any).currentAcademicYearBounds(now);

      expect(bounds).toEqual({ start: mostRecentOpen.startDate, end: mostRecentOpen.endDate });
      expect(prisma.academicYear.findFirst).toHaveBeenNthCalledWith(2, {
        where: { status: 'OPEN' },
        orderBy: { startDate: 'desc' },
      });
    });

    it('returns null when no OPEN academic year exists at all (no throw)', async () => {
      prisma.academicYear.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      const bounds = await (service as any).currentAcademicYearBounds(now);

      expect(bounds).toBeNull();
    });
  });

  // ---------------------------------------------------------------------
  // E.1/E.5 : currentRevenuePeriods / computePeriodRevenueSet
  // ---------------------------------------------------------------------
  describe('currentRevenuePeriods', () => {
    it('exposes exactly currentMonth and currentAcademicYear (no currentQuarter)', async () => {
      const now = new Date('2026-03-17T12:00:00Z');
      const academicYearBounds = {
        startDate: new Date('2025-09-01T00:00:00Z'),
        endDate: new Date('2026-08-31T00:00:00Z'),
      };
      prisma.academicYear.findFirst.mockResolvedValueOnce(academicYearBounds);

      const periods = await (service as any).currentRevenuePeriods(now);

      expect(Object.keys(periods).sort()).toEqual(['currentAcademicYear', 'currentMonth']);
      expect(periods.currentMonth).toEqual({
        start: new Date(Date.UTC(2026, 2, 1)),
        end: new Date(Date.UTC(2026, 3, 1)),
      });
      expect(periods.currentAcademicYear).toEqual({
        start: academicYearBounds.startDate,
        end: academicYearBounds.endDate,
      });
    });
  });

  describe('computePeriodRevenueSet', () => {
    it('returns { currentMonth, currentAcademicYear } only', async () => {
      prisma.academicYear.findFirst.mockResolvedValue({
        startDate: new Date('2025-09-01T00:00:00Z'),
        endDate: new Date('2026-08-31T00:00:00Z'),
      });

      const result = await (service as any).computePeriodRevenueSet({ teacherId: 't1' });

      expect(Object.keys(result).sort()).toEqual(['currentAcademicYear', 'currentMonth']);
      expect(result.currentMonth).toEqual(
        expect.objectContaining({ forecastRevenue: 0, realizedRevenue: 0, collectedRevenue: 0 }),
      );
      expect(result.currentAcademicYear).toEqual(
        expect.objectContaining({ forecastRevenue: 0, realizedRevenue: 0, collectedRevenue: 0 }),
      );
    });

    it('falls back to a zeroed currentAcademicYear when no OPEN academic year exists at all', async () => {
      prisma.academicYear.findFirst.mockResolvedValue(null);

      const result = await (service as any).computePeriodRevenueSet({ teacherId: 't1' });

      expect(result.currentAcademicYear).toEqual({
        forecastRevenue: 0,
        realizedRevenue: 0,
        collectedRevenue: 0,
      });
    });
  });

  // ---------------------------------------------------------------------
  // RM-CAL-050 : exclusion des groupes de niveau (Group.kind = LEVEL_POOL)
  // ---------------------------------------------------------------------
  describe('RM-CAL-050 — exclusion des groupes de niveau', () => {
    it('computeForecastRevenue filters sessions on group.kind = STANDARD', async () => {
      await (service as any).computeForecastRevenue({ teacherId: 't1' });

      expect(prisma.session.findMany).toHaveBeenCalledTimes(1);
      const args = prisma.session.findMany.mock.calls[0][0];
      expect(args.where.group).toEqual(expect.objectContaining({ kind: 'STANDARD', teacherId: 't1' }));
    });

    it('computeForecastRevenue keeps the kind filter with a period and/or groupId scope', async () => {
      const period = { start: new Date('2026-01-01T00:00:00Z'), end: new Date('2026-02-01T00:00:00Z') };
      await (service as any).computeForecastRevenue({ groupId: 'g1' }, period);

      const args = prisma.session.findMany.mock.calls[0][0];
      expect(args.where.group).toEqual(expect.objectContaining({ kind: 'STANDARD', id: 'g1' }));
      expect(args.where.date).toEqual({ lt: period.end });
    });

    it('loadAccountsForScope filters enrollments on group.kind = STANDARD', async () => {
      await (service as any).loadAccountsForScope({ teacherId: 't1' });

      expect(prisma.accountingAccount.findMany).toHaveBeenCalledTimes(1);
      const args = prisma.accountingAccount.findMany.mock.calls[0][0];
      expect(args.where.enrollment.group).toEqual(expect.objectContaining({ kind: 'STANDARD', teacherId: 't1' }));
    });

    it('loadAccountsForScope keeps the kind filter even when scoped only by groupId', async () => {
      await (service as any).loadAccountsForScope({ groupId: 'g1' });

      const args = prisma.accountingAccount.findMany.mock.calls[0][0];
      expect(args.where.enrollment.groupId).toBe('g1');
      expect(args.where.enrollment.group).toEqual({ kind: 'STANDARD' });
    });
  });

  // ---------------------------------------------------------------------
  // RM-DSH-051 : revenueThisYear = année académique OPEN, jamais l'année civile
  // ---------------------------------------------------------------------
  describe('computeAggregateIndicators — revenueThisYear (RM-DSH-051)', () => {
    it('counts a session dated in a previous calendar year but within the current academic year', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-02-15T00:00:00Z'));

      // Année académique OPEN 2025-2026 : 01/09/2025 -> 31/08/2026. "now" (15/02/2026) et la
      // séance d'octobre 2025 sont dans des années CIVILES différentes, mais dans la MÊME année
      // académique : l'ancienne logique (comparaison de `getUTCFullYear()`) aurait exclu à tort
      // cette séance du CA "année en cours".
      prisma.academicYear.findFirst.mockResolvedValueOnce({
        startDate: new Date('2025-09-01T00:00:00Z'),
        endDate: new Date('2026-08-31T00:00:00Z'),
      });

      const account = {
        id: 'acc-1',
        enrollment: {
          customPrice: null,
          group: { publicPrice: 40, debtAlertThresholdSessions: 4 },
        },
      };
      prisma.accountingAccount.findMany.mockResolvedValueOnce([account]);

      const inYearEntry = {
        id: 'e1',
        accountId: 'acc-1',
        type: 'SESSION',
        direction: 'DEBIT',
        amount: 40,
        effectiveDate: new Date('2025-10-10T00:00:00Z'), // année civile 2025, année académique 2025-2026
        createdAt: new Date('2025-10-10T00:00:00Z'),
        status: 'POSTED',
        sessionId: 's1',
      };
      const beforeYearEntry = {
        id: 'e2',
        accountId: 'acc-1',
        type: 'SESSION',
        direction: 'DEBIT',
        amount: 100,
        effectiveDate: new Date('2024-05-01T00:00:00Z'), // avant le début de l'année académique OPEN
        createdAt: new Date('2024-05-01T00:00:00Z'),
        status: 'POSTED',
        sessionId: 's2',
      };
      prisma.accountingEntry.findMany.mockResolvedValueOnce([inYearEntry, beforeYearEntry]);

      const result = await (service as any).computeAggregateIndicators({ teacherId: 't1' });

      expect(result.revenueThisYear).toBe(40);
      expect(result.invoicedTotal).toBe(140); // les deux séances restent comptées au global
    });

    it('reports revenueThisYear = 0 when no OPEN academic year exists (no throw)', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-02-15T00:00:00Z'));
      prisma.academicYear.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      const account = {
        id: 'acc-1',
        enrollment: { customPrice: null, group: { publicPrice: 40, debtAlertThresholdSessions: 4 } },
      };
      prisma.accountingAccount.findMany.mockResolvedValueOnce([account]);
      prisma.accountingEntry.findMany.mockResolvedValueOnce([
        {
          id: 'e1',
          accountId: 'acc-1',
          type: 'SESSION',
          direction: 'DEBIT',
          amount: 40,
          effectiveDate: new Date('2026-02-01T00:00:00Z'),
          createdAt: new Date('2026-02-01T00:00:00Z'),
          status: 'POSTED',
          sessionId: 's1',
        },
      ]);

      const result = await (service as any).computeAggregateIndicators({ teacherId: 't1' });

      expect(result.revenueThisYear).toBe(0);
    });
  });
});
