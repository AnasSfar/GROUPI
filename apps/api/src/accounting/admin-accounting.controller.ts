import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateAdminAdjustmentDto } from './dto/create-admin-adjustment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** RM-CPT-020 : ajustement administratif exceptionnel, hors délai des 48h ou sur un compte verrouillé. */
@Controller('admin/accounting/enrollments/:enrollmentId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminAccountingController {
  constructor(private readonly service: AccountingService) {}

  @Post('admin-adjustments')
  @RequirePermissions('CPT_ADMIN_ADJUST')
  createAdminAdjustment(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: CreateAdminAdjustmentDto,
  ) {
    return this.service.createAdminAdjustment(actor.id, enrollmentId, dto);
  }
}
