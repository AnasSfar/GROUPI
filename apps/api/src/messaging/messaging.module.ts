import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';

/**
 * Avenant 01, Ch. I.4/I.7, RM-NOT-051 : façade unique de notification (`NotificationChannel` =
 * `IN_APP` / `WHATSAPP` / `SMS`, ne route que `IN_APP` en V1.1). Ne dépend que de `PrismaService`
 * (module global) — remplace l'ancien `EmailModule` importé par tous les modules déclencheurs.
 */
@Module({
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
