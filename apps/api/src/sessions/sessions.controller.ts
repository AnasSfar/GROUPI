import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SessionsService } from './sessions.service';
import { PostponeSessionDto } from './dto/postpone-session.dto';
import { SetTeachingModeDto } from './dto/set-teaching-mode.dto';
import { UpdateSessionCommentDto } from './dto/update-session-comment.dto';
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

  /** Ch.13.6 : passage exceptionnel du mode d'enseignement — ne modifie jamais le mode habituel du groupe. */
  @Patch(':id/teaching-mode')
  setTeachingMode(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SetTeachingModeDto,
  ) {
    return this.service.setTeachingMode(user.id, id, dto);
  }

  /** RM-SES-041 : commentaire pédagogique de la séance. */
  @Patch(':id/comment')
  setComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSessionCommentDto,
  ) {
    return this.service.setComment(user.id, id, dto);
  }
}
