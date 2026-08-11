import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateSchoolLevelDto } from './dto/create-school-level.dto';
import { UpdateSchoolLevelDto } from './dto/update-school-level.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { renderCsv } from '../exports/renderers';

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * RM-REF-011 : contrairement à `School` (workflow de demande/validation Parent, Ch.6.7) et
 * `AcademicYear` (déjà créable via `ReferentialsController`), rien ne permettait jusqu'ici de créer
 * ou modifier `Subject`/`SchoolLevel`/`City` en dehors du seed — seul le seed les gérait. Le
 * référentiel ne prévoit pas de demande Parent pour ces trois-là : une création/modification directe
 * par un Administrateur habilité (REF_CREATE) suffit, l'action de l'Administrateur constituant elle-
 * même la validation (comme pour `AcademicYear`). Jamais de suppression physique (RM-REF-007/008) :
 * seul `isActive` bascule, cohérent avec le reste du module.
 */
@Controller('admin/referentials')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('REF_CREATE')
export class AdminReferentialsController {
  constructor(private readonly prisma: PrismaService) {}

  // --- Matières -----------------------------------------------------------

  /**
   * Vue Administrateur : toutes les matières, actives ou non (contrairement à `GET
   * /referentials/subjects`, public et filtré `isActive: true`) — sans cet endpoint, une matière
   * désactivée depuis l'écran d'administration disparaissait purement et simplement de la liste
   * affichée, sans aucun moyen de la réactiver.
   */
  @Get('subjects')
  async listSubjects() {
    return this.prisma.subject.findMany({ orderBy: { name: 'asc' } });
  }

  @Post('subjects')
  async createSubject(@Body() dto: CreateSubjectDto) {
    const name = dto.name.trim();
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.subject.findFirst({ where: { OR: [{ name }, { code }] } });
    if (existing) {
      throw new BadRequestException('Une matière avec ce nom ou ce code existe déjà (ERR-REF-003)');
    }
    return this.prisma.subject.create({ data: { name, code, isActive: true } });
  }

  @Patch('subjects/:id')
  async updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) {
      throw new NotFoundException('Matière introuvable (ERR-REF-001)');
    }
    const name = dto.name?.trim();
    const code = dto.code?.trim().toUpperCase();
    if (name || code) {
      const or: Array<{ name: string } | { code: string }> = [];
      if (name) or.push({ name });
      if (code) or.push({ code });
      const existing = await this.prisma.subject.findFirst({ where: { id: { not: id }, OR: or } });
      if (existing) {
        throw new BadRequestException('Une matière avec ce nom ou ce code existe déjà (ERR-REF-003)');
      }
    }
    return this.prisma.subject.update({
      where: { id },
      data: { ...(name ? { name } : {}), ...(code ? { code } : {}), ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}) },
    });
  }

  // --- Niveaux scolaires ----------------------------------------------------

  /** Vue Administrateur : tous les niveaux scolaires, actifs ou non (cf. `listSubjects` ci-dessus). */
  @Get('school-levels')
  async listSchoolLevels() {
    return this.prisma.schoolLevel.findMany({ orderBy: { order: 'asc' } });
  }

  @Post('school-levels')
  async createSchoolLevel(@Body() dto: CreateSchoolLevelDto) {
    const name = dto.name.trim();
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.schoolLevel.findFirst({ where: { OR: [{ name }, { code }] } });
    if (existing) {
      throw new BadRequestException('Un niveau scolaire avec ce nom ou ce code existe déjà (ERR-REF-003)');
    }
    return this.prisma.schoolLevel.create({ data: { name, code, order: dto.order, isActive: true } });
  }

  @Patch('school-levels/:id')
  async updateSchoolLevel(@Param('id') id: string, @Body() dto: UpdateSchoolLevelDto) {
    const level = await this.prisma.schoolLevel.findUnique({ where: { id } });
    if (!level) {
      throw new NotFoundException('Niveau scolaire introuvable (ERR-REF-001)');
    }
    const name = dto.name?.trim();
    const code = dto.code?.trim().toUpperCase();
    if (name || code) {
      const or: Array<{ name: string } | { code: string }> = [];
      if (name) or.push({ name });
      if (code) or.push({ code });
      const existing = await this.prisma.schoolLevel.findFirst({ where: { id: { not: id }, OR: or } });
      if (existing) {
        throw new BadRequestException('Un niveau scolaire avec ce nom ou ce code existe déjà (ERR-REF-003)');
      }
    }
    return this.prisma.schoolLevel.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(code ? { code } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  // --- Villes ---------------------------------------------------------------

  /** Vue Administrateur : toutes les villes, actives ou non (cf. `listSubjects` ci-dessus). */
  @Get('cities')
  async listCities() {
    return this.prisma.city.findMany({ orderBy: { name: 'asc' } });
  }

  @Post('cities')
  async createCity(@Body() dto: CreateCityDto) {
    const name = dto.name.trim();
    const existing = await this.prisma.city.findUnique({ where: { name } });
    if (existing) {
      throw new BadRequestException('Une ville avec ce nom existe déjà (ERR-REF-003)');
    }
    return this.prisma.city.create({ data: { name, isActive: true } });
  }

  @Patch('cities/:id')
  async updateCity(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) {
      throw new NotFoundException('Ville introuvable (ERR-REF-001)');
    }
    const name = dto.name?.trim();
    if (name) {
      const existing = await this.prisma.city.findFirst({ where: { id: { not: id }, name } });
      if (existing) {
        throw new BadRequestException('Une ville avec ce nom existe déjà (ERR-REF-003)');
      }
    }
    return this.prisma.city.update({
      where: { id },
      data: { ...(name ? { name } : {}), ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}) },
    });
  }

  // --- Export CSV (RM-REF-013) -----------------------------------------------

  /**
   * RM-REF-013 : export CSV synchrone des référentiels actifs, pour audit/analyse par un
   * Administrateur habilité. Contrairement au module Exports (Ch.17, `ExportJob` asynchrone), il
   * s'agit ici d'une génération directe — pas de journalisation d'export ni de fichier persisté,
   * ce référentiel n'étant pas une donnée personnelle soumise aux mêmes contraintes de
   * confidentialité (RM-EXP) que les exports Professeur/Parent.
   */
  @Get('export.csv')
  async exportCsv(@Res() res: Response) {
    const [subjects, schoolLevels, cities, schools] = await Promise.all([
      this.prisma.subject.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      this.prisma.schoolLevel.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      this.prisma.city.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      this.prisma.school.findMany({
        where: { isActive: true },
        include: { city: true },
        orderBy: [{ city: { name: 'asc' } }, { name: 'asc' }],
      }),
    ]);

    const rows: Record<string, string | number | null>[] = [
      ...subjects.map((s) => ({
        type: 'Matière',
        name: s.name,
        code: s.code,
        city: '',
        createdAt: dateOnly(s.createdAt),
        updatedAt: dateOnly(s.updatedAt),
      })),
      ...schoolLevels.map((l) => ({
        type: 'Niveau scolaire',
        name: l.name,
        code: l.code,
        city: '',
        createdAt: dateOnly(l.createdAt),
        updatedAt: dateOnly(l.updatedAt),
      })),
      ...cities.map((c) => ({
        type: 'Ville',
        name: c.name,
        code: '',
        city: '',
        createdAt: dateOnly(c.createdAt),
        updatedAt: dateOnly(c.updatedAt),
      })),
      ...schools.map((s) => ({
        type: 'Établissement',
        name: s.name,
        code: s.officialCode ?? s.autoCode ?? '',
        city: s.city.name,
        createdAt: dateOnly(s.createdAt),
        updatedAt: dateOnly(s.updatedAt),
      })),
    ];

    const csv = renderCsv({
      columns: [
        { key: 'type', label: 'Type' },
        { key: 'name', label: 'Nom' },
        { key: 'code', label: 'Code' },
        { key: 'city', label: 'Ville' },
        { key: 'createdAt', label: 'Créé le' },
        { key: 'updatedAt', label: 'Modifié le' },
      ],
      rows,
    });

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="groupi-referentiels.csv"',
      'Content-Length': String(csv.length),
    });
    res.send(csv);
  }
}
