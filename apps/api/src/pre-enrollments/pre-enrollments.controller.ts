import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PreEnrollmentsService } from './pre-enrollments.service';
import { CreatePreEnrollmentDto } from './dto/create-pre-enrollment.dto';
import { UpdatePreEnrollmentDto } from './dto/update-pre-enrollment.dto';
import { ProposePreEnrollmentDto } from './dto/propose-pre-enrollment.dto';
import { ListMineQueryDto } from './dto/list-mine-query.dto';
import { EligibleTeachersQueryDto } from './dto/eligible-teachers-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeacherValidatedGuard } from '../auth/guards/teacher-validated.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';

/** Ch.22 : `SubscriptionGuard` ne s'applique qu'au Professeur (`propose`) — no-op pour le Parent. */
@Controller('pre-enrollments')
@UseGuards(JwtAuthGuard, RolesGuard, TeacherValidatedGuard, SubscriptionGuard)
export class PreEnrollmentsController {
  constructor(private readonly service: PreEnrollmentsService) {}

  /** Avenant 01, Ch. D.4/RM-PAR-024 : Professeurs déjà rattachés/inscrits pour `query.studentId`. */
  @Get('eligible-teachers')
  @Roles(Role.PARENT)
  listEligibleTeachers(@CurrentUser() user: AuthenticatedUser, @Query() query: EligibleTeachersQueryDto) {
    return this.service.listEligibleTeachers(user.id, query.studentId, query);
  }

  /** Ch.11.5/6.6 : même route, comportement différent selon le rôle du compte connecté. */
  @Get('mine')
  @Roles(Role.PARENT, Role.TEACHER)
  listMine(@CurrentUser() user: AuthenticatedUser, @Query() query: ListMineQueryDto) {
    if (user.roles.includes(Role.TEACHER)) {
      return this.service.listMineForTeacher(user.id, query.academicYearId);
    }
    return this.service.listMineForParent(user.id);
  }

  @Post()
  @Roles(Role.PARENT)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePreEnrollmentDto) {
    return this.service.create(user.id, dto);
  }

  /** RM-PRE-031/ERR-PRE-018 : modification par le Parent tant qu'aucune proposition n'a été envoyée. */
  @Patch(':id')
  @Roles(Role.PARENT)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePreEnrollmentDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Post(':id/cancel')
  @Roles(Role.PARENT)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.cancel(user.id, id);
  }

  @Post(':id/confirm')
  @Roles(Role.PARENT)
  confirm(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.confirm(user.id, id);
  }

  @Post(':id/reject')
  @Roles(Role.PARENT)
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.reject(user.id, id);
  }

  @Post(':id/propose')
  @Roles(Role.TEACHER)
  propose(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ProposePreEnrollmentDto,
  ) {
    return this.service.propose(user.id, id, dto);
  }
}
