import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AddRoleDto } from './dto/add-role.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

function requestMeta(req: any) {
  return {
    ipAddress: req.ip as string | undefined,
    userAgent: req.headers['user-agent'] as string | undefined,
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: any) {
    return this.authService.login(dto, requestMeta(req));
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto, @Req() req: any) {
    return this.authService.refresh(dto.refreshToken, requestMeta(req));
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  logoutAll(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logoutAll(user.id);
  }

  @Post('change-password')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }

  @Post('forgot-password')
  @HttpCode(204)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(204)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /** Ch. I.3 : reset assisté — un Professeur (pour l'un de ses Parents) ou un Administrateur
   * (pour n'importe quel compte) génère un lien de réinitialisation à usage unique, transmis
   * hors bande. Le contrôle fin (qui peut réinitialiser qui) vit dans `AuthService`. */
  @Post('users/:id/assisted-reset-link')
  @UseGuards(JwtAuthGuard)
  generateAssistedResetLink(@CurrentUser() user: AuthenticatedUser, @Param('id') targetUserId: string) {
    return this.authService.generateAssistedResetLink(user, targetUserId);
  }

  @Post('me/deactivate')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  deactivateMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.deactivateMe(user.id);
  }

  /** RM-CYC-013/018 : demande de suppression/anonymisation self-service (avec confirmation côté frontend). */
  @Post('me/request-deletion')
  @UseGuards(JwtAuthGuard)
  requestDeletion(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.requestDeletion(user.id);
  }

  /** §9.10, RM-SEC-026/027/028 : journal des connexions du titulaire du compte. */
  @Get('me/login-history')
  @UseGuards(JwtAuthGuard)
  loginHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.listMyLoginHistory(user.id);
  }

  /** RM-ACC-002 : ajoute le second rôle métier (Professeur/Parent) au compte actif de l'appelant. */
  @Post('me/add-role')
  @UseGuards(JwtAuthGuard)
  addRole(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddRoleDto) {
    return this.authService.addRole(user.id, dto);
  }

  @Post('users/:id/force-logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  forceLogout(@Param('id') targetUserId: string) {
    return this.authService.forceLogout(targetUserId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
