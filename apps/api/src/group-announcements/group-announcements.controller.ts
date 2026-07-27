import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { GroupAnnouncementsService } from './group-announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';

/**
 * Ch.19.4 : annonces de groupe, Professeur -> Parents (RM-COM-009/010).
 * Ch.22 : `SubscriptionGuard` ne s'applique qu'au Professeur (création/modification) — no-op pour le Parent.
 */
@Controller('groups/:groupId/announcements')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
export class GroupAnnouncementsController {
  constructor(private readonly service: GroupAnnouncementsService) {}

  /** Même route, comportement différent selon le rôle (cf. PreEnrollmentsController.listMine). */
  @Get()
  @Roles(Role.TEACHER, Role.PARENT)
  list(@CurrentUser() user: AuthenticatedUser, @Param('groupId') groupId: string) {
    if (user.roles.includes(Role.TEACHER)) {
      return this.service.listForTeacher(user.id, groupId);
    }
    return this.service.listForParent(user.id, groupId);
  }

  @Post()
  @Roles(Role.TEACHER)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.service.createForGroup(user.id, groupId, dto);
  }

  @Patch(':id')
  @Roles(Role.TEACHER)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @Roles(Role.TEACHER)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }

  @Post(':id/read')
  @Roles(Role.PARENT)
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.markRead(user.id, id);
  }
}
