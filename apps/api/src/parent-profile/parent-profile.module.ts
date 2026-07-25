import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ParentProfileController } from './parent-profile.controller';
import { ParentProfileService } from './parent-profile.service';
import { StudentService } from './student.service';

@Module({
  imports: [AuthModule],
  controllers: [ParentProfileController],
  providers: [ParentProfileService, StudentService],
  exports: [StudentService],
})
export class ParentProfileModule {}
