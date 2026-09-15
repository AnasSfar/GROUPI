import { Module } from '@nestjs/common';
import { PushTokenController } from './push-token.controller';
import { PushTokenService } from './push-token.service';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationPreferencesService } from './notification-preferences.service';
import { PushDeliveryService } from './push-delivery.service';

/** Pas d'import d'AuthModule : `JwtAuthGuard` ne dépend que de `Reflector` (global, @nestjs/core),
 *  la stratégie 'jwt' est enregistrée une fois par AuthModule au démarrage — même raisonnement que
 *  ce que AuthModule fait pour éviter les cycles avec MessagingModule/NotificationsModule. */
@Module({
  controllers: [PushTokenController, NotificationPreferencesController],
  providers: [PushTokenService, NotificationPreferencesService, PushDeliveryService],
  exports: [NotificationPreferencesService, PushDeliveryService],
})
export class PushModule {}
