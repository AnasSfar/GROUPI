import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { GroupChangeService } from './group-change.service';
import { CreateGroupChangeRequestDto } from './dto/create-group-change-request.dto';
import { AcceptGroupChangeRequestDto } from './dto/accept-group-change-request.dto';
import { RejectGroupChangeRequestDto } from './dto/reject-group-change-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';

/**
 * Ch.12.12 : demandes de changement de groupe — création/consultation (Parent), décision (Professeur).
 * Ch.22 : `SubscriptionGuard` ne s'applique qu'au Professeur (accept/reject) — no-op pour le Parent.
 */
@Controller('group-changes')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
export class GroupChangeController {
  constructor(private readonly service: GroupChangeService) {}

  @Post()
  @Roles(Role.PARENT)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGroupChangeRequestDto) {
    return this.service.create(user.id, dto);
  }

  @Get('mine')
  @Roles(Role.PARENT)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMineForParent(user.id);
  }

  @Post(':id/cancel')
  @Roles(Role.PARENT)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.cancel(user.id, id);
  }

  @Post(':id/accept')
  @Roles(Role.TEACHER)
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AcceptGroupChangeRequestDto,
  ) {
    return this.service.accept(user.id, id, dto);
  }

  @Post(':id/reject')
  @Roles(Role.TEACHER)
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectGroupChangeRequestDto,
  ) {
    return this.service.reject(user.id, id, dto);
  }
}
