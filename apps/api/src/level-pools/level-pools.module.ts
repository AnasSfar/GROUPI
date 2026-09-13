import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LevelPoolsController } from './level-pools.controller';
import { LevelPoolsService } from './level-pools.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [LevelPoolsController],
  providers: [LevelPoolsService],
  // Exporté pour `parent-invitations` (rattachement à la consommation d'un lien), `teacher-profile`
  // (hook de validation d'un niveau enseigné, RM-POOL-001) et `referentials` (hook d'ouverture d'une
  // nouvelle année académique) et `group-members` (vérification RM-AFF-002 à l'affectation).
  exports: [LevelPoolsService],
})
export class LevelPoolsModule {}
