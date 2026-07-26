import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GroupSessionsController } from './group-sessions.controller';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [AuthModule],
  controllers: [GroupSessionsController, SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
