import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SmsModule } from '../sms/sms.module';
import { PushModule } from '../push/push.module';
import { MessagingService } from '../messaging/messaging.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TeacherProfileService } from '../teacher-profile/teacher-profile.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { TeacherValidatedGuard } from './guards/teacher-validated.guard';

@Module({
  imports: [
    PassportModule,
    // Avenant 01, Ch. I.9 (RM-SEC-052) : `EmailModule` retiré (canal e-mail entièrement supprimé du
    // produit). `SmsModule` reste importé : le téléphone est le canal d'identité (RM-SEC-001),
    // `auth.service.ts` continue de l'utiliser pour la vérification/le reset/le verrouillage par SMS
    // (best-effort, journalisé si aucun fournisseur configuré — voir `SmsService`). `MessagingService`
    // ne couvre que le centre d'activités in-app (Ch. I.4/I.7), pas ces envois hors bande ponctuels.
    SmsModule,
    // MessagingService (fourni directement ci-dessous, pas via MessagingModule — voir commentaire
    // `providers`) dépend maintenant aussi de PushModule (routage push, best-effort).
    PushModule,
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
  // NotificationsService, MessagingService et TeacherProfileService fournis directement ici (pas
  // via leurs modules respectifs) : TeacherProfileModule importe déjà AuthModule (pour ses guards),
  // l'importer en retour créerait un cycle ; même raisonnement pour NotificationsModule/
  // MessagingModule. Ces services ne dépendent que de PrismaService (module global) et de
  // PushModule (importé ci-dessus, sans cycle — PushModule n'importe rien en retour), les fournir
  // deux fois est sans danger.
  providers: [
    AuthService,
    PasswordService,
    JwtStrategy,
    RolesGuard,
    PermissionsGuard,
    TeacherValidatedGuard,
    NotificationsService,
    MessagingService,
    TeacherProfileService,
  ],
  exports: [AuthService, PasswordService, RolesGuard, PermissionsGuard, TeacherValidatedGuard],
})
export class AuthModule {}
