import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ParentProfileService } from './parent-profile.service';
import { StudentService } from './student.service';
import { UpdateParentProfileDto } from './dto/update-parent-profile.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('parent-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARENT)
export class ParentProfileController {
  constructor(
    private readonly parentProfile: ParentProfileService,
    private readonly students: StudentService,
  ) {}

  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.parentProfile.getMyProfile(user.id);
  }

  @Patch('me')
  updateMine(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateParentProfileDto) {
    return this.parentProfile.updateProfile(user.id, dto);
  }

  @Get('me/students')
  listStudents(@CurrentUser() user: AuthenticatedUser) {
    return this.students.listMine(user.id);
  }

  @Post('me/students')
  createStudent(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStudentDto) {
    return this.students.create(user.id, dto);
  }

  @Get('me/students/:studentId')
  getStudent(@CurrentUser() user: AuthenticatedUser, @Param('studentId') studentId: string) {
    return this.students.getOne(user.id, studentId);
  }

  @Patch('me/students/:studentId')
  updateStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.students.update(user.id, studentId, dto);
  }

  @Post('me/students/:studentId/archive')
  archiveStudent(@CurrentUser() user: AuthenticatedUser, @Param('studentId') studentId: string) {
    return this.students.archive(user.id, studentId);
  }

  @Post('me/students/:studentId/reactivate')
  reactivateStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ) {
    return this.students.reactivate(user.id, studentId);
  }
}
