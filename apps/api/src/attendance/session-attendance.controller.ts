import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { SetAttendanceDto } from './dto/set-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';

/** Ch.14 : saisie et validation des présences d'une séance — Professeur propriétaire uniquement. */
@Controller('sessions/:sessionId/attendance')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Roles(Role.TEACHER)
export class SessionAttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Param('sessionId') sessionId: string) {
    return this.service.list(user.id, sessionId);
  }

  @Put(':studentId')
  setOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
    @Param('studentId') studentId: string,
    @Body() dto: SetAttendanceDto,
  ) {
    return this.service.setOne(user.id, sessionId, studentId, dto);
  }

  /** EVT-ATT-018 : remet une présence à NON_RENSEIGNEE, uniquement avant validation définitive. */
  @Delete(':studentId')
  reset(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.reset(user.id, sessionId, studentId);
  }

  /** Ch.14.3/RM-ATT-027 : validation définitive — bascule la séance en TERMINEE (COMPLETED). */
  @Post('validate')
  validate(@CurrentUser() user: AuthenticatedUser, @Param('sessionId') sessionId: string) {
    return this.service.validate(user.id, sessionId);
  }
}
