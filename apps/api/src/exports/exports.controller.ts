import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { ExportsService, FORMAT_MIME } from './exports.service';
import { CreateExportDto } from './dto/create-export.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/**
 * Ch.17 : exports Professeur/Parent — `POST` déclenche la génération (RM-EXP-001/010), `GET`
 * couvre la consultation/le téléchargement (RM-EXP-015 : réservé à l'auteur, appliqué dans le
 * service quel que soit le rôle du token).
 */
@Controller('exports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportsController {
  constructor(private readonly service: ExportsService) {}

  @Post()
  @Roles(Role.TEACHER, Role.PARENT)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExportDto) {
    return user.roles.includes('TEACHER')
      ? this.service.requestTeacherExport(user.id, dto)
      : this.service.requestParentExport(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMine(user.id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.getJob(user.id, id);
  }

  @Get(':id/download')
  async download(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Res() res: Response) {
    const { fileName, format, bytes } = await this.service.download(user.id, id);
    res.set({
      'Content-Type': FORMAT_MIME[format],
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(bytes.length),
    });
    res.send(bytes);
  }
}
