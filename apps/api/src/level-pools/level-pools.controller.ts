import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { LevelPoolsService } from './level-pools.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeacherValidatedGuard } from '../auth/guards/teacher-validated.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/**
 * Avenant 01, Ch. B — « Salles d'attente » : consultation et retrait uniquement (création/archivage
 * exclusivement automatiques, RM-POOL-001/006/ERR-POOL-006). Consultation toujours autorisée sans
 * `SubscriptionGuard` (Ch. F : seules la rotation du lien d'invitation et l'affectation en sont
 * soumises).
 */
@Controller('teacher/level-pools')
@UseGuards(JwtAuthGuard, RolesGuard, TeacherValidatedGuard)
@Roles(Role.TEACHER)
export class LevelPoolsController {
  constructor(private readonly service: LevelPoolsService) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMineGroupedByLevel(user.id);
  }

  @Get(':id/members')
  listMembers(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.listMembers(user.id, id);
  }

  /** RM-POOL-007/ERR-POOL-004 : autorisé même si l'élève a une inscription active (avertissement). */
  @Delete(':id/members/:studentId')
  removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.service.removeMember(user.id, id, studentId, user.id);
  }
}
