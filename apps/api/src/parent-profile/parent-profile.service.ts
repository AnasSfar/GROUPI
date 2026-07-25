import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateParentProfileDto } from './dto/update-parent-profile.dto';

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
}
