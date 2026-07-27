import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AccountingModule } from '../accounting/accounting.module';
import { ExportsService } from './exports.service';
import { ExportDataBuilder } from './export-data.builder';
import { ExportsController } from './exports.controller';
import { AdminExportsController } from './admin-exports.controller';
import { DataPortabilityController, AdminDataPortabilityController } from './data-portability.controller';

@Module({
  imports: [AuthModule, EmailModule, NotificationsModule, SubscriptionsModule, AccountingModule],
  controllers: [ExportsController, AdminExportsController, DataPortabilityController, AdminDataPortabilityController],
  providers: [ExportsService, ExportDataBuilder],
  exports: [ExportsService],
})
export class ExportsModule {}
