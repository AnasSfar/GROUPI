import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  tokenVersion: number;
}

export interface AuthenticatedUser {
  id: string;
  /** RM-SEC-001 : nullable — au moins l'un de `email`/`phone` est renseigné, jamais les deux à coup sûr. */
  email: string | null;
  phone: string | null;
  roles: string[];
  status: string;
  administratorPermissions: string[] | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
}

/**
 * RM-SEC-024 : toute authentification vérifie l'état du compte.
 * RM-SEC-017/019/030 : une invalidation globale doit être immédiate — un JWT signé ne peut pas
 * être révoqué avant expiration, donc on recharge l'utilisateur et on compare `tokenVersion`
 * à chaque requête authentifiée plutôt que de faire confiance au seul contenu du token.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { administrator: true },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Session invalide');
    }
    if (user.deletedAt || user.status === 'SUSPENDED' || user.status === 'DISABLED' || user.status === 'ARCHIVED') {
      throw new UnauthorizedException('Compte non accessible');
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      status: user.status,
      administratorPermissions: user.administrator?.permissions ?? null,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
    };
  }
}
