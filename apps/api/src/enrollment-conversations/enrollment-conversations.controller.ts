import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EnrollmentConversationsService } from './enrollment-conversations.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';

/**
 * Ch.19.3 : fil de commentaires privé d'une inscription (Professeur du groupe / Parent de l'élève).
 * Ch.22 : `SubscriptionGuard` ne s'applique qu'au Professeur (création/modification) — no-op pour le Parent.
 */
@Controller('enrollments/:enrollmentId/comments')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
export class EnrollmentConversationsController {
  constructor(private readonly service: EnrollmentConversationsService) {}

  @Get()
  @Roles(Role.TEACHER, Role.PARENT, Role.SUPER_ADMIN)
  list(@CurrentUser() user: AuthenticatedUser, @Param('enrollmentId') enrollmentId: string) {
    return this.service.list(user.id, enrollmentId, user.roles.includes(Role.SUPER_ADMIN));
  }

  @Post()
  @Roles(Role.TEACHER, Role.PARENT)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.create(user.id, enrollmentId, dto);
  }

  @Patch(':commentId')
  @Roles(Role.TEACHER, Role.PARENT)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('enrollmentId') enrollmentId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.service.update(user.id, enrollmentId, commentId, dto);
  }

  @Delete(':commentId')
  @Roles(Role.TEACHER, Role.PARENT)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('enrollmentId') enrollmentId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.service.remove(user.id, enrollmentId, commentId);
  }
}
