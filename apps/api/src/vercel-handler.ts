import * as express from 'express';
import type { Express, Request, Response } from 'express';
import { createApp } from './create-app';

/**
 * Compilé normalement par `nest build` (tsc, apps/api/tsconfig.json) — jamais transpilé par le
 * bundler serverless de Vercel lui-même, qui traite `express()`/le narrowing différemment de
 * notre tsc local. `api/index.ts` ne fait que `require()` le JS déjà compilé issu de ce fichier.
 *
 * `server`/`ready` sont module-scope : réutilisés entre invocations à chaud du même conteneur
 * lambda (cold start = un seul `createApp()`, warm = juste `server(req, res)`).
 */
let server: Express | undefined;
let ready: Promise<void> | undefined;

async function ensureReady(): Promise<Express> {
  if (!server) {
    const instance = express();
    server = instance;
    ready = createApp(instance)
      .then((app) => app.init())
      .then(() => undefined);
  }
  await ready;
  return server as Express;
}

export async function handleVercelRequest(req: Request, res: Response): Promise<void> {
  const app = await ensureReady();
  app(req, res);
}
