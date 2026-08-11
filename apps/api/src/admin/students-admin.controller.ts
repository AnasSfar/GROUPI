import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { StudentsAdminService } from './students-admin.service';
import { ReassignStudentParentDto } from './dto/reassign-student-parent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** RM-ACC-016 : réaffectation d'un Élève à un nouveau Parent (ex. après désactivation de son Parent d'origine). */
@Controller('admin/students')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StudentsAdminController {
  constructor(private readonly studentsAdmin: StudentsAdminService) {}

  @Patch(':studentId/reassign-parent')
  @RequirePermissions('ACC_REASSIGN_STUDENT')
  reassignParent(
    @Param('studentId') studentId: string,
    @Body() dto: ReassignStudentParentDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Req() req: any,
  ) {
    return this.studentsAdmin.reassignParent(actor.id, studentId, dto, { ipAddress: req.ip });
  }
}
