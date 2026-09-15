import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_LEAD_MINUTES, PUSH_CATEGORIES, PushCategory } from './push-categories';

export interface PreferenceView {
  category: PushCategory;
  enabled: boolean;
  leadMinutes?: number;
}

/**
 * Absence de ligne `NotificationPreference` pour une catégorie donnée = valeurs par défaut (activée,
 * délai par défaut pour SESSION_REMINDER) — on ne matérialise que les écarts, même principe que
 * `Activity`/`Session.status` ailleurs dans ce schéma (ne jamais stocker un état dérivable).
 */
@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: string): Promise<PreferenceView[]> {
    const rows = await this.prisma.notificationPreference.findMany({ where: { userId } });
    const byCategory = new Map(rows.map((r) => [r.category as PushCategory, r]));

    return PUSH_CATEGORIES.map((category) => {
      const row = byCategory.get(category);
      return {
        category,
        enabled: row?.enabled ?? true,
        ...(category === 'SESSION_REMINDER'
          ? { leadMinutes: row?.leadMinutes ?? DEFAULT_LEAD_MINUTES }
          : {}),
      };
    });
  }

  async isEnabled(userId: string, category: PushCategory): Promise<boolean> {
    const row = await this.prisma.notificationPreference.findUnique({
      where: { userId_category: { userId, category } },
    });
    return row?.enabled ?? true;
  }

  async getLeadMinutes(userId: string): Promise<number> {
    const row = await this.prisma.notificationPreference.findUnique({
      where: { userId_category: { userId, category: 'SESSION_REMINDER' } },
    });
    return row?.leadMinutes ?? DEFAULT_LEAD_MINUTES;
  }

  async updateMine(userId: string, entries: { category: PushCategory; enabled: boolean; leadMinutes?: number }[]) {
    for (const entry of entries) {
      await this.prisma.notificationPreference.upsert({
        where: { userId_category: { userId, category: entry.category } },
        update: { enabled: entry.enabled, leadMinutes: entry.leadMinutes },
        create: { userId, category: entry.category, enabled: entry.enabled, leadMinutes: entry.leadMinutes },
      });
    }
    return this.getMine(userId);
  }
}
