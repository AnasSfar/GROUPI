import { IsIn, IsOptional } from 'class-validator';
import { UserStatus } from '@prisma/client';

const STATUSES: UserStatus[] = ['PENDING_VALIDATION', 'ACTIVE', 'SUSPENDED', 'DISABLED', 'ARCHIVED'];

export class ListUsersQueryDto {
  @IsOptional()
  @IsIn(STATUSES)
  status?: UserStatus;
}
