import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LevelPoolsModule } from '../level-pools/level-pools.module';
import { TeacherProfileController } from './teacher-profile.controller';
import { AdminTeacherProfileController } from './admin-teacher-profile.controller';
import { TeacherProfileService } from './teacher-profile.service';

@Module({
  // LevelPoolsModule : hook RM-POOL-001 (Avenant 01, Ch. B.3) sur la validation d'un niveau enseigné.
  imports: [AuthModule, LevelPoolsModule],
  controllers: [TeacherProfileController, AdminTeacherProfileController],
  providers: [TeacherProfileService],
  exports: [TeacherProfileService],
})
export class TeacherProfileModule {}
