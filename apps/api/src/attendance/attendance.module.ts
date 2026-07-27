import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AccountingModule } from '../accounting/accounting.module';
import { SessionAttendanceController } from './session-attendance.controller';
import { GroupAttendanceController } from './group-attendance.controller';
import { ParentAttendanceController } from './parent-attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [AuthModule, EmailModule, NotificationsModule, SubscriptionsModule, AccountingModule],
  controllers: [SessionAttendanceController, GroupAttendanceController, ParentAttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
