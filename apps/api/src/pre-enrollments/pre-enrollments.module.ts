import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PreEnrollmentsController } from './pre-enrollments.controller';
import { GroupCompatiblePreEnrollmentsController } from './group-compatible-pre-enrollments.controller';
import { PreEnrollmentsService } from './pre-enrollments.service';

@Module({
  imports: [AuthModule, EmailModule, NotificationsModule, SubscriptionsModule],
  controllers: [PreEnrollmentsController, GroupCompatiblePreEnrollmentsController],
  providers: [PreEnrollmentsService],
})
export class PreEnrollmentsModule {}
