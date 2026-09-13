import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/**
 * Ch.12 : vue Parent — consultation des inscriptions de ses enfants.
 *
 * Avenant 01, Ch. C/D.2, RM-PAR-021, ERR-PAR-023 : `POST /enrollments` (demande d'inscription à
 * l'initiative du Parent, Ch.12.5 V1.0) est **supprimé** — le Parent n'initie plus jamais une
 * inscription ; l'entrée d'un enfant dans un groupe standard résulte désormais soit d'une
 * affectation Professeur depuis sa salle d'attente (Ch. C, `POST /groups/:id/members`, chantier
 * séparé), soit d'une préinscription confirmée (Ch. 11 — voir `PreEnrollmentsService.confirm()`).
 * Avenant 02 : toute inscription naît directement `ACTIVE` — il n'existe plus d'état intermédiaire
 * à annuler avant décision du Professeur, donc `POST /enrollments/:id/cancel` est également retiré.
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
}
