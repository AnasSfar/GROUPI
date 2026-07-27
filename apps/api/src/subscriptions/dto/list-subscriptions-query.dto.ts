import { IsIn, IsOptional } from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

const STATUSES: SubscriptionStatus[] = ['PENDING_PAYMENT', 'ACTIVE', 'SUSPENDED', 'EXPIRED'];

export class ListSubscriptionsQueryDto {
  @IsOptional()
  @IsIn(STATUSES)
  status?: SubscriptionStatus;
}
