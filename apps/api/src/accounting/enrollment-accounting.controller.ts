import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AccountingService } from './accounting.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { CorrectPaymentDto } from './dto/correct-payment.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';

/**
 * Ch.15 : compte de suivi comptable d'une inscription — consultation Professeur/Parent (RM-CPT-013),
 * écriture réservée au Professeur (PERM-CPT-001/002/006). `SubscriptionGuard` ne s'applique qu'au
 * Professeur (Ch.22), no-op pour le Parent en lecture.
 */
@Controller('enrollments/:enrollmentId/accounting')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
export class EnrollmentAccountingController {
  constructor(private readonly service: AccountingService) {}

  @Get()
  @Roles(Role.TEACHER, Role.PARENT, Role.SUPER_ADMIN)
  get(@CurrentUser() user: AuthenticatedUser, @Param('enrollmentId') enrollmentId: string) {
    const role = user.roles.includes(Role.SUPER_ADMIN)
      ? 'SUPER_ADMIN'
      : user.roles.includes(Role.TEACHER)
        ? 'TEACHER'
        : 'PARENT';
    return this.service.getAccountDetail(user.id, role, enrollmentId);
  }

  @Post('payments')
  @Roles(Role.TEACHER)
  recordPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.service.recordPayment(user.id, enrollmentId, dto);
  }

  @Patch('payments/:entryId')
  @Roles(Role.TEACHER)
  correctPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('enrollmentId') enrollmentId: string,
    @Param('entryId') entryId: string,
    @Body() dto: CorrectPaymentDto,
  ) {
    return this.service.correctPayment(user.id, enrollmentId, entryId, dto);
  }

  @Post('payments/:entryId/cancel')
  @Roles(Role.TEACHER)
  cancelPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('enrollmentId') enrollmentId: string,
    @Param('entryId') entryId: string,
  ) {
    return this.service.cancelPayment(user.id, enrollmentId, entryId);
  }

  @Post('reminder')
  @Roles(Role.TEACHER)
  sendReminder(@CurrentUser() user: AuthenticatedUser, @Param('enrollmentId') enrollmentId: string) {
    return this.service.sendPaymentReminder(user.id, enrollmentId);
  }

  @Post('adjustments')
  @Roles(Role.TEACHER)
  createAdjustment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('enrollmentId') enrollmentId: string,
    @Body() dto: CreateAdjustmentDto,
  ) {
    return this.service.createAdjustment(user.id, enrollmentId, dto);
  }
}
