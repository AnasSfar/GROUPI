import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.15.12.2 : indicateurs financiers agrégés sur l'ensemble des inscriptions du Professeur. */
@Controller('teacher/accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class TeacherAccountingController {
  constructor(private readonly service: AccountingService) {}

  @Get('indicators')
  getIndicators(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getTeacherIndicators(user.id);
  }
}
