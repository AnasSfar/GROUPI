import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { GroupChangeService } from './group-change.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.12.12 : demandes de changement de groupe reçues par un groupe (le Professeur cible décide). */
@Controller('groups/:groupId/group-changes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class GroupGroupChangeController {
  constructor(private readonly service: GroupChangeService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Param('groupId') groupId: string) {
    return this.service.listForTeacherGroup(user.id, groupId);
  }
}
