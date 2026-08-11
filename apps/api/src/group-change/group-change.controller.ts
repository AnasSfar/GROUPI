import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { GroupChangeService } from './group-change.service';
import { CreateGroupChangeRequestDto } from './dto/create-group-change-request.dto';
import { TeacherInitiateGroupChangeRequestDto } from './dto/teacher-initiate-group-change-request.dto';
import { AcceptGroupChangeRequestDto } from './dto/accept-group-change-request.dto';
import { RejectGroupChangeRequestDto } from './dto/reject-group-change-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';

/**
 * Ch.12.12/RM-CHG-002 : demandes de changement de groupe — initiées par le Parent (`create`) OU par
 * le Professeur (`teacher-initiate`). Décision par la partie qui n'a PAS initié la demande : le
 * Professeur pour une demande du Parent (`accept`/`reject`), le Parent pour une proposition du
 * Professeur (`confirm`/`decline`) — voir le commentaire de `GroupChangeService.teacherInitiate`.
 * Ch.22 : `SubscriptionGuard` ne s'applique qu'au Professeur (`teacher-initiate`/`accept`/`reject`) —
 * no-op pour le Parent.
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

  /** RM-CHG-002 (Ch.20.3) : le Professeur initie lui-même une demande pour un de ses élèves. */
  @Post('teacher-initiate')
  @Roles(Role.TEACHER)
  teacherInitiate(@CurrentUser() user: AuthenticatedUser, @Body() dto: TeacherInitiateGroupChangeRequestDto) {
    return this.service.teacherInitiate(user.id, dto);
  }

  /** RM-CHG-002/003 (Ch.20.3) : le Parent confirme une proposition émise par le Professeur. */
  @Post(':id/confirm')
  @Roles(Role.PARENT)
  confirmProposal(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.confirmTeacherProposal(user.id, id);
  }

  /** RM-CHG-002/003 (Ch.20.3) : le Parent décline une proposition émise par le Professeur. */
  @Post(':id/decline')
  @Roles(Role.PARENT)
  declineProposal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RejectGroupChangeRequestDto,
  ) {
    return this.service.declineTeacherProposal(user.id, id, dto);
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
