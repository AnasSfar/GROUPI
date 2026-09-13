import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagingModule } from '../messaging/messaging.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/** Avenant 01, Ch. I.4/I.7 : `EmailModule` retiré — `NotificationsService` délègue à `MessagingService`. */
@Module({
  imports: [AuthModule, MessagingModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
