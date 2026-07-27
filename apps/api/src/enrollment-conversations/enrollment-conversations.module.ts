import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { EnrollmentConversationsController } from './enrollment-conversations.controller';
import { EnrollmentConversationsService } from './enrollment-conversations.service';

@Module({
  imports: [AuthModule, NotificationsModule, SubscriptionsModule],
  controllers: [EnrollmentConversationsController],
  providers: [EnrollmentConversationsService],
})
export class EnrollmentConversationsModule {}
