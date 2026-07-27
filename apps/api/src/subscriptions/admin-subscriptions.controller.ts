import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { SuspendSubscriptionDto } from './dto/suspend-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.21 : gestion administrative des abonnements — validation de paiement, suspension, réactivation. */
@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminSubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get()
  @RequirePermissions('ABO_VALIDATE')
  list(@Query() query: ListSubscriptionsQueryDto) {
    return this.service.listAll(query.status);
  }

  @Post(':id/validate-payment')
  @RequirePermissions('ABO_VALIDATE')
  validatePayment(@CurrentUser() actor: AuthenticatedUser, @Param('id') id: string) {
    return this.service.validatePayment(actor.id, id);
  }

  @Post(':id/suspend')
  @RequirePermissions('ABO_SUSPEND')
  suspend(@CurrentUser() actor: AuthenticatedUser, @Param('id') id: string, @Body() dto: SuspendSubscriptionDto) {
    return this.service.suspend(actor.id, id, dto);
  }

  @Post(':id/reactivate')
  @RequirePermissions('ABO_REACTIVATE')
  reactivate(@CurrentUser() actor: AuthenticatedUser, @Param('id') id: string) {
    return this.service.reactivate(actor.id, id);
  }
}
