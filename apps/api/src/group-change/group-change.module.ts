import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AccountingModule } from '../accounting/accounting.module';
import { GroupChangeController } from './group-change.controller';
import { GroupGroupChangeController } from './group-group-change.controller';
import { GroupChangeService } from './group-change.service';

@Module({
  imports: [AuthModule, EmailModule, NotificationsModule, SubscriptionsModule, AccountingModule],
  controllers: [GroupChangeController, GroupGroupChangeController],
  providers: [GroupChangeService],
  exports: [GroupChangeService],
})
export class GroupChangeModule {}
