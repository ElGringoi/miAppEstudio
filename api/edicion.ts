// GET /api/edicion — edición diaria del Diario (función serverless de Vercel).
// La respuesta es igual para todos: el CDN la cachea 30 min y la renueva sola.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { obtenerEdicion } from '../server/diario/edicion.js';

export default async function handler(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const { edicion, degradada } = await obtenerEdicion();
    res.statusCode = 200;
    // Si faltaron fuentes, se cachea solo un minuto para reintentar pronto.
    res.setHeader('Cache-Control', degradada
      ? 'public, s-maxage=60'
      : 'public, s-maxage=1800, stale-while-revalidate=86400');
    res.end(JSON.stringify(edicion));
  } catch (e) {
    console.error('[diario] error armando la edición', e);
    res.statusCode = 500;
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'No se pudo armar la edición' }));
  }
}
