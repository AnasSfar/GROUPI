import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { AdminController } from './admin.controller';
import { AccountLifecycleService } from './account-lifecycle.service';
import { AdministratorsController } from './administrators.controller';
import { AdministratorsService } from './administrators.service';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [AdminController, AdministratorsController],
  providers: [AccountLifecycleService, AdministratorsService],
})
export class AdminModule {}
