import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SchoolSituationService } from './school-situation.service';
import { RequestSituationUpdateDto } from './dto/request-situation-update.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('parent-profile/me/students/:studentId/situations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARENT)
export class SchoolSituationController {
  constructor(private readonly service: SchoolSituationService) {}

  @Get()
  history(@CurrentUser() user: AuthenticatedUser, @Param('studentId') studentId: string) {
    return this.service.listHistory(user.id, studentId);
  }

  @Post()
  requestUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Body() dto: RequestSituationUpdateDto,
  ) {
    return this.service.requestUpdate(user.id, studentId, dto);
  }
}
