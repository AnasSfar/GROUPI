import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Envoi des codes de vérification/réinitialisation par SMS, pour les comptes dont l'identifiant
 * choisi (RM-SEC-001) est le numéro de téléphone. Même principe que `EmailService` : réel dès que
 * `SMS_API_URL`/`SMS_API_KEY` sont renseignées (relais HTTP générique, compatible avec la plupart
 * des fournisseurs SMS via un petit adaptateur côté fournisseur) ; sans configuration, retombe sur
 * une journalisation seule, pour ne jamais bloquer le dev/CI/e2e sans identifiants (aucun test ne
 * dépend d'un envoi réel — même compromis assumé que pour `EmailService`).
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiUrl?: string;
  private readonly apiKey?: string;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.apiUrl = this.config.get<string>('SMS_API_URL');
    this.apiKey = this.config.get<string>('SMS_API_KEY');
    this.from = this.config.get<string>('SMS_FROM') ?? 'GROUPI';
  }

  private async send(to: string, body: string): Promise<void> {
    if (!this.apiUrl) {
      this.logger.log(`[stub] SMS to ${to} — ${body}`);
      return;
    }
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({ to, from: this.from, body }),
      });
      if (!response.ok) {
        throw new Error(`SMS provider a répondu ${response.status}`);
      }
    } catch (err) {
      // RM générale (Ch.24) : une notification qui échoue n'interrompt jamais l'action métier qui
      // l'a déclenchée — on journalise l'échec plutôt que de propager l'erreur à l'appelant.
      this.logger.error(`Échec d'envoi SMS à ${to} : ${(err as Error).message}`);
    }
  }

  /** Ch.9.5, RM-SEC-001 — code de vérification du numéro à l'inscription. */
  async sendPhoneVerification(to: string, code: string): Promise<void> {
    await this.send(to, `GROUPI — Votre code de vérification est ${code}. Il expire dans 24h.`);
  }

  /** §9.4 — code de réinitialisation de mot de passe pour un compte identifié par téléphone. */
  async sendPasswordResetSms(to: string, code: string): Promise<void> {
    await this.send(to, `GROUPI — Votre code de réinitialisation de mot de passe est ${code}. Il expire dans 15 minutes.`);
  }

  /** RM-SEC-009 — verrouillage de compte, même contenu que `EmailService.sendAccountLocked`. */
  async sendAccountLocked(to: string, lockoutMinutes: number, maxAttempts: number): Promise<void> {
    await this.send(
      to,
      `GROUPI — Compte verrouillé ${lockoutMinutes} min après ${maxAttempts} échecs de connexion. Si ce n'était pas vous, changez votre mot de passe dès que possible.`,
    );
  }
}
