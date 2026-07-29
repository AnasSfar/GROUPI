import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateParentProfileDto } from './dto/update-parent-profile.dto';
import { CreateSchoolAdditionRequestDto } from './dto/create-school-addition-request.dto';

@Injectable()
export class ParentProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    const profile = await this.prisma.parentProfile.findUnique({ where: { id: userId } });
    if (!profile) {
      throw new NotFoundException('Profil parent introuvable');
    }
    return profile;
  }

  /** RM-PAR-001/§6.4 : nom/prénom/téléphone/ville — seuls téléphone et ville restent modifiables librement ici. */
  async updateProfile(userId: string, dto: UpdateParentProfileDto) {
    await this.getMyProfile(userId); // 404 si absent
    return this.prisma.parentProfile.update({ where: { id: userId }, data: dto });
  }
  async listSchoolAdditionRequests(parentId: string) {
    return this.prisma.schoolAdditionRequest.findMany({
      where: { parentId },
      include: { city: true, createdSchool: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSchoolAdditionRequest(parentId: string, dto: CreateSchoolAdditionRequestDto) {
    await this.getMyProfile(parentId);
    const city = await this.prisma.city.findUnique({ where: { id: dto.cityId } });
    if (!city || !city.isActive) {
      throw new BadRequestException('Ville introuvable ou inactive (ERR-SCH-001)');
    }
    const existingSchool = await this.prisma.school.findFirst({
      where: { cityId: dto.cityId, name: { equals: dto.name, mode: 'insensitive' }, isActive: true },
    });
    if (existingSchool) {
      throw new BadRequestException('Cet etablissement existe deja dans le referentiel (RM-SCH-020)');
    }
    const duplicatePending = await this.prisma.schoolAdditionRequest.findFirst({
      where: { parentId, status: 'PENDING', cityId: dto.cityId, name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (duplicatePending) {
      throw new BadRequestException('Une demande identique est deja en attente');
    }
    return this.prisma.schoolAdditionRequest.create({
      data: { parentId, name: dto.name, type: dto.type, cityId: dto.cityId, address: dto.address, comment: dto.comment },
      include: { city: true },
    });
  }
}