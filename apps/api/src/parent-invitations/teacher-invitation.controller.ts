import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ParentInvitationsService } from './parent-invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeacherValidatedGuard } from '../auth/guards/teacher-validated.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';

/**
 * Avenant 01, Ch. A.3.1 — espace « Inviter des parents » du Professeur. Ch. F/Ch. 22 : seule la
 * rotation est explicitement soumise au `SubscriptionGuard` (« génération/rotation... soumises » —
 * la génération elle-même reste lazy sur ce GET, toujours autorisé comme toute lecture, RM-INV-016
 * étant un point ouvert du Ch. H — voir le rapport). Désactivation/réactivation ne consomment ni
 * abonnement ni capacité, laissées hors `SubscriptionGuard`.
 */
@Controller('teacher/invitation')
@UseGuards(JwtAuthGuard, RolesGuard, TeacherValidatedGuard)
@Roles(Role.TEACHER)
export class TeacherInvitationController {
  constructor(private readonly service: ParentInvitationsService) {}

  /** RM-INV-001 : génère à la volée si absent et Professeur `VALIDATED`. */
  @Get()
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getOrCreateMine(user.id);
  }

  @Post('rotate')
  @UseGuards(SubscriptionGuard)
  rotate(@CurrentUser() user: AuthenticatedUser) {
    return this.service.rotate(user.id);
  }

  @Post('disable')
  disable(@CurrentUser() user: AuthenticatedUser) {
    return this.service.setEnabled(user.id, false);
  }

  @Post('enable')
  enable(@CurrentUser() user: AuthenticatedUser) {
    return this.service.setEnabled(user.id, true);
  }
}
