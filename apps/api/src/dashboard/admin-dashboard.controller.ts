import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/**
 * Ch.16.5/16.6 : tableaux de bord Administrateur/Super Administrateur (PERM-DSH-001/002) et accès
 * en lecture seule au tableau de bord d'un autre utilisateur, réservé au Super Admin (RM-DSH-008).
 * ERR-DSH-005 (accès à un tableau de bord sans autorisation) est couvert par `RolesGuard` — un
 * Professeur/Parent qui tente `/dashboard/admin` ou `/dashboard/users/:id` reçoit un 403 générique.
 */
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminDashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('admin')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getAdmin(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getAdminDashboard(user);
  }

  @Get('super-admin')
  @Roles(Role.SUPER_ADMIN)
  getSuperAdmin() {
    return this.service.getSuperAdminDashboard();
  }

  @Get('users/:userId')
  @Roles(Role.SUPER_ADMIN)
  getUserDashboard(@Param('userId') userId: string) {
    return this.service.getUserDashboard(userId);
  }
}
