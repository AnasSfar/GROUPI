import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SessionsService } from './sessions.service';
import { PostponeSessionDto } from './dto/postpone-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';

/** Ch.13 : opérations sur une séance individuelle — Professeur propriétaire du groupe uniquement. */
@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Roles(Role.TEACHER)
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  /** Ch.13.3/13.8 : annule la séance initiale et en crée une nouvelle à la date choisie. */
  @Post(':id/postpone')
  postpone(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: PostponeSessionDto,
  ) {
    return this.service.postpone(user.id, id, dto);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.cancel(user.id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
