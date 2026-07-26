import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PreEnrollmentsController } from './pre-enrollments.controller';
import { GroupCompatiblePreEnrollmentsController } from './group-compatible-pre-enrollments.controller';
import { PreEnrollmentsService } from './pre-enrollments.service';

@Module({
  imports: [AuthModule],
  controllers: [PreEnrollmentsController, GroupCompatiblePreEnrollmentsController],
  providers: [PreEnrollmentsService],
})
export class PreEnrollmentsModule {}
