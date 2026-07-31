/**
 * Point d'entrée fonction serverless Vercel (Root Directory = apps/api, voir vercel.json).
 * Volontairement minimal et sans import de types express : c'est le SEUL fichier que le bundler
 * Node de Vercel compile lui-même (avec ses propres réglages TS, différents de notre tsconfig
 * local) — toute la vraie logique vit dans src/vercel-handler.ts, compilée par notre propre
 * `nest build` (voir "buildCommand" dans vercel.json) et simplement requise ici en JS déjà prêt.
 */
export default function handler(req: unknown, res: unknown): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { handleVercelRequest } = require('../dist/src/vercel-handler');
  return handleVercelRequest(req, res);
}
