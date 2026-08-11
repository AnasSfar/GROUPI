import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EmailModule } from '../email/email.module';
import { NotificationsService } from '../notifications/notifications.service';
import { TeacherProfileService } from '../teacher-profile/teacher-profile.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_TTL', '15m') },
      }),
    }),
  ],
  controllers: [AuthController],
  // NotificationsService et TeacherProfileService fournis directement ici (pas via leurs modules
  // respectifs) : TeacherProfileModule importe déjà AuthModule (pour ses guards), l'importer en
  // retour créerait un cycle ; même raisonnement pour NotificationsModule. Ces deux services ne
  // dépendent que de PrismaService (module global), les fournir deux fois est sans danger.
  providers: [
    AuthService,
    PasswordService,
    JwtStrategy,
    RolesGuard,
    PermissionsGuard,
    NotificationsService,
    TeacherProfileService,
  ],
  exports: [AuthService, PasswordService, RolesGuard, PermissionsGuard],
})
export class AuthModule {}
