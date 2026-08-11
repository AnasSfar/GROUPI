import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TeacherProfileController } from './teacher-profile.controller';
import { AdminTeacherProfileController } from './admin-teacher-profile.controller';
import { TeacherProfileService } from './teacher-profile.service';

@Module({
  imports: [AuthModule],
  controllers: [TeacherProfileController, AdminTeacherProfileController],
  providers: [TeacherProfileService],
  exports: [TeacherProfileService],
})
export class TeacherProfileModule {}
