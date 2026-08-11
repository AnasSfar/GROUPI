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

  /** RM-CYC-022 : invitation envoyée à un Administrateur créé par le Super Administrateur. */
  async sendAdminInvitation(to: string, invitationToken: string): Promise<void> {
    await this.send(
      to,
      'GROUPI — Invitation à administrer GROUPI',
      `Un compte Administrateur GROUPI a été créé pour vous. Voici votre lien pour définir votre ` +
        `mot de passe et vos informations : token=${invitationToken}`,
    );
  }

  /** Ch.9.5, ERR-SEC-012 */
  async sendEmailVerification(to: string, verificationToken: string): Promise<void> {
    await this.send(
      to,
      'GROUPI — Vérifiez votre adresse e-mail',
      `Voici votre lien de vérification : token=${verificationToken}`,
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

  /** NOT-SES-004 : passage exceptionnel du mode d'enseignement d'une séance (Ch.13.6). */
  async sendSessionTeachingModeChanged(
    to: string,
    groupName: string,
    date: Date,
    startTime: string,
    newModeLabel: string,
  ): Promise<void> {
    await this.send(
      to,
      'GROUPI — Changement exceptionnel du mode d’enseignement',
      `La séance du groupe "${groupName}" du ${date.toLocaleDateString('fr-FR')} à ${startTime} passe exceptionnellement en ${newModeLabel}. Merci de confirmer ou non la participation de votre enfant.`,
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

  /** NOT-CPT-007 : template reutilise par le rappel manuel et le rappel automatique quotidien. */
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
  async sendSessionAttendanceMissing(to: string, groupName: string, date: Date): Promise<void> {
    await this.send(
      to,
      'GROUPI - Pr�sences non saisies',
      `Les pr�sences de la s�ance du groupe "${groupName}" du ${date.toLocaleDateString('fr-FR')} n'ont pas encore �t� saisies.`,
    );
  }

  async sendSubscriptionExpiryReminder(to: string, planName: string, expiresAt: Date, daysLeft: number): Promise<void> {
    await this.send(
      to,
      `GROUPI - Abonnement bient�t expir� (J-${daysLeft})`,
      `Votre abonnement "${planName}" expire le ${expiresAt.toLocaleDateString('fr-FR')}. Pensez � renouveler pour conserver vos droits.`,
    );
  }

  async sendSubscriptionExpired(to: string, planName: string, expiresAt: Date): Promise<void> {
    await this.send(
      to,
      'GROUPI - Abonnement expir�',
      `Votre abonnement "${planName}" a expir� le ${expiresAt.toLocaleDateString('fr-FR')}. Vous disposez du d�lai de gr�ce pr�vu avant suspension automatique.`,
    );
  }

  async sendSubscriptionGraceSuspended(to: string, planName: string): Promise<void> {
    await this.send(
      to,
      'GROUPI - Compte Professeur suspendu',
      `Le d�lai de gr�ce de votre abonnement "${planName}" est d�pass�. Votre compte Professeur est suspendu jusqu'� r�gularisation.`,
    );
  }

  async sendAbsenceNoticeDeadline(to: string, studentName: string, groupName: string, date: Date, startTime: string): Promise<void> {
    await this.send(
      to,
      'GROUPI - Dernier d�lai pour signaler une absence',
      `La s�ance de ${studentName} dans le groupe "${groupName}" commence le ${date.toLocaleDateString('fr-FR')} � ${startTime}. C'est le dernier moment pour signaler une absence pr�visible.`,
    );
  }

  /**
   * RM-CYC-014/032/033 : suspension/désactivation/archivage d'un compte — jusqu'ici seule l'activité
   * en-app était créée (voir `AccountLifecycleService.transition`), sans e-mail malgré la priorité
   * CRITICAL de la notification. Titre/corps déjà composés par l'appelant (mêmes textes que
   * l'activité, cohérence garantie).
   */
  async sendAccountStatusChanged(to: string, title: string, body: string): Promise<void> {
    await this.send(to, `GROUPI — ${title}`, body);
  }

  /** RM-SEC-009/016/037 : verrouillage temporaire du compte après échecs de connexion répétés. */
  async sendAccountLocked(to: string, lockoutMinutes: number, maxAttempts: number): Promise<void> {
    await this.send(
      to,
      'GROUPI — Compte temporairement verrouillé',
      `Votre compte a été verrouillé ${lockoutMinutes} minutes après ${maxAttempts} tentatives de connexion échouées. Si ce n'était pas vous, changez votre mot de passe dès que possible.`,
    );
  }

  /**
   * RM-NOT-014 : réenvoi générique pour une `Activity` critique dont l'e-mail initial a échoué.
   * `NotificationsService.retryFailedCriticalEmails` ne connaît plus le template métier d'origine
   * (la closure `sendEmail` passée à `notify()` n'est jamais persistée) — ce message générique
   * reprend donc le titre/corps déjà stockés sur l'Activity plutôt que de dupliquer chaque template.
   */
  async sendCriticalActivityRetry(to: string, title: string, body: string): Promise<void> {
    await this.send(to, `GROUPI — ${title}`, body);
  }
}
