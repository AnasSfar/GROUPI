import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  // RM-NOT-014 : EmailModule importé pour le réenvoi des e-mails critiques en échec
  // (`NotificationsService.retryFailedCriticalEmails`).
  imports: [AuthModule, EmailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
