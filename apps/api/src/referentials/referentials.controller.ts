import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { RejectSchoolAdditionRequestDto } from './dto/reject-school-addition-request.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** Lecture seule des référentiels officiels (Ch.23) — utilisés pour peupler les sélecteurs du frontend. */
@Controller('referentials')
@UseGuards(JwtAuthGuard)
export class ReferentialsController {
  constructor(private readonly prisma: PrismaService) {}

  /** Public : matières/niveaux doivent être sélectionnables dès le formulaire d'inscription (RM-TPR-001), avant authentification. */
  @Get('subjects')
  @Public()
  subjects() {
    return this.prisma.subject.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('school-levels')
  @Public()
  schoolLevels() {
    return this.prisma.schoolLevel.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, order: true },
      orderBy: { order: 'asc' },
    });
  }

  /** Ch.10/ERR-GRP-001 : couples matière/niveau autorisés — permet au frontend de filtrer le
   * sélecteur de niveau selon la matière choisie plutôt que de laisser composer une combinaison
   * interdite et de la découvrir seulement à la soumission. */
  @Get('subject-levels')
  subjectLevels() {
    return this.prisma.subjectLevel.findMany({
      where: { isAllowed: true, isActive: true },
      select: { subjectId: true, schoolLevelId: true },
    });
  }

  @Get('cities')
  @Public()
  cities() {
    return this.prisma.city.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('schools')
  @Public()
  schools() {
    return this.prisma.school.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameAr: true,
        type: true,
        cityId: true,
        city: { select: { id: true, name: true } },
        officialCode: true,
        latitude: true,
        longitude: true,
      },
      orderBy: [{ city: { name: 'asc' } }, { name: 'asc' }],
    });
  }


  @Get('school-requests')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('REF_CREATE')
  schoolRequests(@Query('status') status?: string) {
    return this.prisma.schoolAdditionRequest.findMany({
      where: status ? { status } : undefined,
      include: { parent: true, city: true, createdSchool: true, reviewedBy: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('school-requests/:id/approve')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('REF_CREATE')
  async approveSchoolRequest(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    const request = await this.prisma.schoolAdditionRequest.findUnique({ where: { id } });
    if (!request) {
      throw new BadRequestException('Demande d\'etablissement introuvable');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cette demande a deja ete traitee');
    }
    const school = await this.prisma.school.create({
      data: {
        sourceKey: `parent-request:${request.id}`,
        autoCode: `PARENT-${request.id.slice(0, 8).toUpperCase()}`,
        name: request.name,
        type: request.type,
        cityId: request.cityId,
        address: request.address,
        isActive: true,
      },
    });
    return this.prisma.schoolAdditionRequest.update({
      where: { id },
      data: { status: 'APPROVED', reviewedById: actor.id, reviewedAt: new Date(), createdSchoolId: school.id },
      include: { city: true, createdSchool: true },
    });
  }

  @Post('school-requests/:id/reject')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('REF_CREATE')
  async rejectSchoolRequest(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: RejectSchoolAdditionRequestDto,
  ) {
    const request = await this.prisma.schoolAdditionRequest.findUnique({ where: { id } });
    if (!request) {
      throw new BadRequestException('Demande d\'etablissement introuvable');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Cette demande a deja ete traitee');
    }
    return this.prisma.schoolAdditionRequest.update({
      where: { id },
      data: { status: 'REJECTED', reviewedById: actor.id, reviewedAt: new Date(), rejectionReason: dto.reason },
      include: { city: true },
    });
  }
  /** Ch.7 : une situation scolaire est toujours rattachée à l'année académique ouverte. */
  @Get('academic-years')
  academicYears() {
    return this.prisma.academicYear.findMany({
      select: { id: true, label: true, status: true, startDate: true, endDate: true },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * PERM-REF-001 : création d'une année académique par un Admin/Super Admin — jusqu'ici une seule
   * année (2026-2027) était seedée, ce qui bloquait tout test de bout en bout d'un passage réel à
   * l'année suivante (préinscriptions notamment, Ch.11). Nouvelle année toujours créée OPEN ; aucune
   * fermeture automatique de l'année précédente ici (RM-* ne l'impose pas — cohabitation possible
   * pendant une période de transition).
   */
  @Post('academic-years')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('REF_CREATE')
  async createAcademicYear(@Body() dto: CreateAcademicYearDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (startDate >= endDate) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }

    const overlapping = await this.prisma.academicYear.findFirst({
      where: { startDate: { lt: endDate }, endDate: { gt: startDate } },
    });
    if (overlapping) {
      throw new BadRequestException(
        `Cette période chevauche l'année académique existante "${overlapping.label}"`,
      );
    }

    const existingLabel = await this.prisma.academicYear.findUnique({ where: { label: dto.label } });
    if (existingLabel) {
      throw new BadRequestException(`Une année académique "${dto.label}" existe déjà`);
    }

    return this.prisma.academicYear.create({
      data: { label: dto.label, startDate, endDate, status: 'OPEN' },
      select: { id: true, label: true, status: true, startDate: true, endDate: true },
    });
  }
}


