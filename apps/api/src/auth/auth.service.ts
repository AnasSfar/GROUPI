import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomInt, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PasswordService } from './password.service';
import { TeacherProfileService } from '../teacher-profile/teacher-profile.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AddRoleDto } from './dto/add-role.dto';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly password: PasswordService,
    private readonly sms: SmsService,
    private readonly notifications: NotificationsService,
    private readonly teacherProfile: TeacherProfileService,
  ) {}

  /**
   * Ch.3.6-3.7, Avenant 01 Ch. A.2/D.2 : auto-inscription — désormais réservée au Professeur (le
   * Parent n'entre plus dans GROUPI que via un lien d'invitation, voir `ParentInvitationsService.accept`).
   */
  async register(dto: RegisterDto) {
    const phone = dto.phone.trim();
    if (!phone) {
      throw new BadRequestException('Le numéro de téléphone est obligatoire');
    }

    const existing = await this.prisma.user.findFirst({ where: { phone } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec ce numéro de téléphone (ERR-ACC-008)');
    }

    // Ch.9.5, ERR-SEC-013 : conditions d'utilisation obligatoires à l'inscription.
    if (!dto.acceptTerms) {
      throw new BadRequestException("L'acceptation des conditions d'utilisation est obligatoire (ERR-SEC-013)");
    }

    const passwordHash = await this.password.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          phone,
          passwordHash,
          status: 'PENDING_VALIDATION',
          roles: ['TEACHER'],
          acceptedTermsAt: new Date(),
        },
      });

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
      // RM-TPR-008 : la compatibilité Matière/Niveau (référentiel SubjectLevel) est vérifiée dès
      // la création du profil, pas seulement en modification ultérieure.
      await this.teacherProfile.assertSubjectLevelSelectionValid(dto.subjectIds, dto.schoolLevelIds);

      await tx.teacherSubject.createMany({
        data: dto.subjectIds.map((subjectId) => ({ teacherProfileId: created.id, subjectId })),
      });
      await tx.teacherSchoolLevel.createMany({
        data: dto.schoolLevelIds.map((schoolLevelId) => ({ teacherProfileId: created.id, schoolLevelId })),
      });

      return created;
    });

    return { id: user.id, phone: user.phone, status: user.status };
  }

  private generateNumericCode(length = 6): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += randomInt(0, 10).toString();
    }
    return code;
  }

  // Avenant 01, Ch. I.9 (RM-SEC-052) : `sendVerificationEmail`/`resendVerificationEmail`/`verifyEmail`
  // (Ch.9.5 V1.0) retirés avec le canal e-mail — `EmailVerificationToken` reste en base (inerte,
  // même décision que pour `User.email`) plutôt que de déclencher une nouvelle migration.
  //
  // Ch. I.2 : même sort pour `sendVerificationSms`/`resendVerificationSms`/`verifyPhone` — en V1.1
  // le numéro n'est plus vérifié par un code (I.2.1), seul le format/l'unicité comptent à
  // l'inscription (`register`). `PhoneVerificationToken` reste en base, non utilisé (I.2.4).

  /** §9.2, RM-SEC-001 : identifiant du compte — téléphone pour Professeur/Parent (Avenant 01
   * Ch. I.1, e-mail retiré), e-mail pour Administrateur/Super Admin (Ch. H, hors périmètre de
   * l'avenant). Vérifie statut + verrouillage avant tout essai de mot de passe. */
  async login(dto: LoginDto, meta: RequestMeta): Promise<TokenPair> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.identifier }, { phone: dto.identifier }] },
    });
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    if (user.deletedAt || NON_AUTHENTICABLE_STATUSES.has(user.status)) {
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

    // Hors chemin critique (Ch.24) : la détection d'appareil / le score de risque ne doivent jamais
    // faire échouer une connexion par ailleurs valide.
    await this.trackDeviceAndRiskScore(user.id, meta);

    return this.issueTokens(user.id, user.tokenVersion, meta);
  }

  /**
   * RM-SEC-008/013/014/022/029/031/032/038 : MVP volontairement simple — ni moteur de détection de
   * fraude, ni action bloquante automatique (RM-SEC-029). `UserDevice` sert uniquement à repérer
   * une paire (IP, user-agent) déjà vue pour ce compte (RM-SEC-014) ; le score de risque est
   * recalculé à la volée à chaque connexion (pas de colonne dédiée) à partir de deux signaux
   * simples sur les dernières 24h. Ces données ne servent qu'à la sécurité du compte : elles ne
   * constituent jamais une preuve d'usage frauduleux et ne sont jamais exploitées à des fins
   * commerciales (RM-SEC-022/032/038). RM-SEC-008 (partage de compte) reste couvert par une
   * heuristique volontairement légère (IP distinctes sur une fenêtre courte, ci-dessous) — un vrai
   * moteur de détection (vélocité de connexion, empreinte d'appareil, géolocalisation) resterait un
   * chantier à part, hors de portée d'une passe de correction.
   */
  private async trackDeviceAndRiskScore(userId: string, meta: RequestMeta): Promise<void> {
    const ipAddress = meta.ipAddress ?? null;
    const userAgent = meta.userAgent ?? null;

    // `findFirst` plutôt que `findUnique` sur la clé composite : Prisma type cette dernière en
    // `string` (non nullable) pour `ipAddress`/`userAgent` même si la colonne est nullable en base
    // (NULL n'a pas de sémantique d'unicité en SQL) — `findFirst` accepte les valeurs nulles.
    const existingDevice = await this.prisma.userDevice.findFirst({
      where: { userId, ipAddress, userAgent },
    });

    if (existingDevice) {
      await this.prisma.userDevice.update({
        where: { id: existingDevice.id },
        data: { lastSeenAt: new Date() },
      });
    } else {
      await this.prisma.userDevice.create({ data: { userId, ipAddress, userAgent } });
      // RM-SEC-014 : nouvel appareil/IP jamais vu pour ce compte.
      await this.notifications.notify({
        recipientUserId: userId,
        type: 'SEC_NEW_DEVICE',
        priority: 'IMPORTANT',
        title: 'Connexion depuis un nouvel appareil',
        body: `Une connexion vient d'être détectée depuis un appareil ou un réseau inhabituel${
          ipAddress ? ` (IP ${ipAddress})` : ''
        }. Si ce n'était pas vous, changez votre mot de passe immédiatement.`,
        refType: 'User',
        refId: userId,
      });
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [newDevicesLast24h, failedAttemptsLast24h] = await Promise.all([
      this.prisma.userDevice.count({ where: { userId, firstSeenAt: { gte: dayAgo } } }),
      this.prisma.loginHistory.count({ where: { userId, success: false, createdAt: { gte: dayAgo } } }),
    ]);
    // Formule simple et documentée (RM-SEC-013) : chaque nouvel appareil détecté sur les dernières
    // 24h pèse 30 points, chaque échec de connexion récent 10 points, plafonné à 100.
    const riskScore = Math.min(100, newDevicesLast24h * 30 + failedAttemptsLast24h * 10);
    if (riskScore > 70) {
      await this.notifications.notify({
        recipientUserId: userId,
        type: 'SEC_RISK_SCORE_HIGH',
        priority: 'IMPORTANT',
        title: 'Activité de connexion inhabituelle',
        body: `Une activité de connexion inhabituelle a été détectée sur votre compte (indicateur de risque ${riskScore}/100). Si ce n'était pas vous, changez votre mot de passe et déconnectez toutes vos sessions.`,
        refType: 'User',
        refId: userId,
      });
    }

    // RM-SEC-008 : signal de partage de compte — plusieurs adresses IP distinctes ayant réussi une
    // connexion sur une fenêtre courte (1h) sont plus caractéristiques d'un partage d'identifiants
    // qu'un simple nouvel appareil ponctuel (déjà couvert ci-dessus par SEC_NEW_DEVICE). Purement
    // informatif, aucune action bloquante (RM-SEC-029).
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSuccessfulLogins = await this.prisma.loginHistory.findMany({
      where: { userId, success: true, createdAt: { gte: oneHourAgo } },
      select: { ipAddress: true },
    });
    const distinctRecentIps = new Set(
      recentSuccessfulLogins.map((l) => l.ipAddress).filter((ip): ip is string => Boolean(ip)),
    );
    if (distinctRecentIps.size >= 3) {
      await this.notifications.notify({
        recipientUserId: userId,
        type: 'SEC_ACCOUNT_SHARING_SUSPECTED',
        priority: 'IMPORTANT',
        title: 'Partage de compte potentiel détecté',
        body: `Votre compte a été utilisé depuis ${distinctRecentIps.size} adresses différentes au cours de la dernière heure (RM-SEC-008). Si vous ne partagez pas vos identifiants, changez votre mot de passe par précaution.`,
        refType: 'User',
        refId: userId,
      });
    }
  }

  /**
   * RM-SEC-016/037 : verrouille 15 min après 5 échecs consécutifs, sans changer `status`.
   * RM-SEC-009 : délai progressif volontairement non implémenté (voir résumé de la tâche — le
   * mécanisme de verrouillage actuel est un point fixe 5 tentatives/15 min, remplacer par un
   * délai variable serait une refonte plus large, hors périmètre de cette passe de correction).
   * Seule l'ajout d'une notification lorsque le verrouillage se déclenche réellement (pas à chaque
   * échec individuel) est traité ici.
   */
  private async recordFailedAttempt(
    userId: string,
    currentAttempts: number,
    meta: RequestMeta,
  ) {
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

    if (shouldLock) {
      // RM-SEC-009 : notification déclenchée uniquement au moment du verrouillage effectif.
      await this.notifications.notify({
        recipientUserId: userId,
        type: 'SEC_ACCOUNT_LOCKED',
        priority: 'CRITICAL',
        title: 'Compte temporairement verrouillé',
        body: `Votre compte a été verrouillé ${lockoutMinutes} minutes après ${maxAttempts} tentatives de connexion échouées. Si ce n'était pas vous, changez votre mot de passe dès que possible.`,
        refType: 'User',
        refId: userId,
      });
    }
  }

  /** RM-SEC-034 : rotation — un nouveau refresh token est émis, l'ancien devient inutilisable. */
  async refresh(refreshToken: string, meta: RequestMeta): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.user.deletedAt ||
      NON_AUTHENTICABLE_STATUSES.has(session.user.status)
    ) {
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

  /**
   * §9.6 : révoque la session correspondant à ce refresh token (idempotent).
   * RM-SEC-036 : révoque aussi l'access token JWT déjà émis, en incrémentant `tokenVersion`
   * (même mécanisme que `changePassword`/`resetPassword`/désactivation) — sans cela, un access
   * token déjà distribué restait valide jusqu'à 15 min après une déconnexion volontaire.
   * Compromis assumé (voir résumé de la tâche) : `tokenVersion` est un compteur global par
   * utilisateur (voir `JwtStrategy`), donc cette déconnexion invalide aussi les access tokens des
   * AUTRES sessions actives de ce même utilisateur, pas seulement celle qui se déconnecte — les
   * autres `UserSession` (et donc le rafraîchissement via refresh token sur ces autres appareils,
   * RM-SEC-020) restent en revanche intactes, puisque seule la session correspondant à ce refresh
   * token est révoquée ci-dessous.
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.userSession.findUnique({ where: { refreshTokenHash: tokenHash } });
    if (!session || session.revokedAt) {
      return;
    }
    await this.prisma.$transaction([
      this.prisma.userSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: session.userId },
        data: { tokenVersion: { increment: 1 } },
      }),
    ]);
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

  /** RM-SEC-001/004/005/015 : identifiant e-mail (Admin, Ch. H) ou téléphone (Professeur/Parent,
   * Ch. I.1) ; invalide les codes précédents, code à usage unique valable 15 min, envoyé par SMS
   * best-effort quand un téléphone existe (aucun canal garanti — voir aussi le reset assisté par
   * un Professeur/Admin, Ch. I.3, `generateAssistedResetLink`). */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.identifier }, { phone: dto.identifier }] },
    });
    if (!user) {
      return; // ne révèle pas si l'identifiant existe
    }

    const ttlMinutes = this.config.get<number>('PASSWORD_RESET_TTL_MINUTES', 15);
    // RM-SEC-004/005/015 : un code par SMS reste court (numérique), recopiable facilement.
    const rawToken = this.generateNumericCode();

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

    // Avenant 01, Ch. I.9/I.7 (RM-SEC-052, décision #7 option A) : aucun canal gratuit garanti —
    // best-effort seulement (stub en l'absence de fournisseur SMS configuré, voir `SmsService`).
    if (user.phone) {
      await this.sms.sendPasswordResetSms(user.phone, rawToken);
    }
  }

  /**
   * Ch. I.3 (reset assisté) : sans canal d'envoi automatique garanti, un Professeur (pour l'un de
   * ses Parents rattachés/inscrits) ou un Administrateur (pour n'importe quel compte) peut générer
   * un lien de réinitialisation à usage unique, affiché à l'écran et transmis hors bande (WhatsApp,
   * en personne...). Même modèle `PasswordResetToken` qu'un reset auto-déclenché ; jeton hexadécimal
   * long (lien cliquable), pas un code court, puisqu'il n'est jamais recopié depuis un SMS.
   */
  async generateAssistedResetLink(
    actingUser: AuthenticatedUser,
    targetUserId: string,
  ): Promise<{ token: string; url: string; expiresAt: Date }> {
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw new BadRequestException('Compte introuvable');
    }
    if (target.deletedAt || NON_AUTHENTICABLE_STATUSES.has(target.status)) {
      throw new BadRequestException('Ce compte ne peut pas se connecter, la réinitialisation est inutile');
    }

    const isAdmin = actingUser.roles.includes('ADMIN') || actingUser.roles.includes('SUPER_ADMIN');
    if (!isAdmin) {
      if (!actingUser.roles.includes('TEACHER') || !target.roles.includes('PARENT')) {
        throw new ForbiddenException(
          "Seul un Administrateur peut réinitialiser le mot de passe d'un compte qui n'est pas un Parent",
        );
      }
      const [viaPool, viaEnrollment] = await Promise.all([
        this.prisma.levelPoolMembership.findFirst({
          where: { student: { parentId: target.id }, group: { teacherId: actingUser.id } },
        }),
        this.prisma.enrollment.findFirst({
          where: { student: { parentId: target.id }, group: { teacherId: actingUser.id } },
        }),
      ]);
      if (!viaPool && !viaEnrollment) {
        throw new ForbiddenException(
          "Ce Parent n'a aucun enfant rattaché ou inscrit chez vous : vous ne pouvez pas réinitialiser son mot de passe",
        );
      }
    }

    const ttlMinutes = this.config.get<number>('PASSWORD_RESET_TTL_MINUTES', 15);
    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: { userId: target.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.create({
        data: { userId: target.id, tokenHash: this.hashToken(rawToken), expiresAt },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: actingUser.id,
          action: 'PASSWORD_RESET_LINK_ASSISTED',
          targetType: 'User',
          targetId: target.id,
        },
      }),
    ]);

    return { token: rawToken, url: this.publicResetUrlFor(rawToken), expiresAt };
  }

  private publicResetUrlFor(rawToken: string): string {
    const base =
      this.config.get<string>('PUBLIC_APP_URL') ?? this.config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';
    return `${base.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
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

  /** RM-CYC-013/018 : suppression logique self-service, avec conservation de la ligne User. */
  async requestDeletion(userId: string): Promise<{ anonymized: boolean; deleted: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    if (user.roles.includes('SUPER_ADMIN')) {
      throw new BadRequestException(
        'Le compte Super Administrateur ne peut pas faire l’objet d’une suppression en auto-service',
      );
    }
    if (user.deletedAt) {
      return { anonymized: false, deleted: true };
    }

    const deletedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt,
          status: 'ARCHIVED',
          tokenVersion: { increment: 1 },
        },
      }),
      this.prisma.userSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: deletedAt } }),
      this.prisma.auditLog.create({
        data: {
          userId,
          action: 'ACCOUNT_SOFT_DELETED',
          targetType: 'User',
          targetId: userId,
          oldValues: { email: user.email, phone: user.phone, status: user.status },
          newValues: {
            deletedAt,
            status: 'ARCHIVED',
            reason: 'SELF_SERVICE_SOFT_DELETE',
          },
        },
      }),
    ]);
    return { anonymized: false, deleted: true };
  }

  /**
   * RM-TRS-013/RM-GEN-020 : conservation légale de 7 ans, anonymisation possible ensuite — jusqu'ici
   * seule une demande VOLONTAIRE (`requestDeletion` ci-dessus) déclenchait une anonymisation ; un
   * compte désactivé sans démarche active de son titulaire restait indéfiniment tel quel. Cette
   * méthode couvre le cas automatique : tout compte `DISABLED` depuis plus de 7 ans (approximé par
   * `User.updatedAt`, faute d'un horodatage dédié à la transition de statut — la vraie date de
   * désactivation ne peut être qu'antérieure ou égale, donc cette approximation ne peut jamais
   * anonymiser un compte trop tôt) est traité par le même mécanisme que la demande self-service
   * (réutilise `requestDeletion`, déjà idempotent — un compte déjà anonymisé a un e-mail
   * `deleted-*@groupi.invalid` qui l'exclut automatiquement de la requête suivante).
   */
  async sweepStaleDisabledAccounts(now = new Date()): Promise<{ processed: number; failed: number }> {
    const sevenYearsAgo = new Date(now);
    sevenYearsAgo.setUTCFullYear(sevenYearsAgo.getUTCFullYear() - 7);

    const candidates = await this.prisma.user.findMany({
      where: {
        status: 'DISABLED',
        updatedAt: { lt: sevenYearsAgo },
        // Exclut les comptes déjà anonymisés, identifiant e-mail ou téléphone (RM-SEC-001).
        NOT: { OR: [{ email: { startsWith: 'deleted-' } }, { phone: { startsWith: 'deleted-' } }] },
        roles: { hasSome: ['TEACHER', 'PARENT'] },
      },
      select: { id: true },
    });

    let processed = 0;
    let failed = 0;
    for (const candidate of candidates) {
      try {
        await this.requestDeletion(candidate.id);
        processed++;
      } catch (err) {
        failed++;
        this.logger.error(`Échec anonymisation automatique RM-TRS-013 pour ${candidate.id}`, err as Error);
      }
    }
    return { processed, failed };
  }

  /**
   * RM-CYC-013 : détermination simple d'un « minimum d'historique métier ». Vérifie d'abord un
   * signal concret (`Enrollment` liée, comme Professeur via ses groupes ou comme Parent via ses
   * élèves) ; à défaut, la simple existence d'un profil Professeur/Parent est considérée comme un
   * minimum d'historique (abonnement, préinscription, élève rattaché...) et fait pencher par défaut
   * vers l'anonymisation plutôt que la suppression réelle — plus sûr que de tenter de retracer
   * exhaustivement chaque table pouvant référencer ce compte.
   */
  private async hasBusinessHistory(user: {
    id: string;
    roles: string[];
    teacherProfile: unknown;
    parentProfile: unknown;
  }): Promise<boolean> {
    const [enrollmentAsTeacher, enrollmentAsParent, accountingEntries] = await Promise.all([
      user.roles.includes('TEACHER')
        ? this.prisma.enrollment.count({ where: { group: { teacherId: user.id } } })
        : Promise.resolve(0),
      user.roles.includes('PARENT')
        ? this.prisma.enrollment.count({ where: { student: { parentId: user.id } } })
        : Promise.resolve(0),
      this.prisma.accountingEntry.count({ where: { authorId: user.id } }),
    ]);
    if (enrollmentAsTeacher > 0 || enrollmentAsParent > 0 || accountingEntries > 0) {
      return true;
    }
    return Boolean(user.teacherProfile) || Boolean(user.parentProfile);
  }

  /** §9.10, RM-SEC-026/027/028 : journal des connexions du titulaire, non modifiable, plus récentes d'abord. */
  async listMyLoginHistory(userId: string, take = 20) {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, success: true, ipAddress: true, userAgent: true, createdAt: true },
    });
  }

  /**
   * RM-ACC-002 : cumul de rôles — un compte Professeur ou Parent déjà actif peut acquérir le second
   * rôle métier sans créer un nouveau compte. Reprend la même validation que `register` (RM-TPR-001
   * pour TEACHER) et crée le profil manquant en PENDING_VALIDATION (RM-CYC-005/007), même workflow
   * qu'à l'inscription initiale.
   */
  async addRole(userId: string, dto: AddRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    if (user.roles.includes(dto.role)) {
      throw new ConflictException('Ce compte possède déjà ce rôle');
    }
    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Seul un compte actif peut acquérir un second rôle métier');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.role === 'TEACHER') {
        // RM-TPR-001/002 : matières et niveaux obligatoires dès la création du profil, choisis
        // dans les référentiels officiels (même contrôle qu'à l'inscription, voir `register`).
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
        // RM-TPR-008 : la compatibilité Matière/Niveau (référentiel SubjectLevel) est vérifiée dès
        // la création du profil.
        await this.teacherProfile.assertSubjectLevelSelectionValid(dto.subjectIds, dto.schoolLevelIds);

        await tx.teacherProfile.create({
          data: {
            id: userId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            city: dto.city,
            // Profil déjà complet à la création (contrairement à `register`, où il démarre en DRAFT) :
            // il part directement en PENDING_VALIDATION pour revue par un Administrateur.
            status: 'PENDING_VALIDATION',
          },
        });

        // isValidated:false — contrairement à `register()` (où le compte entier reste
        // PENDING_VALIDATION tant que l'Admin n'a pas validé, ce qui bloque déjà la création de
        // groupe), ici `User.status` est déjà ACTIVE (premier rôle déjà validé) : sans ce flag,
        // `groups.service.ts` ne bloquerait plus la création de groupe pour ce second rôle en
        // attente (RM-TPR-003/004/005 — seule cette ligne doit être en attente de validation admin).
        await tx.teacherSubject.createMany({
          data: dto.subjectIds.map((subjectId) => ({ teacherProfileId: userId, subjectId, isValidated: false })),
        });
        await tx.teacherSchoolLevel.createMany({
          data: dto.schoolLevelIds.map((schoolLevelId) => ({
            teacherProfileId: userId,
            schoolLevelId,
            isValidated: false,
          })),
        });
      } else {
        // RM-PAR-001 : profil minimum du Parent, actif sans validation admin.
        await tx.parentProfile.create({
          data: {
            id: userId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            city: dto.city,
            validatedAt: new Date(),
          },
        });
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: { roles: { push: dto.role } },
        select: { id: true, phone: true, status: true, roles: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'ROLE_ADDED',
          targetType: 'User',
          targetId: userId,
          newValues: { role: dto.role },
        },
      });

      return updated;
    });
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
