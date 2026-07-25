import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AccountLifecycleService } from './account-lifecycle.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AccountLifecycleService],
})
export class AdminModule {}
