import { Injectable, Logger } from '@nestjs/common';

/**
 * Stub : aucun provider SMTP n'est configuré (hors scope de ce chantier).
 * Journalise le contenu qui serait envoyé, pour permettre de tester les flux
 * mot-de-passe-oublié sans dépendance externe.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    this.logger.log(`[stub] Password reset email to ${to} — token: ${resetToken}`);
  }
}
