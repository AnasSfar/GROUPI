import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.15.11 : vue Parent consolidée par enfant — groupes suivis, professeur, matière, tarif, solde. */
@Controller('parent/children/:studentId/accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARENT)
export class ParentAccountingController {
  constructor(private readonly service: AccountingService) {}

  @Get()
  getSummary(@CurrentUser() user: AuthenticatedUser, @Param('studentId') studentId: string) {
    return this.service.getParentChildSummary(user.id, studentId);
  }
}
