import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ParentProfileModule } from '../parent-profile/parent-profile.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchoolSituationController } from './school-situation.controller';
import { AdminSchoolSituationController } from './admin-school-situation.controller';
import { SchoolSituationService } from './school-situation.service';

@Module({
  imports: [AuthModule, ParentProfileModule, NotificationsModule],
  controllers: [SchoolSituationController, AdminSchoolSituationController],
  providers: [SchoolSituationService],
  exports: [SchoolSituationService],
})
export class SchoolSituationModule {}
