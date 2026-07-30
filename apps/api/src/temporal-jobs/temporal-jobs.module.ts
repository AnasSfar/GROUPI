import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TemporalJobsService } from './temporal-jobs.service';
import { TemporalJobsController } from './temporal-jobs.controller';

@Module({
  imports: [ScheduleModule.forRoot(), EmailModule, NotificationsModule],
  controllers: [TemporalJobsController],
  providers: [TemporalJobsService],
  exports: [TemporalJobsService],
})
export class TemporalJobsModule {}
