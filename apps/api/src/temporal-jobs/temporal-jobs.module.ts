import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchoolSituationModule } from '../school-situation/school-situation.module';
import { PreEnrollmentsModule } from '../pre-enrollments/pre-enrollments.module';
import { EnrollmentConversationsModule } from '../enrollment-conversations/enrollment-conversations.module';
import { GroupAnnouncementsModule } from '../group-announcements/group-announcements.module';
import { ExportsModule } from '../exports/exports.module';
import { AuthModule } from '../auth/auth.module';
import { TemporalJobsService } from './temporal-jobs.service';
import { TemporalJobsController } from './temporal-jobs.controller';

@Module({
  // RM-PRE-028 : PreEnrollmentsModule importé uniquement pour injecter PreEnrollmentsService
  // (closeStaleForOpenedAcademicYear) dans runDailyCron() — cf. commentaire dans temporal-jobs.service.ts.
  // RM-COM-016 : EnrollmentConversationsModule/GroupAnnouncementsModule importés uniquement pour
  // injecter purgeOldComments()/purgeOldAnnouncements() (purge de rétention mensuelle).
  // RM-EXP-008 : ExportsModule importé uniquement pour injecter ExportsService.purgeExpiredExports()
  // dans runDailyCron().
  // RM-TRS-013/RM-GEN-020 : AuthModule importé uniquement pour injecter AuthService.sweepStaleDisabledAccounts().
  imports: [
    ScheduleModule.forRoot(),
    EmailModule,
    NotificationsModule,
    SchoolSituationModule,
    PreEnrollmentsModule,
    EnrollmentConversationsModule,
    GroupAnnouncementsModule,
    ExportsModule,
    AuthModule,
  ],
  controllers: [TemporalJobsController],
  providers: [TemporalJobsService],
  exports: [TemporalJobsService],
})
export class TemporalJobsModule {}
