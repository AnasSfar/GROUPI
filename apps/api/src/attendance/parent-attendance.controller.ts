import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.14.2 : le Parent consulte l'historique de présence de son enfant (lecture seule). */
@Controller('parent/children/:studentId/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARENT)
export class ParentAttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser, @Param('studentId') studentId: string) {
    return this.service.getStudentAttendanceForParent(user.id, studentId);
  }
}
