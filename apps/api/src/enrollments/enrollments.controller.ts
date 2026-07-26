import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.12 : vue Parent — demande, consultation et annulation de ses propres inscriptions. */
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Post()
  @Roles(Role.PARENT)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEnrollmentDto) {
    return this.service.create(user.id, dto);
  }

  @Get('mine')
  @Roles(Role.PARENT)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMine(user.id);
  }

  @Post(':id/cancel')
  @Roles(Role.PARENT)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.cancel(user.id, id);
  }
}
