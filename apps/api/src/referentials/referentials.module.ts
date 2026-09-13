import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LevelPoolsModule } from '../level-pools/level-pools.module';
import { ParentInvitationsModule } from '../parent-invitations/parent-invitations.module';
import { ReferentialsController } from './referentials.controller';
import { AdminReferentialsController } from './admin-referentials.controller';

@Module({
  // LevelPoolsModule/ParentInvitationsModule : hook RM-INV-006/B.3 sur l'ouverture d'une nouvelle
  // année académique (Avenant 01, Ch. A/B) — groupes de niveau + liens d'invitation reconduits.
  imports: [AuthModule, LevelPoolsModule, ParentInvitationsModule],
  controllers: [ReferentialsController, AdminReferentialsController],
})
export class ReferentialsModule {}
