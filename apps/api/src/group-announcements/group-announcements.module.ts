import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GroupAnnouncementsController } from './group-announcements.controller';
import { GroupAnnouncementsService } from './group-announcements.service';

@Module({
  imports: [AuthModule, NotificationsModule, SubscriptionsModule],
  controllers: [GroupAnnouncementsController],
  providers: [GroupAnnouncementsService],
  // RM-COM-016 : exporté pour que TemporalJobsService puisse appeler purgeOldAnnouncements() (purge
  // de rétention mensuelle).
  exports: [GroupAnnouncementsService],
})
export class GroupAnnouncementsModule {}
