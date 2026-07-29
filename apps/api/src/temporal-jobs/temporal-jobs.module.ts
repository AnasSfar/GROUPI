import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TemporalJobsService } from './temporal-jobs.service';

@Module({
  imports: [ScheduleModule.forRoot(), EmailModule, NotificationsModule],
  providers: [TemporalJobsService],
  exports: [TemporalJobsService],
})
export class TemporalJobsModule {}
