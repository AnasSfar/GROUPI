import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/**
 * Ch.12 : vue Parent — consultation et annulation de ses propres inscriptions.
 *
 * Avenant 01, Ch. C/D.2, RM-PAR-021, ERR-PAR-023 : `POST /enrollments` (demande d'inscription à
 * l'initiative du Parent, Ch.12.5 V1.0) est **supprimé** — le Parent n'initie plus jamais une
 * inscription ; l'entrée d'un enfant dans un groupe standard résulte désormais soit d'une
 * affectation Professeur depuis sa salle d'attente (Ch. C, `POST /groups/:id/members`, chantier
 * séparé), soit d'une préinscription confirmée (Ch. 11, inchangé — voir `PreEnrollmentsService.
 * confirm()`). Choix Ch. H.9 : suppression complète (même raisonnement que `GroupsController`,
 * voir son commentaire) plutôt qu'une route dédiée renvoyant 410 Gone.
 * `listMine`/`cancel` sont conservés : un Parent doit toujours pouvoir consulter le statut de ses
 * inscriptions (y compris celles encore `PENDING_VALIDATION` issues d'une préinscription confirmée)
 * et annuler une demande non encore traitée par le Professeur (RM-INS-038, inchangé).
 */
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Get('mine')
  @Roles(Role.PARENT)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMine(user.id);
  }

  @Post(':id/cancel')
  @Roles(Role.PARENT)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.cancel(user.id, id);
  }
}
