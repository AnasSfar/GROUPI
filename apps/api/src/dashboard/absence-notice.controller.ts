import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AbsenceNoticeService } from './absence-notice.service';
import { CreateAbsenceNoticeDto } from './dto/create-absence-notice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.16.4 : signalement d'absence prévisible depuis le tableau de bord Parent. */
@Controller('sessions/:sessionId/absence-notices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AbsenceNoticeController {
  constructor(private readonly service: AbsenceNoticeService) {}

  @Post()
  @Roles(Role.PARENT)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateAbsenceNoticeDto,
  ) {
    return this.service.create(user.id, sessionId, dto);
  }

  @Get()
  @Roles(Role.TEACHER)
  list(@CurrentUser() user: AuthenticatedUser, @Param('sessionId') sessionId: string) {
    return this.service.listForSession(user.id, sessionId);
  }
}
