import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EnrollmentsService } from './enrollments.service';
import { AcceptEnrollmentDto } from './dto/accept-enrollment.dto';
import { RejectEnrollmentDto } from './dto/reject-enrollment.dto';
import { UpdateEnrollmentPriceDto } from './dto/update-enrollment-price.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.12 : vue Professeur — décision, tarification et cycle de vie des inscriptions d'un groupe qu'il possède. */
@Controller('groups/:groupId/enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class GroupEnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Param('groupId') groupId: string) {
    return this.service.listByGroup(user.id, groupId);
  }

  @Post(':id/accept')
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Body() dto: AcceptEnrollmentDto,
  ) {
    return this.service.accept(user.id, groupId, id, dto);
  }

  @Post(':id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Body() dto: RejectEnrollmentDto,
  ) {
    return this.service.reject(user.id, groupId, id, dto);
  }

  @Patch(':id')
  updatePrice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentPriceDto,
  ) {
    return this.service.updatePrice(user.id, groupId, id, dto);
  }

  @Post(':id/suspend')
  suspend(@CurrentUser() user: AuthenticatedUser, @Param('groupId') groupId: string, @Param('id') id: string) {
    return this.service.suspend(user.id, groupId, id);
  }

  @Post(':id/reactivate')
  reactivate(@CurrentUser() user: AuthenticatedUser, @Param('groupId') groupId: string, @Param('id') id: string) {
    return this.service.reactivate(user.id, groupId, id);
  }

  @Post(':id/archive')
  archive(@CurrentUser() user: AuthenticatedUser, @Param('groupId') groupId: string, @Param('id') id: string) {
    return this.service.archive(user.id, groupId, id);
  }
}
