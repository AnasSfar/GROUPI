import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { LevelPoolsModule } from '../level-pools/level-pools.module';
import { GroupMembersModule } from '../group-members/group-members.module';
import { ParentProfileModule } from '../parent-profile/parent-profile.module';
import { TeacherInvitationController } from './teacher-invitation.controller';
import { PublicInvitationsController } from './public-invitations.controller';
import { ParentInvitationsService } from './parent-invitations.service';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    SubscriptionsModule,
    LevelPoolsModule,
    GroupMembersModule,
    ParentProfileModule,
  ],
  controllers: [TeacherInvitationController, PublicInvitationsController],
  providers: [ParentInvitationsService, OptionalJwtAuthGuard],
  // Exporté pour le hook d'ouverture d'année académique (`referentials`, RM-INV-006).
  exports: [ParentInvitationsService],
})
export class ParentInvitationsModule {}
