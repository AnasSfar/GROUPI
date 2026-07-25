import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReferentialsController } from './referentials.controller';

@Module({
  imports: [AuthModule],
  controllers: [ReferentialsController],
})
export class ReferentialsModule {}
