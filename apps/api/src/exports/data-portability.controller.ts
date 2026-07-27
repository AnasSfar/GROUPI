import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { FulfillDataPortabilityDto } from './dto/fulfill-data-portability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.17.4 dernier §/EVT-EXP-008 : portabilité RGPD — accessible à tout utilisateur authentifié. */
@Controller('data-portability-requests')
@UseGuards(JwtAuthGuard)
export class DataPortabilityController {
  constructor(private readonly service: ExportsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser) {
    return this.service.requestDataPortability(user.id);
  }

  @Get('me')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMyDataPortabilityRequests(user.id);
  }
}

/** Traitement par un Administrateur (17.4 : "sous 30 jours") — même permission que l'export lui-même. */
@Controller('admin/data-portability-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('EXP_EXPORT_DATA')
export class AdminDataPortabilityController {
  constructor(private readonly service: ExportsService) {}

  @Get()
  listQueue() {
    return this.service.listDataPortabilityQueue();
  }

  @Post(':id/fulfill')
  fulfill(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: FulfillDataPortabilityDto) {
    return this.service.fulfillDataPortabilityRequest(user.id, id, dto.format ?? 'CSV');
  }
}
