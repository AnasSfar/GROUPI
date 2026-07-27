import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentAuthorRole, EnrollmentComment, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const EDIT_WINDOW_MS = 48 * 60 * 60 * 1000;

/**
 * Ch.19.3, ERR-COM-002 : un nouveau commentaire ne peut être ajouté que sur une inscription dont
 * la relation pédagogique est encore vivante. Le référentiel n'énumère pas les statuts exacts
 * couverts par "terminée ou archivée" — choix documenté ici : ACTIVE/SUSPENDED restent ouverts à
 * l'écriture, tout le reste (PENDING_VALIDATION/REJECTED/CANCELLED/EXPIRED/ARCHIVED) est fermé.
 */
const OPEN_STATUSES = new Set(['ACTIVE', 'SUSPENDED']);

const INCLUDE_ENROLLMENT = {
  student: { select: { parentId: true } },
  group: { select: { teacherId: true, name: true } },
} satisfies Prisma.EnrollmentInclude;

@Injectable()
export class EnrollmentConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * RM-COM-004/ERR-COM-001/006 : le fil n'est accessible qu'au Professeur du groupe et au Parent
   * de l'élève. RM-COM-013 : le Super Administrateur peut consulter (jamais écrire) dans le cadre
   * d'une procédure d'assistance/audit — `allowSuperAdminRead` n'est utilisé que par `list()`.
   */
  private async loadEnrollment(userId: string, enrollmentId: string, allowSuperAdminRead = false) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: INCLUDE_ENROLLMENT,
    });
    if (!enrollment) {
      throw new NotFoundException('Inscription introuvable');
    }
    const isParent = enrollment.student.parentId === userId;
    const isTeacher = enrollment.group.teacherId === userId;
    if (!isParent && !isTeacher && !allowSuperAdminRead) {
      throw new ForbiddenException("Cette inscription n'appartient pas à votre compte (ERR-COM-001/006)");
    }
    return { enrollment, isParent, isTeacher };
  }

  /** Ch.19.3/RM-COM-005 : le fil reste consultable même après la clôture de l'inscription. */
  async list(userId: string, enrollmentId: string, isSuperAdmin = false): Promise<EnrollmentComment[]> {
    await this.loadEnrollment(userId, enrollmentId, isSuperAdmin);
    return this.prisma.enrollmentComment.findMany({
      where: { enrollmentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** RM-COM-006/007 : "figé" est calculé à la lecture, jamais stocké. */
  private isEditable(comment: EnrollmentComment, thread: EnrollmentComment[]): boolean {
    if (comment.deletedAt) return false;
    const within48h = Date.now() - comment.createdAt.getTime() <= EDIT_WINDOW_MS;
    const hasReply = thread.some((c) => c.authorRole !== comment.authorRole && c.createdAt > comment.createdAt);
    return within48h && !hasReply;
  }

  async create(userId: string, enrollmentId: string, dto: CreateCommentDto): Promise<EnrollmentComment> {
    const { enrollment, isTeacher } = await this.loadEnrollment(userId, enrollmentId);
    if (!OPEN_STATUSES.has(enrollment.status)) {
      throw new BadRequestException(
        'Inscription terminée ou archivée : nouveau commentaire impossible (ERR-COM-002)',
      );
    }

    const authorRole: CommentAuthorRole = isTeacher ? 'TEACHER' : 'PARENT';
    const comment = await this.prisma.enrollmentComment.create({
      data: { enrollmentId, authorId: userId, authorRole, body: dto.body },
    });

    // NOT-COM-001 (Professeur -> Parent) / NOT-COM-002 (Parent -> Professeur), hors chemin
    // critique : la création du commentaire ne doit jamais être annulée par un échec de notification.
    const recipientUserId = authorRole === 'TEACHER' ? enrollment.student.parentId : enrollment.group.teacherId;
    await this.notifications.notify({
      recipientUserId,
      type: authorRole === 'TEACHER' ? 'COM_COMMENT_CREATED' : 'COM_COMMENT_REPLIED',
      priority: 'IMPORTANT',
      title: authorRole === 'TEACHER' ? 'Nouveau commentaire pédagogique' : 'Réponse à un commentaire',
      body: `${authorRole === 'TEACHER' ? 'Le Professeur' : 'Le Parent'} a ajouté un commentaire sur l'inscription au groupe "${enrollment.group.name}".`,
      refType: 'Enrollment',
      refId: enrollmentId,
    });

    return comment;
  }

  async update(userId: string, enrollmentId: string, commentId: string, dto: UpdateCommentDto): Promise<EnrollmentComment> {
    await this.loadEnrollment(userId, enrollmentId);
    const thread = await this.prisma.enrollmentComment.findMany({ where: { enrollmentId } });
    const comment = thread.find((c) => c.id === commentId);
    if (!comment) {
      throw new NotFoundException('Commentaire introuvable');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Seul l’auteur peut modifier ce commentaire');
    }
    if (!this.isEditable(comment, thread)) {
      throw new BadRequestException('Commentaire figé : modification refusée (ERR-COM-004)');
    }
    return this.prisma.enrollmentComment.update({
      where: { id: commentId },
      data: { body: dto.body, editedAt: new Date() },
    });
  }

  async remove(userId: string, enrollmentId: string, commentId: string): Promise<EnrollmentComment> {
    await this.loadEnrollment(userId, enrollmentId);
    const thread = await this.prisma.enrollmentComment.findMany({ where: { enrollmentId } });
    const comment = thread.find((c) => c.id === commentId);
    if (!comment) {
      throw new NotFoundException('Commentaire introuvable');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Seul l’auteur peut supprimer ce commentaire');
    }
    if (!this.isEditable(comment, thread)) {
      throw new BadRequestException('Commentaire figé : suppression refusée (ERR-COM-004)');
    }
    return this.prisma.enrollmentComment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
  }
}
