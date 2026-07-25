import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AccountLifecycleService } from './account-lifecycle.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { AccountActionDto } from './dto/account-action.dto';
import { ReactivateAccountDto } from './dto/reactivate-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly lifecycle: AccountLifecycleService) {}

  @Get()
  @RequirePermissions('ACC_VALIDATE')
  list(@Query() query: ListUsersQueryDto) {
    return this.lifecycle.listUsers(query.status);
  }

  @Post(':id/validate')
  @RequirePermissions('ACC_VALIDATE')
  validate(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser, @Req() req: any) {
    return this.lifecycle.transition(actor.id, id, 'ACTIVE', 'Validation du compte', undefined, {
      ipAddress: req.ip,
    });
  }

  @Post(':id/suspend')
  @RequirePermissions('ACC_SUSPEND')
  suspend(
    @Param('id') id: string,
    @Body() dto: AccountActionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: any,
  ) {
    return this.lifecycle.transition(actor.id, id, 'SUSPENDED', dto.reason, dto.comment, {
      ipAddress: req.ip,
    });
  }

  @Post(':id/reactivate')
  @RequirePermissions('ACC_REACTIVATE')
  reactivate(
    @Param('id') id: string,
    @Body() dto: ReactivateAccountDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: any,
  ) {
    return this.lifecycle.transition(
      actor.id,
      id,
      'ACTIVE',
      dto.reason ?? 'Réactivation du compte',
      dto.comment,
      { ipAddress: req.ip },
    );
  }

  @Post(':id/disable')
  @RequirePermissions('ACC_DISABLE')
  disable(
    @Param('id') id: string,
    @Body() dto: AccountActionDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: any,
  ) {
    return this.lifecycle.transition(actor.id, id, 'DISABLED', dto.reason, dto.comment, {
      ipAddress: req.ip,
    });
  }
}
