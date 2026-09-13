import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AccountingModule } from '../accounting/accounting.module';
import { SessionsModule } from '../sessions/sessions.module';
import { LevelPoolsModule } from '../level-pools/level-pools.module';
import { GroupMembersController } from './group-members.controller';
import { GroupMembersService } from './group-members.service';

@Module({
  imports: [AuthModule, NotificationsModule, SubscriptionsModule, AccountingModule, SessionsModule, LevelPoolsModule],
  controllers: [GroupMembersController],
  providers: [GroupMembersService],
})
export class GroupMembersModule {}
