import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/**
 * Ch.22 : feature-gating selon l'abonnement Professeur. Sur le modèle de `PermissionsGuard` — mais
 * ici la restriction ne porte que sur la création/modification (Ch.22.7) : la consultation (GET)
 * est toujours autorisée, et seul le rôle Professeur est concerné (RM-PERM-009 : Admin/Super Admin
 * jamais dépendants d'un abonnement ; Parent jamais concerné, RM-SUB-002). Ce filtrage en amont
 * permet de poser ce guard au niveau du contrôleur, y compris sur des routes mixtes Professeur/Parent,
 * sans jamais bloquer un appelant non concerné.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.method === 'GET') {
      return true;
    }

    const user: AuthenticatedUser = request.user;
    if (!user.roles.includes('TEACHER')) {
      return true;
    }

    await this.subscriptions.assertCanWrite(user.id);
    return true;
  }
}
