import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataPortabilityRequest, ExportFormat, ExportJob, ExportType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { ExportDataBuilder, ExportCriteria } from './export-data.builder';
import { renderCsv, renderExcel, renderPdf, ExportTableData } from './renderers';
import { CreateExportDto } from './dto/create-export.dto';
import { CreateAdminExportDto } from './dto/create-admin-export.dto';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/** RM-EXP-009 : seuil de volume déclenchant le mode asynchrone — "paramétrable" au sens du
 * référentiel, mais il n'existe aucune table de configuration runtime dans ce projet (pas de
 * feature-flag store) : ces constantes jouent ce rôle, comme les seuils similaires ailleurs
 * (`Group.abandonmentThreshold`/`debtAlertThresholdSessions` sont eux paramétrables PAR GROUPE
 * — ce seuil-ci est une constante plateforme, cohérent avec "le seuil est paramétrable par GROUPI"). */
const ROW_THRESHOLD = 10_000;
const SIZE_THRESHOLD_BYTES = 5 * 1024 * 1024;
/** RM-EXP-008 */
const RETENTION_DAYS = 7;

const TYPE_LABEL: Record<ExportType, string> = {
  GROUPS: 'Groupes',
  STUDENTS: 'Eleves',
  ATTENDANCE: 'Presences',
  LATENESS: 'Retards',
  PEDAGOGICAL_COMMENTS: 'Commentaires',
  ACCOUNTING_ACCOUNTS: 'ComptesSuivi',
  PAYMENTS: 'Paiements',
  STATISTICS: 'Statistiques',
  DASHBOARD_INDICATORS: 'Indicateurs',
  ADMIN_STATISTICS: 'StatistiquesPlateforme',
  RGPD_PERSONAL_DATA: 'DonneesPersonnelles',
};

const FORMAT_EXT: Record<ExportFormat, string> = { PDF: 'pdf', EXCEL: 'xlsx', CSV: 'csv' };
export const FORMAT_MIME: Record<ExportFormat, string> = {
  PDF: 'application/pdf',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  CSV: 'text/csv; charset=utf-8',
};

/** Types que le Parent peut exporter (RM-EXP-010, Ch.17.4). */
const PARENT_TYPES: ExportType[] = ['ATTENDANCE', 'PEDAGOGICAL_COMMENTS', 'ACCOUNTING_ACCOUNTS', 'PAYMENTS'];

function sanitizeForFilename(value: string): string {
  const cleaned = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'Export';
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

/**
 * Ch.17 : exportation des données — gating (abonnement/format/ownership, RM-EXP-001/002/003/010),
 * génération (PDF/Excel/CSV, `renderers.ts`), cycle de vie du fichier (RM-EXP-007/008/009/015) et
 * journal des exports (RM-EXP-006/012). La construction des lignes brutes par type est déléguée à
 * `ExportDataBuilder` — ce service ne fait plus que la partie "métier de l'export" en tant que tel.
 */
@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
    private readonly builder: ExportDataBuilder,
  ) {}

  private async getUserEmail(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
    return user.email;
  }

  private toCriteria(dto: Partial<CreateExportDto>): ExportCriteria {
    return {
      groupIds: dto.groupIds,
      studentId: dto.studentId,
      subjectId: dto.subjectId,
      schoolLevelId: dto.schoolLevelId,
      academicYearId: dto.academicYearId,
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
      period: dto.period,
    };
  }

  /** RM-EXP-006 : une ligne pour CHAQUE demande, y compris les refus (`exportJobId` reste `null`). */
  private async writeAudit(
    userId: string,
    type: ExportType,
    format: ExportFormat,
    criteria: unknown,
    outcome: string,
    refusalReason?: string,
    exportJobId?: string,
  ): Promise<void> {
    await this.prisma.exportAudit.create({
      data: { userId, type, format, criteria: toJson(criteria), outcome, refusalReason, exportJobId },
    });
  }

  private async refuse(
    userId: string,
    dto: Partial<CreateExportDto> & { type: ExportType; format: ExportFormat },
    outcome: string,
    reason: string,
    notifySubscriptionRefusal = false,
  ): Promise<never> {
    await this.writeAudit(userId, dto.type, dto.format, this.toCriteria(dto), outcome, reason);
    if (notifySubscriptionRefusal) {
      // NOT-EXP-003 : refusé, abonnement insuffisant (Important) — EVT-EXP-004.
      await this.notifications.notify({
        recipientUserId: userId,
        type: 'EXP_REFUSED',
        priority: 'IMPORTANT',
        title: 'Export refusé',
        body: reason,
        sendEmail: async () => {
          const email = await this.getUserEmail(userId);
          if (email) await this.email.sendExportRefused(email, reason);
        },
      });
    }
    if (outcome === 'REFUSED_SUBSCRIPTION') {
      throw new ForbiddenException(reason);
    }
    if (outcome === 'REFUSED_FORMAT') {
      throw new BadRequestException(reason);
    }
    throw new ForbiddenException(reason);
  }

  // --- Génération -------------------------------------------------------------------------------

  private async render(format: ExportFormat, title: string, subtitle: string, table: ExportTableData): Promise<Buffer> {
    switch (format) {
      case 'CSV':
        return renderCsv(table);
      case 'EXCEL':
        return renderExcel(title, table);
      case 'PDF':
        return renderPdf(title, subtitle, table);
    }
  }

  private buildFileName(type: ExportType, format: ExportFormat, scopeLabel: string): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `GROUPI_${TYPE_LABEL[type]}_${sanitizeForFilename(scopeLabel)}_${date}.${FORMAT_EXT[format]}`;
  }

  /**
   * Point d'entrée unique de génération. RM-EXP-009/17.10 : au-delà de `ROW_THRESHOLD`, la requête
   * HTTP ne bloque plus le temps du rendu — le job est créé en `PENDING`, la notification
   * NOT-EXP-001 est envoyée, puis on répond immédiatement à l'appelant (`toJobView(job)`) pendant
   * que `generateAndFinalize` se poursuit en arrière-plan via `setImmediate` (voir son commentaire
   * pour les limites de cette approche — ce n'est toujours PAS une vraie file de tâches). En dessous
   * du seuil, le comportement reste inchangé : génération synchrone, la réponse HTTP attend le job
   * `READY`/`FAILED`.
   */
  private async finalizeExport(
    requestedById: string,
    type: ExportType,
    format: ExportFormat,
    dto: Partial<CreateExportDto>,
    table: ExportTableData,
    scopeLabel: string,
    generatedById?: string,
  ): Promise<Omit<ExportJob, 'fileBytes'>> {
    const rowCount = table.rows.length;
    const fileName = this.buildFileName(type, format, scopeLabel);
    const likelyAsync = rowCount > ROW_THRESHOLD;

    const job = await this.prisma.exportJob.create({
      data: {
        requestedById,
        generatedById: generatedById ?? null,
        type,
        format,
        status: likelyAsync ? 'PENDING' : 'PROCESSING',
        criteria: toJson(this.toCriteria(dto)),
        fileName,
        rowCount,
        isAsync: likelyAsync,
      },
    });

    if (likelyAsync) {
      // NOT-EXP-001/ERR-EXP-005
      await this.notifications.notify({
        recipientUserId: requestedById,
        type: 'EXP_GENERATING',
        priority: 'INFORMATION',
        title: 'Export en cours de génération',
        body: `Votre export "${TYPE_LABEL[type]}" (${rowCount} lignes) dépasse le seuil de traitement immédiat et est généré en arrière-plan (ERR-EXP-005/RM-EXP-009).`,
        refType: 'ExportJob',
        refId: job.id,
      });

      // RM-EXP-009 : ne pas attendre `generateAndFinalize` — le client reçoit déjà `job` (statut
      // PENDING) juste après ce bloc, sans bloquer sur le rendu. `generateAndFinalize` gère déjà
      // elle-même le statut FAILED + errorMessage en cas d'échec (voir son commentaire) ; le
      // `.catch` ici n'est qu'un filet pour ne jamais laisser une rejection non gérée si cette
      // gestion interne échouait à son tour.
      setImmediate(() => {
        void this.generateAndFinalize(job.id, requestedById, type, format, dto, table, fileName).catch((err: Error) => {
          this.logger.error(`Génération différée en échec pour l'export ${job.id} : ${err.message}`);
        });
      });

      return this.toJobView(job);
    }

    return this.generateAndFinalize(job.id, requestedById, type, format, dto, table, fileName);
  }

  /**
   * RM-EXP-009 : le rendu effectif (`render`) + la transition finale du job, appelée soit
   * synchrone-ment depuis `finalizeExport` (petits volumes), soit en arrière-plan via
   * `setImmediate` (gros volumes). Attention : ceci reste un simple callback JS différé dans le
   * process Node en cours — PAS une vraie file de tâches persistante (pas de lib de queue dans ce
   * projet). Un redémarrage du serveur pendant l'exécution perdrait le job, qui resterait bloqué en
   * `PROCESSING` indéfiniment (aucun mécanisme de reprise). Le comportement perçu côté client (la
   * requête HTTP ne bloque plus) est en revanche désormais conforme à l'esprit de RM-EXP-009.
   */
  private async generateAndFinalize(
    jobId: string,
    requestedById: string,
    type: ExportType,
    format: ExportFormat,
    dto: Partial<CreateExportDto>,
    table: ExportTableData,
    fileName: string,
  ): Promise<Omit<ExportJob, 'fileBytes'>> {
    const rowCount = table.rows.length;
    await this.prisma.exportJob.update({ where: { id: jobId }, data: { status: 'PROCESSING' } });

    let fileBytes: Buffer;
    try {
      fileBytes = await this.render(format, TYPE_LABEL[type], `${rowCount} ligne(s) — généré le ${new Date().toLocaleString('fr-FR')}`, table);
    } catch (err) {
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', errorMessage: (err as Error).message },
      });
      // NOT-EXP-005 (Critique)
      await this.notifications.notify({
        recipientUserId: requestedById,
        type: 'EXP_FAILED',
        priority: 'CRITICAL',
        title: "Échec de génération d'export",
        body: `La génération de l'export "${TYPE_LABEL[type]}" a échoué. Merci de réessayer ou de contacter l'administration.`,
        refType: 'ExportJob',
        refId: jobId,
        sendEmail: async () => {
          const email = await this.getUserEmail(requestedById);
          if (email) await this.email.sendExportFailed(email, TYPE_LABEL[type]);
        },
      });
      await this.writeAudit(requestedById, type, format, this.toCriteria(dto), 'FAILED', (err as Error).message, jobId);
      throw new InternalServerErrorException("Échec de génération de l'export (NOT-EXP-005)");
    }

    const isAsync = rowCount > ROW_THRESHOLD || fileBytes.length > SIZE_THRESHOLD_BYTES;
    const readyAt = new Date();
    const job = await this.prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'READY',
        fileBytes,
        fileSize: fileBytes.length,
        isAsync,
        readyAt,
        expiresAt: new Date(readyAt.getTime() + RETENTION_DAYS * 86_400_000),
      },
    });

    // NOT-EXP-002/EVT-EXP-002
    await this.notifications.notify({
      recipientUserId: requestedById,
      type: 'EXP_READY',
      priority: 'INFORMATION',
      title: 'Export disponible',
      body: `Votre export "${fileName}" est prêt au téléchargement (conservé 7 jours, RM-EXP-008).`,
      refType: 'ExportJob',
      refId: jobId,
    });

    // ERR-EXP-002 : un export sans donnée reste généré (fichier avec en-têtes uniquement /
    // message d'information), tracé distinctement dans le journal plutôt que refusé.
    await this.writeAudit(requestedById, type, format, this.toCriteria(dto), rowCount === 0 ? 'EMPTY' : 'SUCCESS', undefined, jobId);

    return this.toJobView(job);
  }

  /** Dispatch commun aux types "Professeur" (aussi réutilisé par le Super Admin en portée globale). */
  private async buildTeacherScopedTable(type: ExportType, teacherId: string | null, criteria: ExportCriteria): Promise<ExportTableData> {
    switch (type) {
      case 'GROUPS':
        return this.builder.buildGroups(teacherId, criteria);
      case 'STUDENTS':
        return this.builder.buildStudents(teacherId, criteria);
      case 'ATTENDANCE':
        return this.builder.buildAttendance(teacherId, criteria, false);
      case 'LATENESS':
        return this.builder.buildAttendance(teacherId, criteria, true);
      case 'PEDAGOGICAL_COMMENTS':
        return this.builder.buildPedagogicalComments(teacherId, criteria);
      case 'ACCOUNTING_ACCOUNTS':
        return this.builder.buildAccountingAccounts(teacherId, criteria);
      case 'PAYMENTS':
        return this.builder.buildPayments(teacherId, criteria);
      default:
        throw new BadRequestException(`Type d'export non pris en charge dans cette portée : ${type}`);
    }
  }

  private async resolveTeacherGroupLabel(dto: Pick<CreateExportDto, 'groupIds'>): Promise<string> {
    if (dto.groupIds?.length === 1) {
      const group = await this.prisma.group.findUnique({ where: { id: dto.groupIds[0] }, select: { name: true } });
      if (group) return group.name;
    }
    return 'Tous';
  }

  // --- Professeur (Ch.17.4) --------------------------------------------------------------------

  async requestTeacherExport(teacherId: string, dto: CreateExportDto): Promise<Omit<ExportJob, 'fileBytes'>> {
    if (dto.type === 'ADMIN_STATISTICS' || dto.type === 'RGPD_PERSONAL_DATA') {
      return this.refuse(teacherId, dto, 'REFUSED_UNAUTHORIZED', "Ce type d'export n'est pas accessible à un Professeur (ERR-EXP-004)");
    }

    // RM-EXP-001 : réservé aux offres payantes.
    const plan = await this.subscriptions.getActivePlan(teacherId);
    if (!plan || plan.code === 'DECOUVERTE') {
      return this.refuse(
        teacherId,
        dto,
        'REFUSED_SUBSCRIPTION',
        "Votre offre d'abonnement ne permet pas l'export de données (ERR-EXP-001/RM-EXP-001)",
        true,
      );
    }
    // 17.4 : commentaires pédagogiques réservés à l'offre Pro.
    if (dto.type === 'PEDAGOGICAL_COMMENTS' && plan.code !== 'PRO') {
      return this.refuse(
        teacherId,
        dto,
        'REFUSED_SUBSCRIPTION',
        "L'export des commentaires pédagogiques est réservé à l'offre Pro (ERR-EXP-001)",
        true,
      );
    }

    // RM-EXP-002/003 : jamais les données d'un groupe/élève ne lui appartenant pas.
    if (dto.groupIds?.length) {
      const owned = await this.prisma.group.count({ where: { id: { in: dto.groupIds }, teacherId } });
      if (owned !== dto.groupIds.length) {
        return this.refuse(teacherId, dto, 'REFUSED_UNAUTHORIZED', "Un ou plusieurs groupes ne vous appartiennent pas (RM-EXP-003/ERR-EXP-004)");
      }
    }
    if (dto.studentId) {
      const linked = await this.prisma.enrollment.count({ where: { studentId: dto.studentId, group: { teacherId } } });
      if (linked === 0) {
        return this.refuse(teacherId, dto, 'REFUSED_UNAUTHORIZED', "Cet élève n'est inscrit dans aucun de vos groupes (RM-EXP-003/ERR-EXP-004)");
      }
    }

    const criteria = this.toCriteria(dto);
    const table =
      dto.type === 'STATISTICS'
        ? await this.builder.buildStatistics(teacherId)
        : dto.type === 'DASHBOARD_INDICATORS'
          ? await this.builder.buildDashboardIndicators(teacherId, criteria)
          : await this.buildTeacherScopedTable(dto.type, teacherId, criteria);

    const label =
      dto.type === 'STATISTICS' || dto.type === 'DASHBOARD_INDICATORS' ? 'Global' : await this.resolveTeacherGroupLabel(dto);
    return this.finalizeExport(teacherId, dto.type, dto.format, dto, table, label);
  }

  // --- Parent (Ch.17.4, PDF uniquement) ----------------------------------------------------------

  private async resolveParentLabel(parentId: string, dto: Pick<CreateExportDto, 'studentId'>): Promise<string> {
    if (dto.studentId) {
      const student = await this.prisma.student.findUnique({ where: { id: dto.studentId }, select: { firstName: true, lastName: true } });
      if (student) return `${student.firstName}_${student.lastName}`;
    }
    return 'Enfants';
  }

  async requestParentExport(parentId: string, dto: CreateExportDto): Promise<Omit<ExportJob, 'fileBytes'>> {
    if (!PARENT_TYPES.includes(dto.type)) {
      return this.refuse(parentId, dto, 'REFUSED_UNAUTHORIZED', 'Ce type de donnée ne peut pas être exporté par un Parent (ERR-EXP-004)');
    }
    // RM-EXP-010 : Parent limité au format PDF — jamais dépendant de l'abonnement (Ch.22.7).
    if (dto.format !== 'PDF') {
      return this.refuse(parentId, dto, 'REFUSED_FORMAT', 'Un Parent ne peut exporter qu’au format PDF (ERR-EXP-003/RM-EXP-010)');
    }
    if (dto.studentId) {
      const owns = await this.prisma.student.count({ where: { id: dto.studentId, parentId } });
      if (owns === 0) {
        return this.refuse(parentId, dto, 'REFUSED_UNAUTHORIZED', "Cet enfant n'appartient pas à votre compte (ERR-EXP-004)");
      }
    }

    const criteria = this.toCriteria(dto);
    let table: ExportTableData;
    switch (dto.type) {
      case 'ATTENDANCE':
        table = await this.builder.buildParentAttendance(parentId, criteria);
        break;
      case 'PEDAGOGICAL_COMMENTS':
        table = await this.builder.buildParentComments(parentId, criteria);
        break;
      case 'ACCOUNTING_ACCOUNTS':
        table = await this.builder.buildParentAccounting(parentId, criteria);
        break;
      default:
        table = await this.builder.buildParentPayments(parentId, criteria);
        break;
    }
    const label = await this.resolveParentLabel(parentId, dto);
    return this.finalizeExport(parentId, dto.type, dto.format, dto, table, label);
  }

  // --- Administrateur / Super Admin (Ch.17.4 §Administrateurs, dernier §) -----------------------

  /**
   * PERM-EXP-001 : un Admin (non Super) ne peut exporter que des statistiques agrégées
   * (`ADMIN_STATISTICS`). Le Super Admin "peut exporter toutes les données disponibles" — il peut
   * réutiliser n'importe quel type Professeur, scopé à un `teacherId` précis ou en portée globale
   * (aucun `teacherId`), sans jamais passer par les contrôles d'ownership du Professeur (il n'en a
   * pas besoin, RM-EXP-011 le distingue explicitement de l'Admin délégué).
   */
  async requestAdminExport(actor: AuthenticatedUser, dto: CreateAdminExportDto): Promise<Omit<ExportJob, 'fileBytes'>> {
    const isSuperAdmin = actor.roles.includes('SUPER_ADMIN');

    if (dto.type === 'RGPD_PERSONAL_DATA') {
      return this.refuse(actor.id, dto, 'REFUSED_UNAUTHORIZED', 'Utilisez la portabilité RGPD dédiée pour ce type d’export (POST /admin/data-portability-requests/:id/fulfill)');
    }
    if (!isSuperAdmin && dto.type !== 'ADMIN_STATISTICS') {
      return this.refuse(actor.id, dto, 'REFUSED_UNAUTHORIZED', 'Seul le Super Administrateur peut exporter ce type de données (ERR-EXP-004/RM-EXP-011)');
    }

    const criteria = this.toCriteria(dto);
    let table: ExportTableData;
    let label: string;

    if (dto.type === 'ADMIN_STATISTICS') {
      table = await this.builder.buildAdminStatistics();
      label = 'Global';
    } else if (dto.type === 'STATISTICS' || dto.type === 'DASHBOARD_INDICATORS') {
      if (!dto.teacherId) {
        return this.refuse(actor.id, dto, 'REFUSED_UNAUTHORIZED', 'Un `teacherId` est requis pour ce type d’export (Ch.17.4)');
      }
      table =
        dto.type === 'STATISTICS'
          ? await this.builder.buildStatistics(dto.teacherId)
          : await this.builder.buildDashboardIndicators(dto.teacherId, criteria);
      label = 'Global';
    } else {
      table = await this.buildTeacherScopedTable(dto.type, dto.teacherId ?? null, criteria);
      label = dto.groupIds?.length === 1 ? await this.resolveTeacherGroupLabel(dto) : 'Tous';
    }

    return this.finalizeExport(actor.id, dto.type, dto.format, dto, table, label);
  }

  /** Ch.17.8/PERM-EXP-002 : journal des exports — Super Admin toujours, Admin si `EXP_VIEW_JOURNAL`. */
  async listJournal(filters: { userId?: string; type?: ExportType } = {}) {
    return this.prisma.exportAudit.findMany({
      where: { ...(filters.userId ? { userId: filters.userId } : {}), ...(filters.type ? { type: filters.type } : {}) },
      include: { user: { select: { email: true, roles: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  // --- Cycle de vie du fichier (Ch.17.9, RM-EXP-007/008/015) --------------------------------------

  /** RM-EXP-008 : expiration appliquée paresseusement à la lecture, comme le reste du projet. */
  private async ensureCurrent(job: ExportJob): Promise<ExportJob> {
    if (job.status !== 'READY' || !job.expiresAt || job.expiresAt > new Date()) {
      return job;
    }
    const expired = await this.prisma.exportJob.update({
      where: { id: job.id },
      data: { status: 'EXPIRED', fileBytes: null, fileSize: null },
    });
    // NOT-EXP-006/EVT-EXP-009 : la transition READY -> EXPIRED n'a lieu qu'une seule fois (le
    // prochain appel verra déjà `status: EXPIRED` et ne repassera pas ici), donc pas de doublon.
    await this.notifications.notify({
      recipientUserId: job.requestedById,
      type: 'EXP_EXPIRED',
      priority: 'INFORMATION',
      title: 'Export expiré',
      body: `Votre export "${job.fileName}" a dépassé le délai de conservation de 7 jours et a été supprimé (RM-EXP-008).`,
      refType: 'ExportJob',
      refId: job.id,
    });
    return expired;
  }

  /**
   * RM-EXP-008 : nettoyage réel des exports expirés, en plus de la suppression paresseuse à la
   * lecture (`ensureCurrent`, ci-dessus). Sans ce job, un `ExportJob` `READY` jamais reconsulté par
   * son auteur (ni `GET /exports`, ni `GET /exports/:id`) restait indéfiniment en base avec son
   * `fileBytes` — la conservation "7 jours puis suppression automatique" n'avait alors jamais lieu
   * en pratique. Réutilise `ensureCurrent` (même transition READY -> EXPIRED, même notification
   * NOT-EXP-006) plutôt que de dupliquer la logique de purge ; idempotent comme `ensureCurrent`
   * elle-même (un job déjà `EXPIRED`/`fileBytes: null` n'est pas re-traité, `markOnce` n'est donc
   * pas nécessaire ici contrairement aux jobs de `TemporalJobsService`). Branché sur
   * `TemporalJobsService.runDailyCron`.
   */
  async purgeExpiredExports(now = new Date()): Promise<{ purged: number }> {
    const expired = await this.prisma.exportJob.findMany({
      where: { status: 'READY', expiresAt: { lte: now } },
    });
    for (const job of expired) {
      await this.ensureCurrent(job);
    }
    return { purged: expired.length };
  }

  /**
   * `fileBytes` ne doit JAMAIS transiter par une réponse JSON (métadonnées uniquement) — seul
   * `GET /exports/:id/download` renvoie les octets bruts, avec les bons en-têtes HTTP. Sans ce
   * filtre, `GET /exports/:id` et `GET /exports` sérialiseraient le fichier entier en base64/array
   * dans le JSON à chaque appel, ce que RM-EXP-015 (lien de téléchargement dédié) ne prévoit pas.
   */
  private toJobView(job: ExportJob): Omit<ExportJob, 'fileBytes'> {
    const { fileBytes: _fileBytes, ...view } = job;
    return view;
  }

  private async loadJob(userId: string, id: string): Promise<ExportJob> {
    const job = await this.prisma.exportJob.findUnique({ where: { id } });
    if (!job) {
      throw new NotFoundException('Export introuvable');
    }
    if (job.requestedById !== userId) {
      throw new ForbiddenException('Cet export ne vous appartient pas (RM-EXP-015)');
    }
    return this.ensureCurrent(job);
  }

  async getJob(userId: string, id: string): Promise<Omit<ExportJob, 'fileBytes'>> {
    return this.toJobView(await this.loadJob(userId, id));
  }

  async listMine(userId: string): Promise<Omit<ExportJob, 'fileBytes'>[]> {
    const jobs = await this.prisma.exportJob.findMany({ where: { requestedById: userId }, orderBy: { createdAt: 'desc' } });
    const current = await Promise.all(jobs.map((job) => this.ensureCurrent(job)));
    return current.map((job) => this.toJobView(job));
  }

  /** RM-EXP-015 : seul l'auteur peut télécharger. ERR-EXP-006/007/008 selon l'état du job. */
  async download(userId: string, id: string): Promise<{ fileName: string; format: ExportFormat; bytes: Buffer }> {
    const job = await this.loadJob(userId, id);
    if (job.status === 'PENDING' || job.status === 'PROCESSING') {
      throw new BadRequestException('Export en cours de génération : téléchargement impossible (ERR-EXP-008)');
    }
    if (job.status === 'FAILED') {
      throw new BadRequestException("La génération de cet export a échoué, aucun fichier disponible");
    }
    if (job.status === 'EXPIRED' || !job.fileBytes) {
      throw new BadRequestException('Lien de téléchargement expiré ou fichier déjà supprimé (ERR-EXP-006/007)');
    }
    // EVT-EXP-003
    await this.prisma.exportJob.update({ where: { id }, data: { downloadedAt: new Date() } });
    return { fileName: job.fileName ?? `export.${FORMAT_EXT[job.format]}`, format: job.format, bytes: Buffer.from(job.fileBytes) };
  }

  // --- Portabilité RGPD (Ch.17.4 dernier §/EVT-EXP-008) --------------------------------------------

  /** EVT-EXP-008 : idempotent — une demande déjà en attente n'est jamais dupliquée. */
  async requestDataPortability(userId: string): Promise<DataPortabilityRequest> {
    const existing = await this.prisma.dataPortabilityRequest.findFirst({ where: { userId, status: 'PENDING' } });
    if (existing) return existing;
    const now = new Date();
    return this.prisma.dataPortabilityRequest.create({
      data: { userId, status: 'PENDING', requestedAt: now, dueAt: new Date(now.getTime() + 30 * 86_400_000) },
    });
  }

  async listMyDataPortabilityRequests(userId: string): Promise<DataPortabilityRequest[]> {
    return this.prisma.dataPortabilityRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  /** Traitée par un Administrateur — file d'attente triée par ancienneté (17.4 : "sous 30 jours"). */
  async listDataPortabilityQueue(): Promise<DataPortabilityRequest[]> {
    return this.prisma.dataPortabilityRequest.findMany({
      include: { user: { select: { email: true, roles: true } } },
      orderBy: { requestedAt: 'asc' },
    });
  }

  /**
   * Génère l'export via le même moteur que les exports normaux (`finalizeExport` déclenche déjà
   * NOT-EXP-002 vers `req.userId`, le titulaire des données — inutile de dupliquer une notification).
   */
  async fulfillDataPortabilityRequest(adminId: string, id: string, format: ExportFormat): Promise<DataPortabilityRequest> {
    const req = await this.prisma.dataPortabilityRequest.findUnique({ where: { id } });
    if (!req) {
      throw new NotFoundException('Demande de portabilité introuvable');
    }
    if (req.status === 'FULFILLED') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    const table = await this.builder.buildRgpdPersonalData(req.userId);
    const job = await this.finalizeExport(req.userId, 'RGPD_PERSONAL_DATA', format, { type: 'RGPD_PERSONAL_DATA', format }, table, 'Personnel', adminId);

    return this.prisma.dataPortabilityRequest.update({
      where: { id },
      data: { status: 'FULFILLED', fulfilledAt: new Date(), fulfilledById: adminId, exportJobId: job.id },
    });
  }
}
