// Lógica del Diario en el cliente: carga de la edición (red, caché o respaldo),
// ranking por preferencias y selección de piezas por página.

import type {
  ArticuloEdicion, ArticuloGuardado, DeporteId, EdicionDiaria, FSDiarioPrefs, SeccionId,
} from '../types';
import { ARTICULOS, type DiarioArticulo } from './diarioSeed';
import { sumarDias } from '../../../server/diario/fecha';

export { hoyArgentina, sumarDias, horaArgentina, diaSemanaArgentina } from '../../../server/diario/fecha';

// ── Etiquetas legibles ───────────────────────────────────────────────────────

const ETIQUETAS: Record<string, string> = {
  ia: 'IA', 'inteligencia artificial': 'IA', tecnología: 'Tecnología', política: 'Política',
  argentina: 'Argentina', internacional: 'Internacional', deporte: 'Deportes', futbol: 'Fútbol',
  ciencia: 'Ciencia', filosofía: 'Filosofía', ética: 'Ética', godot: 'Godot', desarrollo: 'Desarrollo',
  videojuegos: 'Videojuegos', gaming: 'Videojuegos', anime: 'Anime', manga: 'Manga', cine: 'Cine',
  series: 'Series', economía: 'Economía', sociedad: 'Sociedad', chequeo: 'Chequeo', mma: 'MMA',
  f1: 'Fórmula 1', tenis: 'Tenis', hockey: 'Hockey', padel: 'Pádel', jiujitsu: 'Jiu-jitsu',
  psicología: 'Psicología', historia: 'Historia', salud: 'Salud', productividad: 'Productividad',
  entretenimiento: 'Entretenimiento',
};

export const etiqueta = (tag: string): string =>
  ETIQUETAS[tag] ?? tag.charAt(0).toUpperCase() + tag.slice(1);

/** Hasta dos etiquetas para el kicker ("GODOT · DESARROLLO"). */
export function kicker(art: ArticuloEdicion, omitir: string[] = []): string {
  return art.tags
    .filter(t => !omitir.includes(t))
    .slice(0, 2)
    .map(etiqueta)
    .join(' · ');
}

// ── Ranking ──────────────────────────────────────────────────────────────────

export const hasTag = (a: { tags: string[] }, tags: string[]) => a.tags.some(t => tags.includes(t));

/** Afinidad por tags + bonus por novedad (lo de las últimas horas sube solo). */
export function puntaje(a: ArticuloEdicion, prefs: FSDiarioPrefs, ahora = Date.now()): number {
  const afinidad = a.tags.reduce((s, t) => s + (prefs.tagScores[t] ?? 0), 0);
  const horas = (ahora - Date.parse(a.fecha)) / 3_600_000;
  const novedad = Number.isFinite(horas) ? Math.max(0, 6 * (1 - horas / 48)) : 0;
  return afinidad + novedad;
}

/** Descarta lo que marcaste "Menos" y ordena por puntaje. */
export function rankear(lista: ArticuloEdicion[], prefs: FSDiarioPrefs, extra?: (a: ArticuloEdicion) => number): ArticuloEdicion[] {
  const ahora = Date.now();
  return lista
    .filter(a => prefs.reactions[a.id] !== 'dislike')
    .map(a => ({ a, p: puntaje(a, prefs, ahora) + (extra?.(a) ?? 0) }))
    .sort((x, y) => y.p - x.p)
    .map(x => x.a);
}

/** La primera con foto entre las tres mejores, para que la pieza principal tenga imagen. */
function conFotoPrimero(lista: ArticuloEdicion[]): ArticuloEdicion[] {
  const i = lista.slice(0, 3).findIndex(a => a.imagen);
  if (i <= 0) return lista;
  return [lista[i], ...lista.slice(0, i), ...lista.slice(i + 1)];
}

export function porQueVeoEsto(a: ArticuloEdicion, prefs: FSDiarioPrefs, descubrimiento = false): string {
  if (descubrimiento) return 'Fuera de tus temas habituales, para descubrir algo nuevo.';
  const mejor = a.tags
    .filter(t => (prefs.tagScores[t] ?? 0) > 0)
    .sort((x, y) => (prefs.tagScores[y] ?? 0) - (prefs.tagScores[x] ?? 0))[0];
  return mejor
    ? `Incluido por tu interés en ${etiqueta(mejor).toLowerCase()}.`
    : `Lo más reciente de ${a.fuente}.`;
}

/** Temas que te interesan, para resaltar en negrita dentro de la bajada. */
export function terminosFavoritos(prefs: FSDiarioPrefs): string[] {
  return Object.entries(prefs.tagScores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t)
    .filter(t => t.length > 2);
}

// ── Deportes: preferencias ───────────────────────────────────────────────────

export const DEPORTES: Array<{ id: DeporteId; nombre: string; patron: RegExp }> = [
  { id: 'futbol', nombre: 'Fútbol',        patron: /fútbol|futbol|selecci[oó]n|liga profesional|copa|boca|river|racing|independiente|san lorenzo|vélez|estudiantes|scaloni|messi/i },
  { id: 'f1',     nombre: 'Automovilismo', patron: /\bf1\b|fórmula 1|formula 1|colapinto|gran premio|verstappen|automovilismo|turismo carretera|motogp/i },
  { id: 'ufc',    nombre: 'UFC',           patron: /\bufc\b|\bmma\b|artes marciales|pelea/i },
  { id: 'tenis',  nombre: 'Tenis',         patron: /tenis|\batp\b|\bwta\b|sinner|alcaraz|djokovic|cer[uú]ndolo|etcheverry|navone|báez/i },
];

export const deportesElegidos = (prefs: FSDiarioPrefs): DeporteId[] => prefs.deportes ?? ['futbol', 'f1'];

// ── Selección por página ─────────────────────────────────────────────────────

export interface Seleccion {
  portada:    { principal?: ArticuloEdicion; destacados: ArticuloEdicion[] };
  argentina:  { piezas: ArticuloEdicion[]; contexto?: ArticuloEdicion };
  mundo:      { piezas: ArticuloEdicion[]; breves: ArticuloEdicion[] };
  deportes:   { piezas: ArticuloEdicion[] };
  ciencia:    { ciencia?: ArticuloEdicion; filosofia?: ArticuloEdicion };
  cultura:    { piezas: ArticuloEdicion[]; descubrimiento?: ArticuloEdicion };
  contratapa: { columna?: ArticuloEdicion; paraGuardar?: ArticuloEdicion };
}

const diasDesde2024 = (fecha: string) =>
  Math.floor((Date.parse(fecha + 'T12:00:00Z') - Date.parse('2024-01-01T12:00:00Z')) / 86_400_000);

export const numeroEdicion = (fecha: string) => diasDesde2024(fecha);

export function armarSeleccion(edicion: EdicionDiaria, prefs: FSDiarioPrefs): Seleccion {
  const s = edicion.secciones;
  const usados = new Set<string>();
  const tomar = (lista: ArticuloEdicion[], n: number): ArticuloEdicion[] => {
    const elegidas = lista.filter(a => !usados.has(a.id)).slice(0, n);
    elegidas.forEach(a => usados.add(a.id));
    return elegidas;
  };

  // Deportes: suben las notas de los deportes y equipos que elegiste.
  const elegidos = deportesElegidos(prefs);
  const equipos = (prefs.equipos ?? []).map(e => e.toLowerCase());
  const bonusDeporte = (a: ArticuloEdicion) => {
    const texto = `${a.titulo} ${a.bajada}`;
    const deporte = DEPORTES.some(d => elegidos.includes(d.id) && d.patron.test(texto)) ? 5 : 0;
    const equipo = equipos.some(e => texto.toLowerCase().includes(e)) ? 8 : 0;
    return deporte + equipo;
  };

  const argentina = tomar(conFotoPrimero(rankear(s.argentina, prefs)), 3);
  const contexto = tomar(rankear(s.contexto, prefs), 1)[0];

  const tecnologia = conFotoPrimero(rankear(s.tecnologia, prefs));
  const internacional = conFotoPrimero(rankear(s.internacional, prefs));
  const mundoPiezas = [...tomar(tecnologia, 1), ...tomar(internacional, 1)];
  const breves = [...tomar(tecnologia, 1), ...tomar(internacional, 1)];

  const deportes = tomar(conFotoPrimero(rankear(s.deportes, prefs, bonusDeporte)), 3);

  const ciencia = tomar(conFotoPrimero(rankear(s.ciencia, prefs)), 1)[0];
  const filosofia = tomar(rankear(s.filosofia, prefs), 1)[0];

  // Cultura: dos por afinidad y una de "descubrimiento" (tema con poca afinidad, no rechazado).
  const cultura = tomar(conFotoPrimero(rankear(s.cultura, prefs)), 2);
  const temasVistos = new Set(cultura.flatMap(a => a.tags));
  const candidatasDescubrimiento = rankear(s.cultura, prefs)
    .filter(a => !usados.has(a.id))
    .sort((x, y) => puntaje(x, prefs) - puntaje(y, prefs))
    .filter(a => !a.tags.some(t => (prefs.tagScores[t] ?? 0) < 0));
  const descubrimiento = tomar(
    candidatasDescubrimiento.filter(a => !a.tags.some(t => temasVistos.has(t))).concat(candidatasDescubrimiento),
    1,
  )[0];

  // Contratapa: columna del seed rotada por día y una lectura larga para guardar.
  const columna = columnaDelDia(edicion.fecha);
  const largas = [...s.filosofia, ...s.ciencia]
    .filter(a => !usados.has(a.id))
    .sort((x, y) => (y.palabras ?? 0) - (x.palabras ?? 0));
  const paraGuardar = tomar(largas, 1)[0] ?? ensayoDelDia(edicion.fecha, columna?.id);

  const principalPortada = [argentina[0], mundoPiezas[0]]
    .filter((a): a is ArticuloEdicion => Boolean(a))
    .sort((x, y) => Number(Boolean(y.imagen)) - Number(Boolean(x.imagen)) || puntaje(y, prefs) - puntaje(x, prefs))[0];
  const destacados = [deportes[0], ciencia, cultura[0]].filter((a): a is ArticuloEdicion => Boolean(a));

  return {
    portada:    { principal: principalPortada, destacados },
    argentina:  { piezas: argentina, contexto },
    mundo:      { piezas: mundoPiezas, breves },
    deportes:   { piezas: deportes },
    ciencia:    { ciencia, filosofia },
    cultura:    { piezas: cultura, descubrimiento },
    contratapa: { columna, paraGuardar },
  };
}

// ── Respaldo: ensayos del seed ───────────────────────────────────────────────

const TEMAS_COLUMNA = ['filosofía', 'psicología', 'mentalidad', 'bienestar', 'hábitos', 'historia'];

function seedAArticulo(a: DiarioArticulo, seccion: SeccionId, fecha: string): ArticuloEdicion {
  const parrafos = a.contenido.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const primero = parrafos[0] ?? '';
  const bajada = primero.length > 220 ? primero.slice(0, primero.lastIndexOf(' ', 220)) + '…' : primero;
  return {
    id:       a.id,
    titulo:   a.titulo,
    bajada,
    url:      '',
    fuente:   a.fuente ?? 'Archivo del diario',
    fuenteId: 'seed',
    fecha:    a.fecha ? `${a.fecha}T12:00:00Z` : `${fecha}T12:00:00Z`,
    imagen:   a.imagen,
    seccion,
    tags:     a.tags,
    idioma:   'es',
    palabras: a.contenido.split(/\s+/).length,
    texto:    parrafos,
  };
}

const ensayosGenerales = () => ARTICULOS.filter(a => !a.seccion && hasTag(a, TEMAS_COLUMNA));

function columnaDelDia(fecha: string): ArticuloEdicion | undefined {
  const ensayos = ensayosGenerales();
  if (!ensayos.length) return undefined;
  const a = ensayos[diasDesde2024(fecha) % ensayos.length];
  return seedAArticulo(a, 'filosofia', fecha);
}

function ensayoDelDia(fecha: string, evitar?: string): ArticuloEdicion | undefined {
  const ensayos = ensayosGenerales().filter(a => a.id !== evitar);
  if (!ensayos.length) return undefined;
  return seedAArticulo(ensayos[(diasDesde2024(fecha) + 7) % ensayos.length], 'filosofia', fecha);
}

/** Edición armada con el seed cuando no hay red ni caché. Sin páginas de actualidad. */
export function edicionDeRespaldo(fecha: string): EdicionDiaria {
  const vacio = (): ArticuloEdicion[] => [];
  const secciones: Record<SeccionId, ArticuloEdicion[]> = {
    argentina: vacio(), contexto: vacio(), tecnologia: vacio(), internacional: vacio(),
    deportes: vacio(), ciencia: vacio(), filosofia: vacio(), cultura: vacio(),
  };
  for (const a of ARTICULOS) {
    if (a.seccion === 'deporte') secciones.deportes.push(seedAArticulo(a, 'deportes', fecha));
    else if (a.seccion === 'entretenimiento') secciones.cultura.push(seedAArticulo(a, 'cultura', fecha));
    else if (hasTag(a, ['ciencia', 'astronomía', 'biología', 'neurociencia', 'física'])) secciones.ciencia.push(seedAArticulo(a, 'ciencia', fecha));
    else if (hasTag(a, ['filosofía', 'ética'])) secciones.filosofia.push(seedAArticulo(a, 'filosofia', fecha));
  }
  return {
    fecha,
    generadaEn: new Date().toISOString(),
    secciones,
    deportes: { resultados: [], proximos: [] },
    fuentesOk: 0,
    fuentesTotal: 0,
    origen: 'respaldo',
  };
}

// ── Carga y caché ────────────────────────────────────────────────────────────

const CLAVE_CACHE = 'diario_edicion_v1';
const SECCIONES_CLAVE: SeccionId[] = ['argentina', 'tecnologia', 'internacional', 'deportes', 'ciencia', 'cultura'];
const VIGENCIA_MS = 30 * 60_000;

export function leerEdicionCache(): EdicionDiaria | null {
  try {
    const crudo = localStorage.getItem(CLAVE_CACHE);
    if (!crudo) return null;
    const e = JSON.parse(crudo) as EdicionDiaria;
    return e && e.fecha && e.secciones ? e : null;
  } catch {
    return null;
  }
}

function guardarEdicionCache(e: EdicionDiaria): void {
  try {
    localStorage.setItem(CLAVE_CACHE, JSON.stringify(e));
  } catch {
    // Sin almacenamiento disponible: la edición sigue en memoria.
  }
}

/** La edición en caché es reciente: no hace falta pedir otra. */
export const edicionVigente = (e: EdicionDiaria | null, hoy: string): boolean =>
  !!e && e.origen === 'red' && e.fecha === hoy && Date.now() - Date.parse(e.generadaEn) < VIGENCIA_MS;

/**
 * Decide entre la edición actual y la recién llegada. Una respuesta degradada
 * (feeds caídos) no pisa una edición buena del mismo día.
 */
export function elegirEdicion(actual: EdicionDiaria | null, nueva: EdicionDiaria): EdicionDiaria {
  const total = (e: EdicionDiaria) => SECCIONES_CLAVE.reduce((n, s) => n + (e.secciones[s]?.length ?? 0), 0);
  let elegida = nueva;
  if (actual && actual.origen === 'red') {
    if (actual.fecha === nueva.fecha) {
      const peor = SECCIONES_CLAVE.some(s => (nueva.secciones[s]?.length ?? 0) < Math.min(3, actual.secciones[s]?.length ?? 0));
      if (peor) elegida = actual;
    } else if (total(nueva) < 10) {
      elegida = actual;
    }
  }
  if (elegida === nueva) guardarEdicionCache(nueva);
  return elegida;
}

export async function pedirEdicion(): Promise<EdicionDiaria> {
  const res = await fetch('/api/edicion', { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const e = (await res.json()) as EdicionDiaria;
  if (!e?.fecha || !e.secciones || !e.deportes) throw new Error('Edición inválida');
  return e;
}

// ── Guardados ────────────────────────────────────────────────────────────────

export const MAX_GUARDADOS = 300;

export function aGuardado(a: ArticuloEdicion): ArticuloGuardado {
  const g: ArticuloGuardado = {
    id:         a.id,
    titulo:     a.titulo.slice(0, 120),
    bajada:     a.bajada.slice(0, 200),
    url:        a.url,
    fuente:     a.fuente,
    fecha:      a.fecha,
    tags:       a.tags.slice(0, 3),
    guardadoEn: new Date().toISOString(),
  };
  if (a.imagen) g.imagen = a.imagen; // Firestore rechaza campos undefined
  return g;
}

/** Minutos de lectura solo si hay texto completo (no se inventa a partir de un extracto). */
export const minutosLectura = (a: ArticuloEdicion): number | undefined =>
  a.palabras && a.palabras >= 300 ? Math.max(1, Math.round(a.palabras / 200)) : undefined;

export const ayer = (hoy: string) => sumarDias(hoy, -1);
