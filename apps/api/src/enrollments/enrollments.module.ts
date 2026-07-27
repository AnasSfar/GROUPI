import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AccountingModule } from '../accounting/accounting.module';
import { EnrollmentsController } from './enrollments.controller';
import { GroupEnrollmentsController } from './group-enrollments.controller';
import { EnrollmentsService } from './enrollments.service';

@Module({
  imports: [AuthModule, EmailModule, NotificationsModule, SubscriptionsModule, AccountingModule],
  controllers: [EnrollmentsController, GroupEnrollmentsController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule {}
