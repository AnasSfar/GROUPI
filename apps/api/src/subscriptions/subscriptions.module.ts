import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsController } from './subscriptions.controller';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionGuard } from './subscription.guard';

@Module({
  imports: [AuthModule, EmailModule, NotificationsModule],
  controllers: [SubscriptionsController, AdminSubscriptionsController],
  providers: [SubscriptionsService, SubscriptionGuard],
  exports: [SubscriptionsService, SubscriptionGuard],
})
export class SubscriptionsModule {}
