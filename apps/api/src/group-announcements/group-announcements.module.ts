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
})
export class GroupAnnouncementsModule {}
