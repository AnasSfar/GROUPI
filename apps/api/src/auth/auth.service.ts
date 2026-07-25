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

const NON_AUTHENTICABLE_STATUSES = new Set(['SUSPENDED', 'DISABLED', 'ARCHIVED']);

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

    const passwordHash = await this.password.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          status: 'PENDING_VALIDATION',
          roles: [dto.role],
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
      }

      return created;
    });

    return { id: user.id, email: user.email, status: user.status };
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

    const newHash = await this.password.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash, tokenVersion: { increment: 1 } },
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
