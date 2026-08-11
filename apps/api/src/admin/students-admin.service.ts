import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReassignStudentParentDto } from './dto/reassign-student-parent.dto';

interface ActionMeta {
  ipAddress?: string;
}

/**
 * RM-ACC-016 : la désactivation d'un compte Parent ne supprime pas les profils Élèves associés —
 * un Administrateur peut les réaffecter à un nouveau compte Parent.
 */
@Injectable()
export class StudentsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async reassignParent(
    actorUserId: string,
    studentId: string,
    dto: ReassignStudentParentDto,
    meta: ActionMeta = {},
  ) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Élève introuvable');
    }
    if (student.parentId === dto.newParentUserId) {
      throw new BadRequestException('Cet élève est déjà rattaché à ce compte Parent');
    }

    const newParent = await this.prisma.parentProfile.findUnique({
      where: { id: dto.newParentUserId },
      include: { user: true },
    });
    if (!newParent) {
      throw new BadRequestException('Le nouveau Parent doit posséder un profil Parent existant');
    }
    if (newParent.user.status !== 'ACTIVE') {
      throw new BadRequestException('Le nouveau Parent doit avoir un compte actif');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id: studentId },
        data: { parentId: dto.newParentUserId },
      });

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: 'STUDENT_REASSIGNED',
          targetType: 'Student',
          targetId: studentId,
          oldValues: { parentId: student.parentId },
          newValues: { parentId: dto.newParentUserId },
          ipAddress: meta.ipAddress,
        },
      });

      return updated;
    });
  }
}
