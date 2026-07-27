import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { AttendanceStatsQueryDto } from './dto/attendance-stats-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.14.9/14.10/14.11 : statistiques, alertes d'abandon et registre — vue Professeur, à l'échelle du groupe. */
@Controller('groups/:groupId/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class GroupAttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get('stats')
  stats(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Query() query: AttendanceStatsQueryDto,
  ) {
    return this.service.getGroupStats(user.id, groupId, query.period ?? 'GROUP');
  }

  @Get('abandonment-alerts')
  abandonmentAlerts(@CurrentUser() user: AuthenticatedUser, @Param('groupId') groupId: string) {
    return this.service.getAbandonmentAlerts(user.id, groupId);
  }

  @Get('register')
  register(@CurrentUser() user: AuthenticatedUser, @Param('groupId') groupId: string) {
    return this.service.getRegister(user.id, groupId);
  }
}
