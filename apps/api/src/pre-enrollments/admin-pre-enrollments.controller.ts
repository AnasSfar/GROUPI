import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PreEnrollmentsService } from './pre-enrollments.service';
import { AdminListPreEnrollmentsQueryDto } from './dto/admin-list-pre-enrollments-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

/**
 * RM-PRE-029 : consultation Administrateur de l'ensemble des préinscriptions. Aucun code de
 * permission dédié au domaine PRE n'existe dans ce projet (Annexe I) — réutilise `ACC_VALIDATE`
 * (même principe que les autres consultations administratives transverses, ex.
 * `AdminSchoolSituationController`).
 */
@Controller('admin/pre-enrollments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminPreEnrollmentsController {
  constructor(private readonly service: PreEnrollmentsService) {}

  @Get()
  @RequirePermissions('ACC_VALIDATE')
  list(@Query() query: AdminListPreEnrollmentsQueryDto) {
    return this.service.listAllForAdmin(query);
  }
}
