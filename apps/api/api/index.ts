import * as express from 'express';
import type { Express, Request, Response } from 'express';
import { createApp } from '../src/create-app';

/**
 * Point d'entrée fonction serverless Vercel (Root Directory = apps/api, voir vercel.json).
 * `server`/`ready` sont module-scope : réutilisés entre invocations à chaud du même conteneur
 * lambda (cold start = un seul `createApp()`, warm = juste `server(req, res)`).
 */
let server: Express | undefined;
let ready: Promise<void> | undefined;

async function ensureReady(): Promise<Express> {
  if (!server) {
    const instance = express();
    server = instance;
    ready = createApp(instance).then((app) => app.init()).then(() => undefined);
  }
  await ready;
  return server;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const app = await ensureReady();
  app(req, res);
}
