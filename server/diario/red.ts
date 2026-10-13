// Pedidos HTTP con timeout, reintento ante error de red, lectura parcial y
// decodificación según el charset declarado. Corre en Node (Vercel) y en el
// middleware de Vite.

const UA = 'Mozilla/5.0 (compatible; LaGaceta/1.0; diario personal)';

export interface Respuesta {
  bytes:    Uint8Array;
  tipo:     string | null;
  urlFinal: string;
}

interface OpcionesPedido {
  timeoutMs:   number;
  limite:      number;        // deadline global (timestamp ms)
  maxBytes?:   number;        // corta la lectura al llegar a este tamaño
  reintentos?: number;
}

export class SinTiempo extends Error {}

async function leerCuerpo(res: Response, maxBytes: number | undefined, ctrl: AbortController): Promise<Uint8Array> {
  if (!maxBytes || !res.body) return new Uint8Array(await res.arrayBuffer());
  const lector = res.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await lector.read();
    if (done || !value) break;
    partes.push(value);
    total += value.length;
  }
  if (total >= maxBytes) ctrl.abort();
  const salida = new Uint8Array(total);
  let pos = 0;
  for (const p of partes) { salida.set(p, pos); pos += p.length; }
  return salida;
}

export async function pedir(url: string, op: OpcionesPedido): Promise<Respuesta> {
  const reintentos = op.reintentos ?? 1;
  for (let intento = 0; ; intento++) {
    const restante = op.limite - Date.now();
    if (restante < 300) throw new SinTiempo(url);
    const ctrl = new AbortController();
    const reloj = setTimeout(() => ctrl.abort(), Math.min(op.timeoutMs, restante));
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        redirect: 'follow',
        headers: { 'User-Agent': UA, Accept: '*/*' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
      const bytes = await leerCuerpo(res, op.maxBytes, ctrl);
      return { bytes, tipo: res.headers.get('content-type'), urlFinal: res.url || url };
    } catch (e) {
      // Solo se reintenta un error de red; un timeout o un HTTP 4xx/5xx no.
      const errorDeRed = e instanceof TypeError && !ctrl.signal.aborted;
      if (!errorDeRed || intento >= reintentos) throw e;
    } finally {
      clearTimeout(reloj);
    }
  }
}

/** Decodifica con el charset del prólogo XML o del Content-Type (Vandal usa latin1). */
export function decodificar(bytes: Uint8Array, tipo: string | null): string {
  const cabecera = new TextDecoder('latin1').decode(bytes.subarray(0, 300));
  const declarado =
    /<\?xml[^>]*encoding=["']([\w-]+)["']/i.exec(cabecera)?.[1] ??
    /charset=([\w-]+)/i.exec(tipo ?? '')?.[1] ??
    'utf-8';
  try {
    return new TextDecoder(declarado.toLowerCase()).decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

export async function pedirTexto(url: string, op: OpcionesPedido): Promise<string> {
  const r = await pedir(url, op);
  return decodificar(r.bytes, r.tipo);
}

export async function pedirJson(url: string, op: OpcionesPedido): Promise<unknown> {
  const r = await pedir(url, op);
  return JSON.parse(new TextDecoder('utf-8').decode(r.bytes)) as unknown;
}

/** Ejecuta fn sobre items con a lo sumo n tareas a la vez. Un error deja undefined. */
export async function enPool<T, R>(items: readonly T[], n: number, fn: (item: T) => Promise<R>): Promise<Array<R | undefined>> {
  const salida: Array<R | undefined> = new Array(items.length).fill(undefined);
  let siguiente = 0;
  const trabajador = async () => {
    while (siguiente < items.length) {
      const k = siguiente++;
      try {
        salida[k] = await fn(items[k]);
      } catch (e) {
        if (!(e instanceof SinTiempo)) console.warn('[diario]', e instanceof Error ? e.message : e);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, trabajador));
  return salida;
}
