import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { InviteAdministratorDto } from './dto/invite-administrator.dto';
import { PromoteAdministratorDto } from './dto/promote-administrator.dto';
import { AcceptAdministratorInvitationDto } from './dto/accept-administrator-invitation.dto';
import { UpdateAdministratorPermissionsDto } from './dto/update-administrator-permissions.dto';

interface ActionMeta {
  ipAddress?: string;
}

/**
 * PERM-ACC-001 : créer/promouvoir un Administrateur n'est jamais délégable — Super Admin uniquement.
 *
 * Avenant 01, Ch. H.4 (point laissé ouvert) : l'e-mail est entièrement retiré du produit
 * (RM-SEC-052), mais l'invitation d'un Administrateur restait, en V1.0, fondée sur un envoi
 * d'e-mail (`EmailService.sendAdminInvitation`, supprimé avec le module `email/`). Le produit doit
 * encore trancher entre (a) un lien partagé hors bande par le Super Administrateur lui-même
 * (retenu ici a minima, par symétrie avec la réinitialisation assistée de mot de passe, Ch. I.3) ou
 * (b) une création directe avec mot de passe temporaire. `InviteAdministratorDto.email` reste donc
 * en l'état (hors périmètre de ce chantier, Ch. I ne couvre que Professeur/Parent) : `invite()` ne
 * l'utilise plus pour délivrer quoi que ce soit, il ne fait plus que renvoyer l'URL d'invitation à
 * transmettre manuellement — ne pas prendre ce choix minimal pour une décision produit actée.
 */
@Injectable()
export class AdministratorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly config: ConfigService,
  ) {}

  /**
   * RM-CYC-022 : compte créé directement ACTIVE (pas de PENDING_VALIDATION — ce processus est
   * réservé à Professeur/Parent). Le mot de passe initial est aléatoire et inconnu de quiconque ;
   * l'invité ne peut se connecter qu'après avoir fixé le sien via le lien d'invitation retourné ici
   * (Ch. H.4 : transmission hors bande par le Super Administrateur, plus d'envoi automatique).
   */
  async invite(actorUserId: string, dto: InviteAdministratorDto, meta: ActionMeta = {}) {
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email } });
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

    const invitationUrl = await this.createInvitationToken(user.id);

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      permissions: dto.permissions,
      invitationUrl,
    };
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

  /**
   * Ch. H.4 (point ouvert, non tranché) : ne fait plus qu'émettre le jeton et renvoyer l'URL à
   * transmettre hors bande par le Super Administrateur — plus d'envoi automatique (module `email/`
   * retiré). Note : la page frontend `/admin/accept-invitation` référencée ici n'existe pas encore
   * (lacune préexistante, hors périmètre de ce chantier).
   */
  private async createInvitationToken(userId: string): Promise<string> {
    const ttlMinutes = this.config.get<number>('ADMIN_INVITATION_TTL_MINUTES', 60 * 24 * 7);
    const rawToken = randomBytes(32).toString('hex');

    await this.prisma.adminInvitationToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
      },
    });

    const baseUrl = this.config.get<string>('PUBLIC_APP_URL') ?? this.config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';
    return `${baseUrl}/admin/accept-invitation?token=${rawToken}`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
