import { Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/**
 * RM-SES-036 : déverrouillage exceptionnel d'une séance VERROUILLEE — réservé au Super Administrateur,
 * obligatoirement historisé (`SESSION_UNLOCKED_ADMIN`). Pas de `SubscriptionGuard` ici : les droits
 * d'un Super Admin ne dépendent jamais d'un abonnement Professeur (RM-PERM-009).
 */
@Controller('admin/sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminSessionsController {
  constructor(private readonly service: SessionsService) {}

  @Patch(':id/unlock')
  unlock(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.unlockAdmin(user.id, id);
  }
}
