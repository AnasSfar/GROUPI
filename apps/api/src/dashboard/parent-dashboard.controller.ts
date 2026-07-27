import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.16.4 : tableau de bord du Parent — vue consolidée par enfant (PERM-DSH-004). */
@Controller('dashboard/parent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARENT)
export class ParentDashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getParentDashboard(user.id);
  }
}
