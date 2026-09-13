import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ParentInvitationsService } from './parent-invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AcceptParentInvitationDto } from './dto/accept-parent-invitation.dto';

function requestMeta(req: any) {
  return {
    ipAddress: req.ip as string | undefined,
    userAgent: req.headers['user-agent'] as string | undefined,
  };
}

/**
 * Avenant 01, Ch. A.3.2/A.3.3 — page de consultation et de consommation du lien d'invitation, sans
 * authentification préalable (RM-INV-008). `@UseGuards(JwtAuthGuard)` au niveau du contrôleur suit le
 * même schéma que `ReferentialsController` (routes publiques explicitement marquées `@Public()`) ;
 * `accept()` ajoute `OptionalJwtAuthGuard` pour reconnaître un Parent déjà connecté (cas 2) sans
 * jamais bloquer un visiteur anonyme (cas 1).
 */
@Controller('public/invitations')
@UseGuards(JwtAuthGuard)
export class PublicInvitationsController {
  constructor(private readonly service: ParentInvitationsService) {}

  // Déclarée avant `:token` : sinon Nest matcherait "phone-check" comme valeur de `:token`.
  @Get('phone-check')
  @Public()
  checkPhone(@Query('phone') phone: string) {
    return this.service.checkPhoneExists(phone);
  }

  @Get(':token')
  @Public()
  preview(@Param('token') token: string) {
    return this.service.getPublicPreview(token);
  }

  @Post(':token/accept')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  accept(
    @Param('token') token: string,
    @Body() dto: AcceptParentInvitationDto,
    @Req() req: any,
  ) {
    const currentUser: AuthenticatedUser | undefined = req.user;
    return this.service.accept(token, dto, currentUser, requestMeta(req));
  }
}
