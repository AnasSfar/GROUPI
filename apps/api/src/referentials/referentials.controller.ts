import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
}
