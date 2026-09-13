import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

/** RM-TPR-050 : tant que `TeacherProfile.status` n'a jamais atteint `VALIDATED`, aucun accès. */
const NEVER_VALIDATED_STATUSES = new Set(['DRAFT', 'PENDING_VALIDATION']);

/**
 * Avenant 01, Ch. J (décision #9), RM-TPR-050/051, ERR-TPR-050 : tant qu'un Professeur n'a jamais
 * été validé par un Administrateur (`TeacherProfile.status` jamais passé `VALIDATED`), il n'a accès
 * à AUCUNE fonctionnalité Professeur — ni lecture ni écriture. Seules les routes du profil
 * (`teacher-profile`, pour qu'il puisse le compléter) et de l'authentification (`auth`, déconnexion
 * incluse) restent accessibles : ces deux contrôleurs n'appliquent volontairement pas ce guard
 * (liste blanche par omission plutôt que par décorateur, cf. rapport du chantier).
 *
 * RM-TPR-054 (Ch.5.7/8.3, inchangé) : l'ajout d'une matière/d'un niveau non validé sur un profil
 * déjà validé ne fait JAMAIS repasser `TeacherProfile.status` à `PENDING_VALIDATION` (voir
 * `TeacherProfileService.addSubject`/`addSchoolLevel`, qui ne touchent que la ligne
 * `TeacherSubject`/`TeacherSchoolLevel` concernée) — seul le tout premier verrouillage est couvert
 * ici, jamais un reverrouillage global. `SUSPENDED` (Ch.5.7 : le statut du profil professionnel
 * suit celui du compte) prouve au contraire qu'une validation a bien eu lieu par le passé : ce
 * guard ne le bloque donc pas (le verrou d'abonnement/de compte est une préoccupation distincte,
 * cf. `SubscriptionGuard` et `JwtStrategy`, qui refuse déjà l'authentification d'un compte
 * `SUSPENDED`/`DISABLED`/`ARCHIVED` avant que ce guard ne soit atteint).
 *
 * S'utilise comme `SubscriptionGuard` : ajouté explicitement au `@UseGuards(...)` des contrôleurs
 * (ou méthodes) réservés au rôle `TEACHER`, APRÈS `JwtAuthGuard`/`RolesGuard` dans le même tableau
 * (même portée = ordre conservé, `request.user` est déjà peuplé). Ne s'applique jamais tout seul :
 * un utilisateur sans rôle `TEACHER` passe toujours (le filtrage par rôle reste `RolesGuard`).
 */
@Injectable()
export class TeacherValidatedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user: AuthenticatedUser = context.switchToHttp().getRequest().user;
    if (!user?.roles.includes('TEACHER')) {
      return true;
    }

    const profile = await this.prisma.teacherProfile.findUnique({
      where: { id: user.id },
      select: { status: true },
    });

    if (!profile || NEVER_VALIDATED_STATUSES.has(profile.status)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ERR-TPR-050',
        message: 'Compte Professeur en attente de validation (ERR-TPR-050)',
      });
    }
    return true;
  }
}
