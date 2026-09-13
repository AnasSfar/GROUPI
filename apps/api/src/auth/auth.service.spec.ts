import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TeacherProfileService } from '../teacher-profile/teacher-profile.service';

/**
 * Unit tests for AuthService. PrismaService, JwtService, PasswordService and SmsService are
 * all mocked — no real database or crypto work happens here (Argon2 hashing is expensive and is
 * exercised for real in the e2e suite instead).
 */

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function makePrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    teacherProfile: {
      create: jest.fn(),
    },
    parentProfile: {
      create: jest.fn(),
    },
    subject: {
      findMany: jest.fn(),
    },
    schoolLevel: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    school: {
      findUnique: jest.fn(),
    },
    academicYear: {
      findFirst: jest.fn(),
    },
    teacherSubject: {
      createMany: jest.fn(),
    },
    teacherSchoolLevel: {
      createMany: jest.fn(),
    },
    student: {
      create: jest.fn(),
      update: jest.fn(),
    },
    studentSchoolSituation: {
      create: jest.fn(),
    },
    emailVerificationToken: {
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    phoneVerificationToken: {
      updateMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    levelPoolMembership: {
      findFirst: jest.fn(),
    },
    enrollment: {
      findFirst: jest.fn(),
    },
    loginHistory: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    userDevice: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let jwt: { signAsync: jest.Mock };
  let config: { get: jest.Mock; getOrThrow: jest.Mock };
  let password: { hash: jest.Mock; verify: jest.Mock };
  let sms: { sendPhoneVerification: jest.Mock; sendAccountLocked: jest.Mock; sendPasswordResetSms: jest.Mock };
  let notifications: { notify: jest.Mock };
  let teacherProfile: { assertSubjectLevelSelectionValid: jest.Mock };

  const configDefaults: Record<string, unknown> = {
    LOGIN_MAX_ATTEMPTS: 5,
    LOGIN_LOCKOUT_MINUTES: 15,
    SESSION_INACTIVITY_MINUTES: 30,
    PASSWORD_RESET_TTL_MINUTES: 15,
  };

  beforeEach(() => {
    prisma = makePrismaMock();
    // Default $transaction behavior: support both the array-of-promises form and the
    // callback form used by `register`.
    prisma.$transaction.mockImplementation(async (arg: any) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg(prisma);
    });

    jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    config = {
      get: jest.fn((key: string, fallback?: unknown) => configDefaults[key] ?? fallback),
      getOrThrow: jest.fn((key: string) => configDefaults[key]),
    };
    password = { hash: jest.fn(), verify: jest.fn() };
    sms = {
      sendPhoneVerification: jest.fn().mockResolvedValue(undefined),
      sendAccountLocked: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetSms: jest.fn().mockResolvedValue(undefined),
    };
    notifications = { notify: jest.fn().mockResolvedValue({}) };
    teacherProfile = { assertSubjectLevelSelectionValid: jest.fn().mockResolvedValue(undefined) };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      password as unknown as PasswordService,
      sms as unknown as SmsService,
      notifications as unknown as NotificationsService,
      teacherProfile as unknown as TeacherProfileService,
    );
  });

  const meta = { ipAddress: '127.0.0.1', userAgent: 'jest' };

  // ---------------------------------------------------------------------
  // register
  // ---------------------------------------------------------------------
  describe('register', () => {
    it('creates a User + TeacherProfile (self-registration is Teacher-only, Avenant 01 Ch. A.2/D.2)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      password.hash.mockResolvedValue('hashed-pw');
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        phone: '20000000',
        status: 'PENDING_VALIDATION',
      });
      prisma.teacherProfile.create.mockResolvedValue({ id: 'user-1' });
      prisma.subject.findMany.mockResolvedValue([{ id: 'subject-1' }]);
      prisma.schoolLevel.findMany.mockResolvedValue([{ id: 'level-1' }]);

      const result = await service.register({
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '20000000',
        city: 'Tunis',
        acceptTerms: true,
        subjectIds: ['subject-1'],
        schoolLevelIds: ['level-1'],
      } as any);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '20000000',
            passwordHash: 'hashed-pw',
            status: 'PENDING_VALIDATION',
            roles: ['TEACHER'],
          }),
        }),
      );
      expect(prisma.teacherProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ id: 'user-1', status: 'DRAFT' }),
        }),
      );
      expect(prisma.parentProfile.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: 'user-1',
        phone: '20000000',
        status: 'PENDING_VALIDATION',
      });
    });

    it('rejects a duplicate phone with ConflictException', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing', phone: '1' });

      await expect(
        service.register({
          password: 'password123',
          firstName: 'A',
          lastName: 'B',
          phone: '1',
          city: 'Tunis',
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------
  describe('login', () => {
    const baseUser = {
      id: 'user-1',
      phone: '20000000',
      passwordHash: 'hashed',
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      lockedUntil: null,
      tokenVersion: 0,
      deletedAt: null,
    };

    it('succeeds with correct credentials and issues tokens', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...baseUser });
      password.verify.mockResolvedValue(true);
      prisma.userSession.create.mockResolvedValue({});

      const tokens = await service.login(
        { identifier: baseUser.phone, password: 'correct' } as any,
        meta,
      );

      expect(tokens).toEqual({ accessToken: 'signed.jwt.token', refreshToken: expect.any(String) });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: baseUser.id },
          data: expect.objectContaining({ failedLoginAttempts: 0, lockedUntil: null }),
        }),
      );
      expect(prisma.loginHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ success: true }) }),
      );
      expect(prisma.userSession.create).toHaveBeenCalled();
    });

    it('fails with wrong password', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...baseUser });
      password.verify.mockResolvedValue(false);

      await expect(
        service.login({ identifier: baseUser.phone, password: 'wrong' } as any, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects unknown phone', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ identifier: '00000000', password: 'x' } as any, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it.each(['SUSPENDED', 'DISABLED', 'ARCHIVED'])(
      'rejects a %s account before checking the password',
      async (status) => {
        prisma.user.findFirst.mockResolvedValue({ ...baseUser, status });

        await expect(
          service.login({ identifier: baseUser.phone, password: 'whatever' } as any, meta),
        ).rejects.toBeInstanceOf(UnauthorizedException);

        expect(password.verify).not.toHaveBeenCalled();
      },
    );

    it('rejects a soft-deleted account before checking the password', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, deletedAt: new Date() });

      await expect(
        service.login({ identifier: baseUser.phone, password: 'whatever' } as any, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(password.verify).not.toHaveBeenCalled();
    });

    it('rejects login when lockedUntil is in the future', async () => {
      const future = new Date(Date.now() + 60_000);
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, lockedUntil: future });

      await expect(
        service.login({ identifier: baseUser.phone, password: 'correct' } as any, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(password.verify).not.toHaveBeenCalled();
    });

    it('allows login again once lockedUntil is in the past', async () => {
      const past = new Date(Date.now() - 60_000);
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, lockedUntil: past });
      password.verify.mockResolvedValue(true);
      prisma.userSession.create.mockResolvedValue({});

      await expect(
        service.login({ identifier: baseUser.phone, password: 'correct' } as any, meta),
      ).resolves.toBeDefined();
    });
  });

  // ---------------------------------------------------------------------
  // failed attempts / lockout (via login, since recordFailedAttempt is private)
  // ---------------------------------------------------------------------
  describe('failed login attempts and lockout', () => {
    const baseUser = {
      id: 'user-1',
      phone: '20000000',
      passwordHash: 'hashed',
      status: 'ACTIVE',
      lockedUntil: null,
      tokenVersion: 0,
      deletedAt: null,
    };

    it('increments failedLoginAttempts on a wrong password below the max', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, failedLoginAttempts: 2 });
      password.verify.mockResolvedValue(false);

      await expect(
        service.login({ identifier: baseUser.phone, password: 'wrong' } as any, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginAttempts: 3, lockedUntil: undefined }),
        }),
      );
    });

    it('locks the account and resets the counter once max attempts is reached', async () => {
      // configDefaults.LOGIN_MAX_ATTEMPTS = 5 -> attempts 4 -> 5th failure locks
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, failedLoginAttempts: 4 });
      password.verify.mockResolvedValue(false);

      await expect(
        service.login({ identifier: baseUser.phone, password: 'wrong' } as any, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 0,
            lockedUntil: expect.any(Date),
          }),
        }),
      );
    });

    it('records the failed attempt in loginHistory with success: false', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, failedLoginAttempts: 0 });
      password.verify.mockResolvedValue(false);

      await expect(
        service.login({ identifier: baseUser.phone, password: 'wrong' } as any, meta),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.loginHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ success: false }) }),
      );
    });
  });

  // ---------------------------------------------------------------------
  // refresh
  // ---------------------------------------------------------------------
  describe('refresh', () => {
    it('rejects an unknown refresh token', async () => {
      prisma.userSession.findUnique.mockResolvedValue(null);

      await expect(service.refresh('unknown-token', meta)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a revoked refresh token', async () => {
      prisma.userSession.findUnique.mockResolvedValue({
        id: 'session-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        user: { id: 'user-1', tokenVersion: 0 },
      });

      await expect(service.refresh('revoked-token', meta)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an expired refresh token', async () => {
      prisma.userSession.findUnique.mockResolvedValue({
        id: 'session-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
        user: { id: 'user-1', tokenVersion: 0 },
      });

      await expect(service.refresh('expired-token', meta)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rotates to a new refresh token hash on success', async () => {
      prisma.userSession.findUnique.mockResolvedValue({
        id: 'session-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: { id: 'user-1', tokenVersion: 3 },
      });
      prisma.userSession.update.mockResolvedValue({});

      const result = await service.refresh('valid-token', meta);

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.refreshToken).not.toBe('valid-token');
      expect(prisma.userSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'session-1' },
          data: expect.objectContaining({
            refreshTokenHash: hashToken(result.refreshToken),
          }),
        }),
      );
      expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'user-1', tokenVersion: 3 });
    });
  });

  // ---------------------------------------------------------------------
  // logout / logoutAll
  // ---------------------------------------------------------------------
  describe('logout', () => {
    it('revokes the session and bumps tokenVersion (RM-SEC-036)', async () => {
      prisma.userSession.findUnique.mockResolvedValue({
        id: 'session-1',
        userId: 'user-1',
        revokedAt: null,
      });
      prisma.userSession.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      await service.logout('some-refresh-token');

      expect(prisma.userSession.findUnique).toHaveBeenCalledWith({
        where: { refreshTokenHash: hashToken('some-refresh-token') },
      });
      expect(prisma.userSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tokenVersion: { increment: 1 } },
      });
    });

    it('is a no-op for an unknown or already-revoked refresh token', async () => {
      prisma.userSession.findUnique.mockResolvedValue(null);

      await service.logout('unknown-token');

      expect(prisma.userSession.update).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('revokes all sessions for a user', async () => {
      prisma.userSession.updateMany.mockResolvedValue({ count: 3 });

      await service.logoutAll('user-1');

      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('requestDeletion', () => {
    it('soft-deletes the account, revokes active sessions and writes an audit entry', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@example.com',
        phone: null,
        roles: ['PARENT'],
        status: 'ACTIVE',
        deletedAt: null,
      });

      await expect(service.requestDeletion('user-1')).resolves.toEqual({ anonymized: false, deleted: true });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          deletedAt: expect.any(Date),
          status: 'ARCHIVED',
          tokenVersion: { increment: 1 },
        },
      });
      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            action: 'ACCOUNT_SOFT_DELETED',
            targetType: 'User',
            targetId: 'user-1',
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------
  // changePassword
  // ---------------------------------------------------------------------
  describe('changePassword', () => {
    it('rejects when the current password is wrong', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ id: 'user-1', passwordHash: 'hashed' });
      password.verify.mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrong',
          newPassword: 'newpassword123',
        } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('bumps tokenVersion and revokes all sessions on success', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        passwordHash: 'hashed',
        passwordChangeCount: 0,
        passwordChangeWindowStart: null,
      });
      password.verify.mockResolvedValue(true);
      password.hash.mockResolvedValue('new-hashed');

      await service.changePassword('user-1', {
        currentPassword: 'correct',
        newPassword: 'newpassword123',
      } as any);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          passwordHash: 'new-hashed',
          tokenVersion: { increment: 1 },
          passwordChangeCount: 1,
          passwordChangeWindowStart: expect.any(Date),
        },
      });
      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  // ---------------------------------------------------------------------
  // resetPassword
  // ---------------------------------------------------------------------
  describe('resetPassword', () => {
    it('rejects an unknown token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'nope', newPassword: 'newpassword123' } as any),
      ).rejects.toThrow('Lien de réinitialisation invalide ou expiré');
    });

    it('rejects an already-used token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'reset-1',
        userId: 'user-1',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        service.resetPassword({ token: 'used', newPassword: 'newpassword123' } as any),
      ).rejects.toThrow('Lien de réinitialisation invalide ou expiré');
    });

    it('rejects an expired token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'reset-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
      });

      await expect(
        service.resetPassword({ token: 'expired', newPassword: 'newpassword123' } as any),
      ).rejects.toThrow('Lien de réinitialisation invalide ou expiré');
    });

    it('bumps tokenVersion and revokes sessions on success', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'reset-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      password.hash.mockResolvedValue('new-hashed');

      await service.resetPassword({ token: 'valid', newPassword: 'newpassword123' } as any);

      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 'reset-1' },
        data: { usedAt: expect.any(Date) },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new-hashed', tokenVersion: { increment: 1 } },
      });
      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  // ---------------------------------------------------------------------
  // generateAssistedResetLink (Avenant 01, Ch. I.3)
  // ---------------------------------------------------------------------
  describe('generateAssistedResetLink', () => {
    const target = {
      id: 'parent-1',
      phone: '20000002',
      status: 'ACTIVE',
      deletedAt: null,
      roles: ['PARENT'],
    };
    const admin = { id: 'admin-1', roles: ['ADMIN'] } as any;
    const teacher = { id: 'teacher-1', roles: ['TEACHER'] } as any;

    it('lets an Administrator reset any account', async () => {
      prisma.user.findUnique.mockResolvedValue(target);

      const result = await service.generateAssistedResetLink(admin, target.id);

      expect(result.token).toEqual(expect.any(String));
      expect(result.url).toContain(result.token);
      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: target.id }) }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: admin.id, action: 'PASSWORD_RESET_LINK_ASSISTED', targetId: target.id }),
        }),
      );
    });

    it('lets a Teacher reset a Parent linked via a level pool', async () => {
      prisma.user.findUnique.mockResolvedValue(target);
      prisma.levelPoolMembership.findFirst.mockResolvedValue({ id: 'membership-1' });
      prisma.enrollment.findFirst.mockResolvedValue(null);

      const result = await service.generateAssistedResetLink(teacher, target.id);

      expect(result.token).toEqual(expect.any(String));
    });

    it('forbids a Teacher from resetting a Parent with no link to them', async () => {
      prisma.user.findUnique.mockResolvedValue(target);
      prisma.levelPoolMembership.findFirst.mockResolvedValue(null);
      prisma.enrollment.findFirst.mockResolvedValue(null);

      await expect(service.generateAssistedResetLink(teacher, target.id)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('forbids a Teacher from resetting a non-Parent account', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...target, roles: ['TEACHER'] });

      await expect(service.generateAssistedResetLink(teacher, target.id)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an unknown target account', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.generateAssistedResetLink(admin, 'nope')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
