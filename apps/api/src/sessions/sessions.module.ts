import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GroupSessionsController } from './group-sessions.controller';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [AuthModule, EmailModule, NotificationsModule, SubscriptionsModule],
  controllers: [GroupSessionsController, SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
