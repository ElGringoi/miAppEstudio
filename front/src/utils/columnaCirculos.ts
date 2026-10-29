// Columnas de opinión sobre la vida social ("Mis círculos"). Las frases salen de
// plantillas con datos reales: no se inventa nada y no se manda nada afuera.
// Cada hecho suma una mirada editorial; la bajada de la columna usa otras
// frases, así no se repiten dentro del mismo día. La elección es por hash del
// hecho: una misma recarga muestra siempre el mismo texto.

import type { PropuestaFecha } from './inboxFecha';

/** Qué hay que hacer al tocar "Agendar" en una propuesta. */
export interface Accion { itemId: string; grupoId: string; propuesta: PropuestaFecha }

export type Hecho =
  | { tipo: 'mensaje';   grupoId: string; circulo: string; fecha: string; de?: string; texto: string }
  | { tipo: 'propuesta'; grupoId: string; circulo: string; fecha: string; hora?: string; texto: string; accion: Accion }
  | { tipo: 'evento';    grupoId: string; circulo: string; fecha: string; hora?: string; titulo: string }
  | { tipo: 'nota';      grupoId: string; circulo: string; fecha: string; titulo: string }
  | { tipo: 'fecha';     grupoId: string; circulo: string; fecha: string; titulo: string };

export interface Parrafo { texto: string; accion?: Accion }
export interface Columna { fecha: string; titular: string; bajada: string; parrafos: Parrafo[] }

const MAX_PARRAFOS = 6;
const MAX_PASADAS = 5;
const MAX_FUTURAS = 4;

// Qué pesa más en el titular, en la bajada y en el orden de los párrafos.
const PRIORIDAD: Hecho['tipo'][] = ['propuesta', 'evento', 'mensaje', 'nota', 'fecha'];
const porPrioridad = (a: Hecho, b: Hecho) => PRIORIDAD.indexOf(a.tipo) - PRIORIDAD.indexOf(b.tipo);

// ── Helpers ──────────────────────────────────────────────────────────────────

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

/** Elige una frase según el hash, saltando las que ya se usaron en la columna. */
function elegirSinRepetir(opciones: string[], semilla: string, usadas: Set<string>): string {
  const inicio = hash(semilla) % opciones.length;
  for (let i = 0; i < opciones.length; i++) {
    const op = opciones[(inicio + i) % opciones.length];
    if (!usadas.has(op)) {
      usadas.add(op);
      return op;
    }
  }
  const op = opciones[inicio];
  usadas.add(op);
  return op;
}

/** Recorta en una palabra completa, sin cortar a mitad de palabra. */
export function corto(s: string, max = 110): string {
  const limpio = s.replace(/\s+/g, ' ').trim();
  if (limpio.length <= max) return limpio;
  return limpio.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

const mayus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const diaSiguiente = (iso: string) => {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

/** "hoy", "mañana" o el día de la semana, como lo diría alguien que cuenta. */
function cuandoDia(fecha: string, hoy: string): string {
  if (fecha === hoy) return 'hoy';
  if (fecha === diaSiguiente(hoy)) return 'mañana';
  return `el ${new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' })}`;
}

const cuando = (fecha: string, hoy: string, hora?: string) =>
  `${cuandoDia(fecha, hoy)}${hora ? ` a las ${hora}` : ''}`;

// ── Miradas de cada párrafo ──────────────────────────────────────────────────

const MIRADA_PROPUESTA_CON_HORA = [
  'Un plan con día y hora ya es más que una idea.',
  'De ahora en más, la pregunta es quién lleva qué.',
];
const MIRADA_PROPUESTA_SIN_HORA = [
  'Tiene día; falta que alguien diga a qué hora.',
  'De ahora en más, la pregunta es quién lleva qué.',
];
const MIRADA: Record<Exclude<Hecho['tipo'], 'propuesta'>, string[]> = {
  evento: [
    'Lo que ya está en el calendario tiene menos excusas.',
    'Esta vez no hay que acordarse de nada: quedó anotado.',
  ],
  mensaje: [
    'Hay conversación, y conviene contestar antes de que se enfríe.',
    'Ahí se decide buena parte de la semana.',
  ],
  nota: [
    'Lo que se anota, se recuerda.',
    'Vale la pena volver a leerlo cuando llegue el momento.',
  ],
  fecha: [
    'Conviene empezar a pensarlo con tiempo.',
    'Las fechas que se acercan piden un poco de anticipación.',
  ],
};

// ── Bajadas de la columna (otras frases, para no repetir la mirada de un párrafo) ──

const BAJADA: Record<Hecho['tipo'], string[]> = {
  propuesta: [
    'Los planes del grupo ya tienen día: falta que alguien confirme.',
    'Cuando el grupo se organiza, la semana cambia de forma.',
  ],
  evento: [
    'Lo que está en el calendario no depende de que alguien se acuerde.',
    'Hay compromisos que ya no se discuten.',
  ],
  mensaje: [
    'Alguien habló en el grupo, y el silencio también cuenta.',
    'En los grupos, el primer mensaje marca el tono de la semana.',
  ],
  nota: [
    'Lo que escribiste vuelve a tener sentido cuando se cruza con la gente.',
    'Algunas notas envejecen bien; esta parece una de ellas.',
  ],
  fecha: [
    'Las fechas importantes se notan cuando ya es tarde para preparar algo.',
    'Anticiparse también es una forma de cuidar a los demás.',
  ],
};

function miradaDe(h: Hecho, semilla: string, usadas: Set<string>): string {
  if (h.tipo === 'propuesta') {
    return elegirSinRepetir(h.hora ? MIRADA_PROPUESTA_CON_HORA : MIRADA_PROPUESTA_SIN_HORA, `${semilla}|mirada`, usadas);
  }
  return elegirSinRepetir(MIRADA[h.tipo], `${semilla}|mirada`, usadas);
}

// ── Frases: dato + mirada ────────────────────────────────────────────────────

function frase(h: Hecho, hoy: string, usadas: Set<string>): string {
  const semilla = `${h.tipo}|${h.grupoId}|${h.fecha}|${'texto' in h ? h.texto : ''}|${'titulo' in h ? h.titulo : ''}`;
  const dato = (() => {
    switch (h.tipo) {
      case 'mensaje': {
        const de = h.de ?? 'Alguien';
        return hash(semilla) % 2 === 0
          ? `${de} escribió en ${h.circulo}: «${corto(h.texto)}».`
          : `En ${h.circulo}, ${de} tomó la palabra: «${corto(h.texto)}».`;
      }
      case 'propuesta':
        return hash(semilla) % 2 === 0
          ? `${h.circulo} se organiza: hay plan ${cuando(h.fecha, hoy, h.hora)}. Lo anunciaron así: «${corto(h.texto)}».`
          : `El plan ya tiene día: ${h.circulo}, ${cuando(h.fecha, hoy, h.hora)}. El mensaje original dice: «${corto(h.texto)}».`;
      case 'evento': {
        // Si el título ya dice el grupo ("Asado con el cole" en Cole), no se repite.
        const menciona = normalizar(h.titulo).includes(normalizar(h.circulo));
        return hash(semilla) % 2 === 0
          ? `${h.titulo} quedó en el calendario${menciona ? '' : ` con ${h.circulo}`}, ${cuando(h.fecha, hoy, h.hora)}.`
          : `${menciona ? 'Ya hay' : `Con ${h.circulo} ya hay`} fecha para ${h.titulo.toLowerCase()}: ${cuando(h.fecha, hoy, h.hora)}.`;
      }
      case 'nota':
        return `Escribiste sobre ${h.circulo}: «${h.titulo}».`;
      case 'fecha':
        return `Se acerca «${h.titulo}» de ${h.circulo}, ${cuando(h.fecha, hoy)}.`;
    }
  })();
  return `${dato} ${miradaDe(h, semilla, usadas)}`;
}

/** Titular: lo más importante del día. */
function titularDe(principal: Hecho, hoy: string): string {
  switch (principal.tipo) {
    case 'propuesta': return mayus(`${principal.circulo}: se viene un plan ${cuandoDia(principal.fecha, hoy)}`);
    case 'evento':    return mayus(`${principal.titulo}, ${cuandoDia(principal.fecha, hoy)}`);
    case 'mensaje':   return mayus(`Movimiento en ${principal.circulo}`);
    case 'nota':      return mayus(`Lo que escribiste sobre ${principal.circulo}`);
    case 'fecha':     return mayus(`Se viene «${principal.titulo}»`);
  }
}

// ── Armado de la columna ─────────────────────────────────────────────────────

/**
 * Arma una columna por día con actividad, más reciente primero. Un día sin
 * hechos no genera columna: no hay nada que comentar y no se inventa.
 *
 * Si un mensaje ya aparece como propuesta (mismo círculo y mismo texto), se
 * muestra solo la propuesta: no se cuenta dos veces lo mismo.
 */
export function armarColumnas(hechos: Hecho[], hoy: string): Columna[] {
  const propuestas = new Set(
    hechos
      .filter((h): h is Extract<Hecho, { tipo: 'propuesta' }> => h.tipo === 'propuesta')
      .map(h => `${h.grupoId}|${h.texto}`),
  );
  const sinRepetir = hechos.filter(h => h.tipo !== 'mensaje' || !propuestas.has(`${h.grupoId}|${h.texto}`));

  const porDia = new Map<string, Hecho[]>();
  for (const h of sinRepetir) {
    const lista = porDia.get(h.fecha) ?? [];
    lista.push(h);
    porDia.set(h.fecha, lista);
  }

  // Las bajadas no se repiten entre días; las miradas, dentro de cada columna.
  const bajadasUsadas = new Set<string>();

  // Lo pasado (hoy incluido) del más reciente al más viejo; lo que viene, del más
  // cercano al más lejano. Cada lado se recorta por separado: un día futuro
  // nunca tapa a hoy ni a los días pasados.
  const fechas = [...porDia.keys()];
  const pasadas = fechas.filter(f => f <= hoy).sort((a, b) => b.localeCompare(a)).slice(0, MAX_PASADAS);
  const futuras = fechas.filter(f => f > hoy).sort((a, b) => a.localeCompare(b)).slice(0, MAX_FUTURAS);

  return [...pasadas, ...futuras].map(fecha => {
    const lista = porDia.get(fecha) ?? [];
      const ordenados = [...lista].sort((a, b) => porPrioridad(a, b) || a.grupoId.localeCompare(b.grupoId));
      const principal = ordenados[0];

      const bajada = elegirSinRepetir(BAJADA[principal.tipo], `bajada|${principal.tipo}|${fecha}|${principal.grupoId}`, bajadasUsadas);
      const usadas = new Set<string>();

      const visibles = ordenados.slice(0, MAX_PARRAFOS);
      const parrafos: Parrafo[] = visibles.map(h => ({
        texto: frase(h, hoy, usadas),
        ...(h.tipo === 'propuesta' ? { accion: h.accion } : {}),
      }));
      const resto = ordenados.length - visibles.length;
      if (resto > 0) parrafos.push({ texto: `Y ${resto} cosas más de tus círculos ese día.` });

      return { fecha, titular: titularDe(principal, hoy), bajada, parrafos };
    });
}
