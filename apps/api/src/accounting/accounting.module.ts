import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AccountingService } from './accounting.service';
import { EnrollmentAccountingController } from './enrollment-accounting.controller';
import { AdminAccountingController } from './admin-accounting.controller';
import { TeacherAccountingController } from './teacher-accounting.controller';
import { GroupAccountingController } from './group-accounting.controller';
import { ParentAccountingController } from './parent-accounting.controller';

@Module({
  imports: [AuthModule, EmailModule, NotificationsModule, SubscriptionsModule],
  controllers: [
    EnrollmentAccountingController,
    AdminAccountingController,
    TeacherAccountingController,
    GroupAccountingController,
    ParentAccountingController,
  ],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
