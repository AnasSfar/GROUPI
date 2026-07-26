import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EnrollmentsController } from './enrollments.controller';
import { GroupEnrollmentsController } from './group-enrollments.controller';
import { EnrollmentsService } from './enrollments.service';

@Module({
  imports: [AuthModule],
  controllers: [EnrollmentsController, GroupEnrollmentsController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule {}
