import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [AuthModule, SubscriptionsModule, NotificationsModule],
  controllers: [GroupsController],
  providers: [GroupsService],
  // Exporté pour permettre à d'autres modules (ex. Séances, RM-GRP-009/030) d'injecter
  // `GroupsService` et d'appeler `isDateInGenerationPause()` plutôt que de dupliquer la logique.
  exports: [GroupsService],
})
export class GroupsModule {}
