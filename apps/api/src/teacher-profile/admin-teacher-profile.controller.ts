import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TeacherProfileService } from './teacher-profile.service';
import { RejectPendingItemDto } from './dto/reject-pending-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { LevelPoolsService } from '../level-pools/level-pools.service';

/**
 * Ch.5.7, RM-TPR-003/004 : validation admin des matières/niveaux ajoutés à un profil professeur déjà
 * validé — ne touche jamais aux autres matières/niveaux ni au statut global du profil (RM-TPR-005),
 * contrairement à la validation initiale du compte (apps/api/src/admin, hors périmètre de ce module).
 */
@Controller('admin/teacher-profiles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminTeacherProfileController {
  constructor(
    private readonly service: TeacherProfileService,
    // Avenant 01, RM-POOL-001/B.3 : hook déclenché ici plutôt que dans `TeacherProfileService`, pour
    // ne jamais ajouter de dépendance à `LevelPoolsService` sur l'instance de `TeacherProfileService`
    // fournie directement par `AuthModule` (cf. son commentaire "évite un cycle AuthModule <->
    // TeacherProfileModule") — voir le rapport de ce chantier.
    private readonly levelPools: LevelPoolsService,
  ) {}

  @Get('pending-items')
  @RequirePermissions('TPR_VALIDATE')
  listPendingItems() {
    return this.service.listPendingItems();
  }

  @Post(':teacherProfileId/subjects/:subjectId/validate')
  @RequirePermissions('TPR_VALIDATE')
  validateSubject(
    @Param('teacherProfileId') teacherProfileId: string,
    @Param('subjectId') subjectId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.validatePendingSubject(actor.id, teacherProfileId, subjectId);
  }

  @Post(':teacherProfileId/subjects/:subjectId/reject')
  @RequirePermissions('TPR_VALIDATE')
  rejectSubject(
    @Param('teacherProfileId') teacherProfileId: string,
    @Param('subjectId') subjectId: string,
    @Body() dto: RejectPendingItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.rejectPendingSubject(actor.id, teacherProfileId, subjectId, dto.reason);
  }

  /** RM-POOL-001/B.3 : la validation d'un niveau enseigné crée, s'il n'existe pas, le groupe de
   *  niveau correspondant pour chaque année académique `OPEN` — jamais bloquant pour la validation. */
  @Post(':teacherProfileId/school-levels/:schoolLevelId/validate')
  @RequirePermissions('TPR_VALIDATE')
  async validateSchoolLevel(
    @Param('teacherProfileId') teacherProfileId: string,
    @Param('schoolLevelId') schoolLevelId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const updated = await this.service.validatePendingSchoolLevel(actor.id, teacherProfileId, schoolLevelId);
    await this.levelPools.ensureGroupsForValidatedLevel(teacherProfileId, schoolLevelId);
    return updated;
  }

  @Post(':teacherProfileId/school-levels/:schoolLevelId/reject')
  @RequirePermissions('TPR_VALIDATE')
  rejectSchoolLevel(
    @Param('teacherProfileId') teacherProfileId: string,
    @Param('schoolLevelId') schoolLevelId: string,
    @Body() dto: RejectPendingItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.service.rejectPendingSchoolLevel(actor.id, teacherProfileId, schoolLevelId, dto.reason);
  }
}
