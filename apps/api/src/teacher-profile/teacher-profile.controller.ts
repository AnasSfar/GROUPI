import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TeacherProfileService } from './teacher-profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddSubjectDto } from './dto/add-subject.dto';
import { AddSchoolLevelDto } from './dto/add-school-level.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('teacher-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class TeacherProfileController {
  constructor(private readonly service: TeacherProfileService) {}

  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyProfile(user.id);
  }

  @Patch('me')
  updateMine(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(user.id, dto);
  }

  @Post('me/subjects')
  addSubject(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddSubjectDto) {
    return this.service.addSubject(user.id, dto.subjectId);
  }

  @Delete('me/subjects/:subjectId')
  removeSubject(@CurrentUser() user: AuthenticatedUser, @Param('subjectId') subjectId: string) {
    return this.service.removeSubject(user.id, subjectId);
  }

  @Post('me/school-levels')
  addSchoolLevel(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddSchoolLevelDto) {
    return this.service.addSchoolLevel(user.id, dto.schoolLevelId);
  }

  @Delete('me/school-levels/:schoolLevelId')
  removeSchoolLevel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('schoolLevelId') schoolLevelId: string,
  ) {
    return this.service.removeSchoolLevel(user.id, schoolLevelId);
  }
}
