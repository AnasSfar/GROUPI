import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PreEnrollmentsService } from './pre-enrollments.service';
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
}
