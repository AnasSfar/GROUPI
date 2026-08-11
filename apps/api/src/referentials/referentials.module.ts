import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReferentialsController } from './referentials.controller';
import { AdminReferentialsController } from './admin-referentials.controller';

@Module({
  imports: [AuthModule],
  controllers: [ReferentialsController, AdminReferentialsController],
})
export class ReferentialsModule {}
