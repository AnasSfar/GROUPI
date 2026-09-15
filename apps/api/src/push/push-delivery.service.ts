import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

export interface PushPayload {
  title: string;
  body?: string;
  data?: Record<string, string>;
}

/**
 * Wrapper Firebase Cloud Messaging. Même convention que `CORS_ORIGIN`/`SENTRY_DSN` (voir
 * .env.example) : sans `FIREBASE_SERVICE_ACCOUNT_JSON`, le push est silencieusement désactivé — les
 * `Activity` in-app continuent d'être créées normalement par `MessagingService.notify()`, seul
 * l'envoi push additionnel est sauté.
 */
@Injectable()
export class PushDeliveryService implements OnModuleInit {
  private readonly logger = new Logger(PushDeliveryService.name);
  private app: admin.app.App | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const raw = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!raw) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON absente : notifications push désactivées.');
      return;
    }
    try {
      const serviceAccount = JSON.parse(raw);
      this.app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch (err) {
      this.logger.error('FIREBASE_SERVICE_ACCOUNT_JSON invalide — notifications push désactivées.', err as Error);
    }
  }

  get enabled(): boolean {
    return this.app !== null;
  }

  /** Best-effort : ne lève jamais — un push manqué ne doit jamais faire échouer l'appelant. */
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.app) return;
    const tokens = await this.prisma.pushToken.findMany({ where: { userId }, select: { token: true } });
    if (tokens.length === 0) return;

    try {
      const response = await admin.messaging(this.app).sendEachForMulticast({
        tokens: tokens.map((t) => t.token),
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
      });

      const invalidTokens = response.responses
        .map((r, i) => (!r.success && this.isUnregistered(r.error) ? tokens[i].token : null))
        .filter((t): t is string => t !== null);
      if (invalidTokens.length > 0) {
        await this.prisma.pushToken.deleteMany({ where: { token: { in: invalidTokens } } });
      }
    } catch (err) {
      this.logger.error(`Envoi push échoué pour l'utilisateur ${userId}`, err as Error);
    }
  }

  private isUnregistered(error: admin.FirebaseError | undefined): boolean {
    return (
      error?.code === 'messaging/registration-token-not-registered' ||
      error?.code === 'messaging/invalid-registration-token'
    );
  }
}
