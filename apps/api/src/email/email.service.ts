import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Envoi des notifications GROUPI (Ch.9 mot de passe oublié, puis NOT-INS/NOT-PRE/NOT-ATT une fois
 * les modules concernés câblés — voir progress.md).
 *
 * Réel dès que les variables `SMTP_HOST`/`SMTP_PORT` sont renseignées (nodemailer, SMTP standard —
 * compatible Ethereal en dev, tout relais SMTP réel en prod). Sans configuration, retombe sur le
 * comportement précédent : journalisation seule, pour ne jamais bloquer le dev/CI/e2e sans
 * identifiants (aucun test ne dépend d'un envoi réel).
 */
@Injectable()
export class EmailService implements OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('SMTP_FROM') ?? 'GROUPI <no-reply@groupi.local>';
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<string>('SMTP_PORT');
    if (host && port) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: this.config.get<string>('SMTP_USER')
          ? { user: this.config.get<string>('SMTP_USER'), pass: this.config.get<string>('SMTP_PASS') }
          : undefined,
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.transporter?.close();
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[stub] "${subject}" to ${to} — ${text}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text });
    } catch (err) {
      // RM générale (Ch.24) : une notification qui échoue n'interrompt jamais l'action métier qui
      // l'a déclenchée — on journalise l'échec plutôt que de propager l'erreur à l'appelant.
      this.logger.error(`Échec d'envoi "${subject}" à ${to} : ${(err as Error).message}`);
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    await this.send(
      to,
      'GROUPI — Réinitialisation de votre mot de passe',
      `Voici votre lien de réinitialisation : token=${resetToken}`,
    );
  }

  /** NOT-INS-002 */
  async sendEnrollmentAccepted(to: string, studentName: string, groupName: string): Promise<void> {
    await this.send(
      to,
      'GROUPI — Demande d’inscription acceptée',
      `La demande d'inscription de ${studentName} au groupe "${groupName}" a été acceptée.`,
    );
  }

  /** NOT-INS-003 */
  async sendEnrollmentRejected(to: string, studentName: string, groupName: string): Promise<void> {
    await this.send(
      to,
      'GROUPI — Demande d’inscription refusée',
      `La demande d'inscription de ${studentName} au groupe "${groupName}" a été refusée.`,
    );
  }

  /** NOT-INS-007 */
  async sendGroupChangeAccepted(to: string, studentName: string, targetGroupName: string, effectiveDate: Date): Promise<void> {
    await this.send(
      to,
      'GROUPI — Changement de groupe accepté',
      `Le changement de groupe de ${studentName} vers "${targetGroupName}" a été accepté, effectif le ` +
        `${effectiveDate.toLocaleDateString('fr-FR')}.`,
    );
  }

  /** NOT-INS-008 */
  async sendGroupChangeRejected(to: string, studentName: string, targetGroupName: string): Promise<void> {
    await this.send(
      to,
      'GROUPI — Changement de groupe refusé',
      `Le changement de groupe de ${studentName} vers "${targetGroupName}" a été refusé.`,
    );
  }

  /** NOT-PRE-* (proposition d'un groupe suite à une préinscription) */
  async sendPreEnrollmentProposal(to: string, studentName: string, groupName: string): Promise<void> {
    await this.send(
      to,
      'GROUPI — Proposition de groupe',
      `Un groupe "${groupName}" a été proposé pour ${studentName} suite à votre préinscription.`,
    );
  }

  /** NOT-ATT-001/002/003/004 (statut de présence enregistré ou modifié) */
  async sendAttendanceRecorded(to: string, studentName: string, statusLabel: string, date: Date): Promise<void> {
    await this.send(
      to,
      'GROUPI — Présence enregistrée',
      `${studentName} est marqué "${statusLabel}" à la séance du ${date.toLocaleDateString('fr-FR')}.`,
    );
  }

  /** NOT-ATT-006 */
  async sendAbandonmentAlert(to: string, studentName: string, consecutiveAbsences: number): Promise<void> {
    await this.send(
      to,
      'GROUPI — Alerte d’abandon',
      `${studentName} totalise ${consecutiveAbsences} absences non excusées consécutives.`,
    );
  }

  /** NOT-SES-001 */
  async sendSessionExceptional(to: string, groupName: string, date: Date, startTime: string): Promise<void> {
    await this.send(
      to,
      'GROUPI — Nouvelle séance exceptionnelle',
      `Une séance exceptionnelle a été ajoutée au groupe "${groupName}" le ${date.toLocaleDateString('fr-FR')} à ${startTime}.`,
    );
  }

  /** NOT-SES-003 */
  async sendSessionCancelled(to: string, groupName: string, date: Date, startTime: string): Promise<void> {
    await this.send(
      to,
      'GROUPI — Séance annulée',
      `La séance du groupe "${groupName}" prévue le ${date.toLocaleDateString('fr-FR')} à ${startTime} a été annulée.`,
    );
  }

  /** NOT-ABO-006 */
  async sendSubscriptionSuspended(to: string, planName: string): Promise<void> {
    await this.send(
      to,
      'GROUPI — Abonnement suspendu',
      `Votre abonnement "${planName}" a été suspendu pour non-paiement. Contactez l’administration GROUPI pour régulariser votre situation.`,
    );
  }

  /** NOT-ABO-007 */
  async sendSubscriptionReactivated(to: string, planName: string): Promise<void> {
    await this.send(
      to,
      'GROUPI — Abonnement réactivé',
      `Votre abonnement "${planName}" a été réactivé. Vos droits sont rétablis, aucune donnée n’a été perdue.`,
    );
  }

  /** NOT-CPT-007 (déclenchement manuel par le Professeur — pas de scheduler dans ce projet). */
  async sendPaymentReminder(to: string, studentName: string, debtAmount: number): Promise<void> {
    await this.send(
      to,
      'GROUPI — Rappel de paiement',
      `Le compte de ${studentName} présente un solde débiteur de ${debtAmount.toFixed(3)} TND. Merci de régulariser la situation auprès du Professeur.`,
    );
  }

  /** NOT-EXP-003 */
  async sendExportRefused(to: string, reason: string): Promise<void> {
    await this.send(to, 'GROUPI — Export refusé', reason);
  }

  /** NOT-EXP-005 */
  async sendExportFailed(to: string, exportLabel: string): Promise<void> {
    await this.send(
      to,
      'GROUPI — Échec de génération d’export',
      `La génération de l'export "${exportLabel}" a échoué. Merci de réessayer ou de contacter l'administration.`,
    );
  }

  /** NOT-SES-007/018 : fusionnées en un seul message pour une action atomique (report). */
  async sendSessionPostponed(
    to: string,
    groupName: string,
    oldDate: Date,
    newDate: Date,
    newStartTime: string,
  ): Promise<void> {
    await this.send(
      to,
      'GROUPI — Séance reportée',
      `La séance du groupe "${groupName}" prévue le ${oldDate.toLocaleDateString('fr-FR')} a été reportée au ` +
        `${newDate.toLocaleDateString('fr-FR')} à ${newStartTime}.`,
    );
  }

  /** Ch.16.4/RM-DSH-006/EVT-DSH-007 : notification immédiate au Professeur — jamais de code NOT-DSH
   *  dédié dans le référentiel, notification purement informative (ne modifie jamais Attendance). */
  async sendAbsenceNoticeReported(
    to: string,
    studentName: string,
    groupName: string,
    date: Date,
    startTime: string,
  ): Promise<void> {
    await this.send(
      to,
      'GROUPI — Absence signalée par un Parent',
      `Le Parent de ${studentName} a signalé une absence prévisible à la séance du groupe "${groupName}" ` +
        `le ${date.toLocaleDateString('fr-FR')} à ${startTime}. Ce signalement est informatif : la présence ` +
        `définitive reste à votre charge lors de la séance.`,
    );
  }
}
