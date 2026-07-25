import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SchoolSituationService } from './school-situation.service';
import { RejectSituationDto } from './dto/reject-situation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.7.4 (dernier §) : validation admin des situations scolaires non automatiques. */
@Controller('admin/school-situations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminSchoolSituationController {
  constructor(private readonly service: SchoolSituationService) {}

  @Get('pending')
  @RequirePermissions('SCH_VALIDATE')
  listPending() {
    return this.service.listPending();
  }

  @Post(':id/validate')
  @RequirePermissions('SCH_VALIDATE')
  validate(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.validate(actor.id, id);
  }

  @Post(':id/reject')
  @RequirePermissions('SCH_VALIDATE')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectSituationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.reject(actor.id, id, dto.reason);
  }
}
