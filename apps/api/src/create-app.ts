import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Express } from 'express';
import { AppModule } from './app.module';

/**
 * Bootstrap partagé entre `main.ts` (process persistant, dev local) et `api/index.ts`
 * (fonction serverless Vercel, réutilise une instance Express fournie par l'appelant).
 */
export async function createApp(expressInstance?: Express): Promise<INestApplication> {
  const app = expressInstance
    ? await NestFactory.create(AppModule, new ExpressAdapter(expressInstance))
    : await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // apps/web et apps/api sont deux domaines Vercel distincts en prod (pas de proxy same-origin
  // comme en dev via Vite) — CORS_ORIGIN absent = désactivé, comportement local inchangé.
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin.split(',').map((origin) => origin.trim()),
      credentials: true,
    });
  }

  return app;
}
