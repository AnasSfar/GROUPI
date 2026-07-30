import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/**
 * Vercel Cron : quand la variable d'env `CRON_SECRET` est définie sur le projet, Vercel ajoute
 * automatiquement `Authorization: Bearer <CRON_SECRET>` aux requêtes qu'il déclenche — même nom
 * de variable ici pour profiter de ce mécanisme sans configuration supplémentaire côté Vercel.
 * Toujours requis, même en dev — pas de bypass si absent (ces routes déclenchent des envois
 * d'e-mails et des mutations métier, ne doivent jamais être accessibles sans secret).
 */
@Injectable()
export class CronSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new UnauthorizedException('CRON_SECRET non configuré côté serveur');
    }

    const request = context.switchToHttp().getRequest();
    const header = request.headers['authorization'];
    if (header !== `Bearer ${secret}`) {
      throw new UnauthorizedException('Secret cron invalide');
    }

    return true;
  }
}
