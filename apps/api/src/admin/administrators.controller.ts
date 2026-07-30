import { Body, Controller, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AdministratorsService } from './administrators.service';
import { InviteAdministratorDto } from './dto/invite-administrator.dto';
import { PromoteAdministratorDto } from './dto/promote-administrator.dto';
import { AcceptAdministratorInvitationDto } from './dto/accept-administrator-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('admin/administrators')
export class AdministratorsController {
  constructor(private readonly administrators: AdministratorsService) {}

  /** PERM-ACC-001 : jamais délégable, contrairement aux permissions ACC_* — Super Admin uniquement. */
  @Post('invite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  invite(@Body() dto: InviteAdministratorDto, @CurrentUser() actor: AuthenticatedUser, @Req() req: any) {
    return this.administrators.invite(actor.id, dto, { ipAddress: req.ip });
  }

  @Post(':userId/promote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  promote(
    @Param('userId') userId: string,
    @Body() dto: PromoteAdministratorDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: any,
  ) {
    return this.administrators.promote(actor.id, userId, dto, { ipAddress: req.ip });
  }

  /** Public : atteint uniquement via le lien reçu par e-mail, pas de session requise pour l'utiliser. */
  @Post('accept-invitation')
  @HttpCode(204)
  acceptInvitation(@Body() dto: AcceptAdministratorInvitationDto) {
    return this.administrators.acceptInvitation(dto);
  }
}
