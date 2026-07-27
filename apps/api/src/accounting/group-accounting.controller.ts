import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.15.12.3 : indicateurs financiers agrégés sur les inscriptions d'un groupe possédé par le Professeur. */
@Controller('groups/:groupId/accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class GroupAccountingController {
  constructor(private readonly service: AccountingService) {}

  @Get('indicators')
  getIndicators(@CurrentUser() user: AuthenticatedUser, @Param('groupId') groupId: string) {
    return this.service.getGroupIndicators(user.id, groupId);
  }
}
