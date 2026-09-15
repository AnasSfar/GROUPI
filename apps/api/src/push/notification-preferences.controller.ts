import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { NotificationPreferencesService } from './notification-preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('notification-preferences')
@UseGuards(JwtAuthGuard)
export class NotificationPreferencesController {
  constructor(private readonly preferences: NotificationPreferencesService) {}

  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.preferences.getMine(user.id);
  }

  @Patch('me')
  updateMine(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePreferencesDto) {
    return this.preferences.updateMine(user.id, dto.preferences);
  }
}
