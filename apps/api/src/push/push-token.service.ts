import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushTokenService {
  constructor(private readonly prisma: PrismaService) {}

  /** Upsert par token : un réinstall sur un device partagé réattribue le token au nouvel utilisateur
   *  connecté plutôt que de laisser une copie orpheline pointer vers l'ancien compte. */
  async registerToken(userId: string, token: string, platform: 'ANDROID' | 'IOS'): Promise<void> {
    await this.prisma.pushToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  async unregisterToken(userId: string, token: string): Promise<void> {
    await this.prisma.pushToken.deleteMany({ where: { token, userId } });
  }
}
