import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { PasswordService } from './password.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

const NON_AUTHENTICABLE_STATUSES = new Set(['SUSPENDED', 'DISABLED', 'ARCHIVED']);


function expectedSchoolTypeForLevelCode(code: string): 'PRIMARY' | 'COLLEGE' | 'HIGH_SCHOOL' {
  if (code.startsWith('PRIM')) return 'PRIMARY';
  if (code.startsWith('COL')) return 'COLLEGE';
  return 'HIGH_SCHOOL';
}
interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly password: PasswordService,
    private readonly email: EmailService,
  ) {}

  /** Ch.3.6-3.7, RM-ACC-004/005 : auto-inscription Professeur/Parent uniquement, compte PENDING_VALIDATION. */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cette adresse e-mail');
    }

    // Ch.9.5, ERR-SEC-013 : conditions d'utilisation obligatoires à l'inscription.
    if (!dto.acceptTerms) {
      throw new BadRequestException("L'acceptation des conditions d'utilisation est obligatoire (ERR-SEC-013)");
    }

    const passwordHash = await this.password.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          status: 'PENDING_VALIDATION',
          roles: [dto.role],
          acceptedTermsAt: new Date(),
        },
      });

      if (dto.role === 'TEACHER') {
        await tx.teacherProfile.create({
          data: {
            id: created.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            city: dto.city,
            status: 'DRAFT',
          },
        });

        // RM-TPR-001/002 : matières et niveaux obligatoires dès la création, choisis dans les référentiels officiels.
        const [subjects, schoolLevels] = await Promise.all([
          tx.subject.findMany({ where: { id: { in: dto.subjectIds }, isActive: true } }),
          tx.schoolLevel.findMany({ where: { id: { in: dto.schoolLevelIds }, isActive: true } }),
        ]);
        if (subjects.length !== new Set(dto.subjectIds).size) {
          throw new BadRequestException('Une ou plusieurs matières sélectionnées sont introuvables ou inactives');
        }
        if (schoolLevels.length !== new Set(dto.schoolLevelIds).size) {
          throw new BadRequestException(
            'Un ou plusieurs niveaux scolaires sélectionnés sont introuvables ou inactifs',
          );
        }

        await tx.teacherSubject.createMany({
          data: dto.subjectIds.map((subjectId) => ({ teacherProfileId: created.id, subjectId })),
        });
        await tx.teacherSchoolLevel.createMany({
          data: dto.schoolLevelIds.map((schoolLevelId) => ({ teacherProfileId: created.id, schoolLevelId })),
        });
      } else {
        await tx.parentProfile.create({
          data: {
            id: created.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            city: dto.city,
          },
        });

        const initialStudent = dto.initialStudent;
        const [schoolLevel, school, academicYear] = await Promise.all([
          tx.schoolLevel.findUnique({ where: { id: initialStudent.schoolLevelId } }),
          tx.school.findUnique({ where: { id: initialStudent.schoolId } }),
          tx.academicYear.findFirst({ where: { status: 'OPEN' }, orderBy: { startDate: 'desc' } }),
        ]);
        if (!schoolLevel || !schoolLevel.isActive) {
          throw new BadRequestException('Niveau scolaire introuvable ou inactif');
        }
        if (!school || !school.isActive) {
          throw new BadRequestException('Établissement introuvable ou inactif (ERR-PAR-002)');
        }
        const expectedSchoolType = expectedSchoolTypeForLevelCode(schoolLevel.code);
        if (school.type !== expectedSchoolType) {
          throw new BadRequestException('Cet établissement ne correspond pas au niveau scolaire sélectionné');
        }
        if (!academicYear) {
          throw new BadRequestException('Aucune année académique ouverte');
        }

        const student = await tx.student.create({
          data: {
            parentId: created.id,
            firstName: initialStudent.firstName,
            lastName: initialStudent.lastName,
            dateOfBirth: initialStudent.dateOfBirth ? new Date(initialStudent.dateOfBirth) : null,
            status: 'ACTIVE',
          },
        });

        const situation = await tx.studentSchoolSituation.create({
          data: {
            studentId: student.id,
            academicYearId: academicYear.id,
            schoolLevelId: initialStudent.schoolLevelId,
            schoolId: initialStudent.schoolId,
            class: initialStudent.schoolClass,
            startDate: new Date(),
          },
        });

        await tx.student.update({
          where: { id: student.id },
          data: { currentSchoolSituationId: situation.id },
        });
      }

      return created;
    });

    // Hors chemin critique (Ch.24) : un échec d'envoi ne doit jamais bloquer l'inscription.
    await this.sendVerificationEmail(user.id, user.email);

    return { id: user.id, email: user.email, status: user.status };
  }

  /**
   * Ch.9.5, ERR-SEC-012 : e-mail de vérification — n'invalide jamais l'accès (voir `login`, qui
   * ne consulte pas `emailVerifiedAt`) ; simple infrastructure pour que le champ, jusqu'ici mort,
   * soit réellement renseigné quand l'utilisateur clique le lien.
   */
  private async sendVerificationEmail(userId: string, email: string): Promise<void> {
    const ttlMinutes = this.config.get<number>('EMAIL_VERIFICATION_TTL_MINUTES', 60 * 24);
    const rawToken = randomBytes(32).toString('hex');

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash: this.hashToken(rawToken),
          expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
        },
      }),
    ]);

    await this.email.sendEmailVerification(email, rawToken);
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.emailVerifiedAt) {
      throw new BadRequestException('Cette adresse e-mail est déjà vérifiée');
    }
    await this.sendVerificationEmail(user.id, user.email);
  }

  /** Ch.9.5, ERR-SEC-012 : lien à usage unique, même schéma que `resetPassword`. */
  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

    if (!verificationToken || verificationToken.usedAt || verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Lien de vérification invalide ou expiré');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);
  }

  /** §9.2, RM-SEC-016/024/026/027 : vérifie statut + verrouillage avant tout essai de mot de passe. */
  async login(dto: LoginDto, meta: RequestMeta): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (NON_AUTHENTICABLE_STATUSES.has(user.status)) {
      throw new UnauthorizedException('Ce compte ne peut pas se connecter');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Compte temporairement verrouillé, réessayez plus tard');
    }

    const passwordValid = await this.password.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      await this.recordFailedAttempt(user.id, user.failedLoginAttempts, meta);
      throw new UnauthorizedException('Identifiants invalides');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      }),
      this.prisma.loginHistory.create({
        data: {
          userId: user.id,
          success: true,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      }),
    ]);

    return this.issueTokens(user.id, user.tokenVersion, meta);
  }

  /** RM-SEC-016/037 : verrouille 15 min après 5 échecs consécutifs, sans changer `status`. */
  private async recordFailedAttempt(userId: string, currentAttempts: number, meta: RequestMeta) {
    const maxAttempts = this.config.get<number>('LOGIN_MAX_ATTEMPTS', 5);
    const lockoutMinutes = this.config.get<number>('LOGIN_LOCKOUT_MINUTES', 15);
    const attempts = currentAttempts + 1;
    const shouldLock = attempts >= maxAttempts;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + lockoutMinutes * 60_000) : undefined,
        },
      }),
      this.prisma.loginHistory.create({
        data: {
          userId,
          success: false,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      }),
    ]);
  }

  /** RM-SEC-034 : rotation — un nouveau refresh token est émis, l'ancien devient inutilisable. */
  async refresh(refreshToken: string, meta: RequestMeta): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session invalide, veuillez vous reconnecter');
    }

    const inactivityMinutes = this.config.get<number>('SESSION_INACTIVITY_MINUTES', 30);
    const newRefreshToken = randomBytes(48).toString('hex');

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: this.hashToken(newRefreshToken),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + inactivityMinutes * 60_000),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    const accessToken = await this.signAccessToken(session.user.id, session.user.tokenVersion);
    return { accessToken, refreshToken: newRefreshToken };
  }

  /** §9.6 : révoque la session correspondant à ce refresh token (idempotent). */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.userSession.updateMany({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** §9.6 "fermer toutes ses sessions" */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** RM-SEC-010 : le Super Administrateur force la déconnexion d'un utilisateur. */
  async forceLogout(targetUserId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userSession.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { tokenVersion: { increment: 1 } },
      }),
    ]);
  }

  /** RM-SEC-017/033 : déconnecte toutes les sessions de manière atomique avec le changement. */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await this.password.verify(user.passwordHash, dto.currentPassword);
    if (!valid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // ERR-SEC-008 : au-delà de N changements volontaires sur une fenêtre glissante, on bloque
    // temporairement — même principe que le verrouillage de connexion (RM-SEC-016/037), mais sur
    // un compteur distinct puisqu'ici le mot de passe actuel est correct à chaque tentative.
    const windowMinutes = this.config.get<number>('PASSWORD_CHANGE_WINDOW_MINUTES', 60);
    const maxChanges = this.config.get<number>('PASSWORD_CHANGE_MAX_PER_WINDOW', 3);
    const now = new Date();
    const withinWindow =
      user.passwordChangeWindowStart !== null &&
      now.getTime() - user.passwordChangeWindowStart.getTime() < windowMinutes * 60_000;
    const countInWindow = withinWindow ? user.passwordChangeCount : 0;
    if (countInWindow >= maxChanges) {
      throw new BadRequestException(
        `Trop de changements de mot de passe récents : réessayez dans ${windowMinutes} minutes (ERR-SEC-008)`,
      );
    }

    const newHash = await this.password.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          tokenVersion: { increment: 1 },
          passwordChangeCount: withinWindow ? countInWindow + 1 : 1,
          passwordChangeWindowStart: withinWindow ? user.passwordChangeWindowStart : now,
        },
      }),
      this.prisma.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  /** RM-SEC-004/005/015 : invalide les liens précédents, lien à usage unique valable 15 min. */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      return; // ne révèle pas si l'e-mail existe
    }

    const ttlMinutes = this.config.get<number>('PASSWORD_RESET_TTL_MINUTES', 15);
    const rawToken = randomBytes(32).toString('hex');

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hashToken(rawToken),
          expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
        },
      }),
    ]);

    await this.email.sendPasswordResetEmail(user.email, rawToken);
  }

  /** RM-SEC-019 : la réinitialisation invalide immédiatement toutes les sessions actives. */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré');
    }

    const newHash = await this.password.hash(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newHash, tokenVersion: { increment: 1 } },
      }),
      this.prisma.userSession.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async deactivateMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    if (user.roles.includes('SUPER_ADMIN')) {
      throw new BadRequestException('Le compte Super Administrateur ne peut pas etre desactive en auto-service');
    }
    if (user.status !== 'ACTIVE' && user.status !== 'SUSPENDED') {
      throw new BadRequestException('Seul un compte actif ou suspendu peut etre desactive en auto-service');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { status: 'DISABLED', tokenVersion: { increment: 1 } } }),
      this.prisma.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.prisma.auditLog.create({
        data: {
          userId,
          action: 'ACCOUNT_SELF_DISABLED',
          targetType: 'User',
          targetId: userId,
          oldValues: { status: user.status },
          newValues: { status: 'DISABLED', reason: 'SELF_SERVICE' },
        },
      }),
    ]);
  }
  private async issueTokens(
    userId: string,
    tokenVersion: number,
    meta: RequestMeta,
  ): Promise<TokenPair> {
    const inactivityMinutes = this.config.get<number>('SESSION_INACTIVITY_MINUTES', 30);
    const refreshToken = randomBytes(48).toString('hex');

    await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash: this.hashToken(refreshToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: new Date(Date.now() + inactivityMinutes * 60_000),
      },
    });

    const accessToken = await this.signAccessToken(userId, tokenVersion);
    return { accessToken, refreshToken };
  }

  private signAccessToken(userId: string, tokenVersion: number): Promise<string> {
    return this.jwt.signAsync({ sub: userId, tokenVersion });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
