import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Ch.13 : opérations sur les séances d'un groupe donné — Professeur propriétaire uniquement. */
@Controller('groups/:groupId/sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class GroupSessionsController {
  constructor(private readonly service: SessionsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Query() query: ListSessionsQueryDto,
  ) {
    return this.service.list(user.id, groupId, query);
  }

  /** Ch.13.3 : génération automatique des séances futures à partir du planning hebdomadaire. */
  @Post('generate')
  generate(@CurrentUser() user: AuthenticatedUser, @Param('groupId') groupId: string) {
    return this.service.generate(user.id, groupId);
  }

  /** Ch.13.10 : séance exceptionnelle (rattrapage, révision, etc.). */
  @Post()
  createExceptional(
    @CurrentUser() user: AuthenticatedUser,
    @Param('groupId') groupId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.service.createExceptional(user.id, groupId, dto);
  }
}
