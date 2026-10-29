// Límites del chat del Segundo Cerebro (los usa api/cerebro-chat.ts).
// Cualquier cuenta de Google puede iniciar sesión en Firebase, así que el endpoint
// se restringe a los uids permitidos y a una cantidad de pedidos por minuto.
// Ver docs/05-seguridad/modelo-amenazas.md.

export const MAX_BODY_CARACTERES = 32_000;
export const PEDIDOS_POR_MINUTO = 20;
export const MAX_ITEMS_CONTEXTO = 5;

/** ALLOWED_UIDS="uid1,uid2" → Set. Vacío o sin definir → null (no se restringe). */
export function uidsPermitidos(valor: string | undefined): Set<string> | null {
  const uids = (valor ?? '').split(',').map(u => u.trim()).filter(Boolean);
  return uids.length ? new Set(uids) : null;
}

export function uidPermitido(uid: string, permitidos: Set<string> | null): boolean {
  return permitidos === null || permitidos.has(uid);
}

/**
 * Limitador en memoria por clave (uid). Vive mientras viva la instancia de la
 * función: es una barrera de mejor esfuerzo, no un límite global.
 */
export function crearLimitador(max = PEDIDOS_POR_MINUTO, ventanaMs = 60_000) {
  const pedidos = new Map<string, number[]>();
  return (clave: string, ahora = Date.now()): boolean => {
    const recientes = (pedidos.get(clave) ?? []).filter(t => ahora - t < ventanaMs);
    const permitido = recientes.length < max;
    if (permitido) recientes.push(ahora);
    pedidos.set(clave, recientes);
    return permitido;
  };
}

/** Largo del body serializado; Infinity si no se puede serializar. */
export function largoBody(body: unknown): number {
  try { return JSON.stringify(body ?? {}).length; } catch { return Infinity; }
}

/** Recorta cada lista del contexto (el cliente manda las 3 más relevantes de cada tipo). */
export function limitarContexto<T extends Record<string, unknown>>(contexto: T | undefined): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(contexto ?? {})) {
    out[k] = Array.isArray(v) ? v.slice(0, MAX_ITEMS_CONTEXTO) : v;
  }
  return out as T;
}
