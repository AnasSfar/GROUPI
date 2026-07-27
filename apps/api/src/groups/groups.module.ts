import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [AuthModule, SubscriptionsModule],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
