import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AccountLifecycleService } from './account-lifecycle.service';
import { AdministratorsController } from './administrators.controller';
import { AdministratorsService } from './administrators.service';
import { StudentsAdminController } from './students-admin.controller';
import { StudentsAdminService } from './students-admin.service';

@Module({
  imports: [AuthModule, EmailModule, NotificationsModule],
  controllers: [AdminController, AdministratorsController, StudentsAdminController],
  providers: [AccountLifecycleService, AdministratorsService, StudentsAdminService],
})
export class AdminModule {}
