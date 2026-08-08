import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Sentry } from '../instrumentation';

/**
 * Remonte à Sentry uniquement les erreurs inattendues (5xx) : les 4xx (validation, auth, règles
 * métier ERR-*) sont des HttpException volontaires levées partout dans ce codebase pour signaler
 * un cas prévu, pas une panne — les capturer noierait le signal utile sous du bruit métier normal.
 *
 * Sans SENTRY_DSN, Sentry.captureException est un no-op (SDK non initialisé, voir instrumentation.ts)
 * — ce filtre délègue ensuite systématiquement à BaseExceptionFilter pour ne rien changer au
 * comportement de réponse HTTP existant.
 */
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    if (status >= 500) {
      Sentry.captureException(exception);
    }
    super.catch(exception, host);
  }
}
