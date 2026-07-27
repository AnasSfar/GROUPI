import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';

/** Lecture seule des référentiels officiels (Ch.23) — utilisés pour peupler les sélecteurs du frontend. */
@Controller('referentials')
@UseGuards(JwtAuthGuard)
export class ReferentialsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('subjects')
  subjects() {
    return this.prisma.subject.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('school-levels')
  schoolLevels() {
    return this.prisma.schoolLevel.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, order: true },
      orderBy: { order: 'asc' },
    });
  }

  @Get('cities')
  cities() {
    return this.prisma.city.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('schools')
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


