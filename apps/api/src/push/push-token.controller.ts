import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PushTokenService } from './push-token.service';
import { RegisterTokenDto, UnregisterTokenDto } from './dto/register-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushTokenController {
  constructor(private readonly pushTokens: PushTokenService) {}

  @Post('register-token')
  async register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterTokenDto) {
    await this.pushTokens.registerToken(user.id, dto.token, dto.platform);
    return { ok: true };
  }

  @Post('unregister-token')
  async unregister(@CurrentUser() user: AuthenticatedUser, @Body() dto: UnregisterTokenDto) {
    await this.pushTokens.unregisterToken(user.id, dto.token);
    return { ok: true };
  }
}
