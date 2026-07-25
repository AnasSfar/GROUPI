import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TeacherProfileController } from './teacher-profile.controller';
import { TeacherProfileService } from './teacher-profile.service';

@Module({
  imports: [AuthModule],
  controllers: [TeacherProfileController],
  providers: [TeacherProfileService],
})
export class TeacherProfileModule {}
