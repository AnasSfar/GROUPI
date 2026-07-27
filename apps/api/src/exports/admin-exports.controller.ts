import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ExportType } from '@prisma/client';
import { ExportsService } from './exports.service';
import { CreateAdminExportDto } from './dto/create-admin-export.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/**
 * Ch.17.4/PERM-EXP-001/002 : exports Administrateur (statistiques agrégées uniquement) et
 * Super Admin (tout type, toute portée). Le téléchargement reste sur `GET /exports/:id/download`
 * (générique, RM-EXP-015) — un Admin est un utilisateur comme un autre pour cette partie-là.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminExportsController {
  constructor(private readonly service: ExportsService) {}

  @Post('exports')
  @RequirePermissions('EXP_EXPORT_DATA')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAdminExportDto) {
    return this.service.requestAdminExport(user, dto);
  }

  /** PERM-EXP-002 : journal des exports — Super Admin toujours, Admin si `EXP_VIEW_JOURNAL`. */
  @Get('exports/journal')
  @RequirePermissions('EXP_VIEW_JOURNAL')
  journal(@Query('userId') userId?: string, @Query('type') type?: ExportType) {
    return this.service.listJournal({ userId, type });
  }
}
