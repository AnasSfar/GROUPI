import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AccountingModule } from '../accounting/accounting.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DashboardService } from './dashboard.service';
import { AbsenceNoticeService } from './absence-notice.service';
import { TeacherDashboardController } from './teacher-dashboard.controller';
import { ParentDashboardController } from './parent-dashboard.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AbsenceNoticeController } from './absence-notice.controller';

/** Ch.16 : tableaux de bord par rôle — agrège des domaines déjà construits, ne les remplace pas. */
@Module({
  imports: [AuthModule, EmailModule, NotificationsModule, AccountingModule, AttendanceModule, SubscriptionsModule],
  controllers: [TeacherDashboardController, ParentDashboardController, AdminDashboardController, AbsenceNoticeController],
  providers: [DashboardService, AbsenceNoticeService],
})
export class DashboardModule {}
