import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LevelPoolsModule } from '../level-pools/level-pools.module';
import { AdminController } from './admin.controller';
import { AccountLifecycleService } from './account-lifecycle.service';
import { AdministratorsController } from './administrators.controller';
import { AdministratorsService } from './administrators.service';
import { StudentsAdminController } from './students-admin.controller';
import { StudentsAdminService } from './students-admin.service';

@Module({
  // LevelPoolsModule : hook RM-POOL-001 (Avenant 01, Ch. B.3) sur la 1ère validation d'un Professeur.
  // Avenant 01, Ch. I.4/I.7 : EmailModule retiré (AccountLifecycleService ne dépend plus que de
  // NotificationsService, in-app uniquement).
  imports: [AuthModule, NotificationsModule, LevelPoolsModule],
  controllers: [AdminController, AdministratorsController, StudentsAdminController],
  providers: [AccountLifecycleService, AdministratorsService, StudentsAdminService],
})
export class AdminModule {}
