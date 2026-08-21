import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { EmailService } from '../email/email.service';
import { InviteAdministratorDto } from './dto/invite-administrator.dto';
import { PromoteAdministratorDto } from './dto/promote-administrator.dto';
import { AcceptAdministratorInvitationDto } from './dto/accept-administrator-invitation.dto';
import { UpdateAdministratorPermissionsDto } from './dto/update-administrator-permissions.dto';

interface ActionMeta {
  ipAddress?: string;
}

/** PERM-ACC-001 : créer/promouvoir un Administrateur n'est jamais délégable — Super Admin uniquement. */
@Injectable()
export class AdministratorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  /**
   * RM-CYC-022 : compte créé directement ACTIVE (pas de PENDING_VALIDATION — ce processus est
   * réservé à Professeur/Parent). Le mot de passe initial est aléatoire et inconnu de quiconque ;
   * l'invité ne peut se connecter qu'après avoir fixé le sien via le lien envoyé par e-mail.
   */
  async invite(actorUserId: string, dto: InviteAdministratorDto, meta: ActionMeta = {}) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cette adresse e-mail');
    }

    const unusablePasswordHash = await this.password.hash(randomBytes(32).toString('hex'));

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash: unusablePasswordHash,
          status: 'ACTIVE',
          roles: ['ADMIN'],
        },
      });

      await tx.administrator.create({
        data: {
          id: created.id,
          permissions: dto.permissions,
          createdById: actorUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'ADMINISTRATOR_INVITED',
          targetType: 'User',
          targetId: created.id,
          newValues: { email: created.email, permissions: dto.permissions },
          ipAddress: meta.ipAddress,
        },
      });

      return created;
    });

    await this.sendInvitationEmail(user.id, dto.email);

    return { id: user.id, email: user.email, status: user.status, permissions: dto.permissions };
  }

  /**
   * Ch.3.4 : promotion d'un compte Professeur/Parent existant vers le rôle Administrateur —
   * conserve le(s) rôle(s) déjà détenu(s) (`roles` est un tableau) et reprend le nom/téléphone
   * du profil existant plutôt que de les redemander.
   */
  async promote(actorUserId: string, targetUserId: string, dto: PromoteAdministratorDto, meta: ActionMeta = {}) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { teacherProfile: true, parentProfile: true, administrator: true },
    });
    if (!target) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    if (target.roles.includes('ADMIN') || target.roles.includes('SUPER_ADMIN')) {
      throw new BadRequestException('Ce compte est déjà Administrateur');
    }
    if (target.status !== 'ACTIVE') {
      throw new BadRequestException('Seul un compte actif peut être promu Administrateur');
    }

    const profile = target.teacherProfile ?? target.parentProfile;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: { roles: { push: 'ADMIN' } },
        select: { id: true, email: true, status: true, roles: true },
      });

      await tx.administrator.create({
        data: {
          id: targetUserId,
          permissions: dto.permissions,
          createdById: actorUserId,
          firstName: profile?.firstName,
          lastName: profile?.lastName,
          phone: profile?.phone,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'ADMINISTRATOR_PROMOTED',
          targetType: 'User',
          targetId: targetUserId,
          oldValues: { roles: target.roles },
          newValues: { roles: updated.roles, permissions: dto.permissions },
          ipAddress: meta.ipAddress,
        },
      });

      return updated;
    });
  }

  /**
   * RM-ACC-013 : les permissions d'un Administrateur restent modifiables après sa création
   * (contrairement à `invite`/`promote`, qui ne les fixent qu'une fois). RM-ACC-012 : un
   * Administrateur ne modifie jamais ses propres permissions — y compris le Super Administrateur
   * visé par erreur sur son propre compte.
   */
  async updatePermissions(
    actorUserId: string,
    targetUserId: string,
    dto: UpdateAdministratorPermissionsDto,
    meta: ActionMeta = {},
  ) {
    if (actorUserId === targetUserId) {
      throw new BadRequestException('Vous ne pouvez pas modifier vos propres permissions (RM-ACC-012)');
    }

    const administrator = await this.prisma.administrator.findUnique({ where: { id: targetUserId } });
    if (!administrator) {
      throw new NotFoundException('Administrateur introuvable');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.administrator.update({
        where: { id: targetUserId },
        data: { permissions: dto.permissions },
      });

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'ADMINISTRATOR_PERMISSIONS_UPDATED',
          targetType: 'User',
          targetId: targetUserId,
          oldValues: { permissions: administrator.permissions },
          newValues: { permissions: dto.permissions },
          ipAddress: meta.ipAddress,
        },
      });

      return updated;
    });
  }

  async acceptInvitation(dto: AcceptAdministratorInvitationDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);
    const invitation = await this.prisma.adminInvitationToken.findUnique({ where: { tokenHash } });

    if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) {
      throw new BadRequestException('Lien d’invitation invalide ou expiré');
    }

    const passwordHash = await this.password.hash(dto.password);

    await this.prisma.$transaction([
      this.prisma.adminInvitationToken.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: invitation.userId },
        data: { passwordHash },
      }),
      this.prisma.administrator.update({
        where: { id: invitation.userId },
        data: { firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone },
      }),
    ]);
  }

  private async sendInvitationEmail(userId: string, email: string): Promise<void> {
    const ttlMinutes = this.config.get<number>('ADMIN_INVITATION_TTL_MINUTES', 60 * 24 * 7);
    const rawToken = randomBytes(32).toString('hex');

    await this.prisma.adminInvitationToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
      },
    });

    await this.email.sendAdminInvitation(email, rawToken);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
