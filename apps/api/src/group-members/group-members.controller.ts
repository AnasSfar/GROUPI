import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { GroupMembersService } from './group-members.service';
import { AssignGroupMembersDto } from './dto/assign-group-members.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeacherValidatedGuard } from '../auth/guards/teacher-validated.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';

/**
 * Avenant 01, Ch. C — affectation d'élèves de la salle d'attente à un groupe standard. Contrôleur
 * distinct de `GroupsController` (même convention que `group-sessions`/`group-enrollments`/
 * `group-accounting` : un sous-chemin `groups/:groupId/...` porté par son propre
 * module), pour ne pas toucher `groups.controller.ts` (chantiers parallèles sur ce fichier).
 */
@Controller('groups/:groupId/members')
@UseGuards(JwtAuthGuard, RolesGuard, TeacherValidatedGuard, SubscriptionGuard)
@Roles(Role.TEACHER)
export class GroupMembersController {
  constructor(private readonly service: GroupMembersService) {}

  @Post()
  assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Body() dto: AssignGroupMembersDto,
  ) {
    return this.service.assign(user.id, groupId, dto);
  }

  @Delete(':studentId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.remove(user.id, groupId, studentId);
  }
}
