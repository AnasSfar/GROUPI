import { Module } from '@nestjs/common';
import { PushModule } from '../push/push.module';
import { MessagingService } from './messaging.service';

/**
 * Avenant 01, Ch. I.4/I.7, RM-NOT-051 : façade unique de notification (`NotificationChannel` =
 * `IN_APP` / `WHATSAPP` / `SMS`, ne route que `IN_APP` en V1.1). Dépend de `PrismaService` (module
 * global) et de `PushModule` (routage push additionnel, best-effort, voir `MessagingService.notify`)
 * — remplace l'ancien `EmailModule` importé par tous les modules déclencheurs.
 */
@Module({
  imports: [PushModule],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
