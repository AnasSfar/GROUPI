import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AccountingService } from './accounting.service';
import { RecordSessionPaymentDto } from './dto/record-session-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { SubscriptionGuard } from '../subscriptions/subscription.guard';

/** Ch.16 : saisie des paiements séance par séance — miroir de SessionAttendanceController (Ch.14). */
@Controller('sessions/:sessionId/payments')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@Roles(Role.TEACHER)
export class SessionPaymentsController {
  constructor(private readonly service: AccountingService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Param('sessionId') sessionId: string) {
    return this.service.listSessionPayments(user.id, sessionId);
  }

  @Post(':studentId')
  record(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
    @Param('studentId') studentId: string,
    @Body() dto: RecordSessionPaymentDto,
  ) {
    return this.service.recordSessionPayment(user.id, sessionId, studentId, dto);
  }
}
