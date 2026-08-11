import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PreEnrollmentsService } from './pre-enrollments.service';
import { SetPreEnrollmentsOpenDto } from './dto/set-pre-enrollments-open.dto';
import { ProposeAllPreEnrollmentsDto } from './dto/propose-all-pre-enrollments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/**
 * Ch.11.7, RM-PRE-008 : recherche automatique des préinscriptions compatibles à la
 * création/consultation d'un groupe. Route sous /groups/ (et non /pre-enrollments/) pour rester
 * cohérente avec le référentiel — implémentée dans ce module pour ne pas dépendre de
 * apps/api/src/groups/ (module d'un autre agent en parallèle) : la propriété du groupe est
 * revérifiée directement via Prisma, sans importer GroupsService.
 *
 * Regroupe aussi, pour la même raison (rester sous /groups/ sans dépendre de GroupsController,
 * hors périmètre) : l'ouverture/fermeture des préinscriptions d'un groupe (RM-PRE-005/015) et
 * l'envoi groupé des propositions à toutes les préinscriptions compatibles (RM-PRE-008/009/010).
 */
@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupCompatiblePreEnrollmentsController {
  constructor(private readonly service: PreEnrollmentsService) {}

  @Get(':groupId/compatible-pre-enrollments')
  @Roles(Role.TEACHER)
  listCompatible(@CurrentUser() user: AuthenticatedUser, @Param('groupId') groupId: string) {
    return this.service.listCompatibleForGroup(user.id, groupId);
  }

  /** RM-PRE-008/009/010 : envoi en un clic à toutes les préinscriptions compatibles trouvées. */
  @Post(':groupId/compatible-pre-enrollments/propose-all')
  @Roles(Role.TEACHER)
  proposeAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Body() dto: ProposeAllPreEnrollmentsDto,
  ) {
    return this.service.proposeAllForGroup(user.id, groupId, dto.expiresAt);
  }

  /** RM-PRE-005/015, PERM-PRE-006 : le Professeur ouvre/ferme les préinscriptions de ce groupe. */
  @Patch(':id/pre-enrollments-open')
  @Roles(Role.TEACHER)
  setPreEnrollmentsOpen(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SetPreEnrollmentsOpenDto,
  ) {
    return this.service.setPreEnrollmentsOpen(user.id, id, dto.open);
  }
}
