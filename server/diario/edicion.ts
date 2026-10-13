// Arma la edición diaria: pide los feeds, normaliza las notas, completa
// imágenes faltantes con og:image y agrega deportes. La respuesta es igual
// para todos los usuarios (la personalización ocurre en el cliente).

import type { ArticuloEdicion, EdicionDiaria, SeccionId } from './tipos.js';
import { FUENTES, type Fuente } from './fuentes.js';
import { obtenerDeportes } from './deportes.js';
import { hoyArgentina } from './fecha.js';
import { decodificar, enPool, pedir, pedirTexto } from './red.js';
import {
  contarPalabras, cortarBajada, imagenDesdeHtml, imagenDesdeMeta, limpiarTexto,
  normalizarImagen, parsearFeed, type ItemCrudo,
} from './xml.js';

const SECCIONES: SeccionId[] = [
  'argentina', 'contexto', 'tecnologia', 'internacional', 'deportes', 'ciencia', 'filosofia', 'cultura',
];
// Secciones que, si quedan con menos de 2 notas, marcan la edición como degradada.
const SECCIONES_CLAVE: SeccionId[] = ['argentina', 'tecnologia', 'internacional', 'deportes', 'ciencia', 'cultura'];

const POR_FUENTE = 10;
const POR_SECCION = 14;
const MAX_OG_IMAGE = 28;
const PRESUPUESTO_MS = 20_000;
const TOLERANCIA_FUTURO_MS = 2 * 3_600_000;

const CATEGORIAS_GENERICAS = /^(noticias?|portada|destacad[oa]s?|últimas noticias|ultimas noticias|sin categoría|uncategorized|home|general|news|blog|actualidad|el país|sociedad y cultura)$/i;

function hashTexto(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

// Título normalizado completo (sin cortar: "Dólar hoy… martes" y "… miércoles" son notas distintas).
const claveTitulo = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

function normalizarItem(item: ItemCrudo, fuente: Fuente, ahora: number): ArticuloEdicion | null {
  const titulo = limpiarTexto(item.titulo);
  const url = item.link.trim();
  if (!titulo || !url.startsWith('http')) return null;

  const t = Date.parse(item.fecha);
  if (!Number.isFinite(t)) return null;
  if (t > ahora + TOLERANCIA_FUTURO_MS) return null;
  if (t < ahora - fuente.maxHoras * 3_600_000) return null;

  const textoDesc = limpiarTexto(item.descripcion);
  const textoCont = limpiarTexto(item.contenido);
  let bajada = cortarBajada(textoDesc || textoCont);
  if (bajada && claveTitulo(bajada) === claveTitulo(titulo)) bajada = '';

  const muestra = `${titulo} ${bajada} ${item.categorias.join(' ')}`;
  if (fuente.incluir && !fuente.incluir.test(muestra)) return null;
  if (fuente.excluir && fuente.excluir.test(muestra)) return null;

  const candidatas = [
    ...item.imagenes,
    imagenDesdeHtml(item.descripcion),
    imagenDesdeHtml(item.contenido),
  ].filter((s): s is string => Boolean(s));
  const imagen = candidatas.map(c => normalizarImagen(c, url)).find(Boolean);

  const categorias = item.categorias
    .map(c => limpiarTexto(c).toLowerCase())
    .filter(c => c.length > 1 && c.length <= 24 && !CATEGORIAS_GENERICAS.test(c))
    .slice(0, 4);
  const tags = [...new Set([...fuente.tags, ...categorias])];

  const palabras = Math.max(contarPalabras(textoCont), contarPalabras(textoDesc));

  return {
    id:       hashTexto(url),
    titulo,
    bajada,
    url,
    fuente:   fuente.nombre,
    fuenteId: fuente.id,
    fecha:    new Date(t).toISOString(),
    imagen,
    seccion:  fuente.seccion,
    tags,
    idioma:   fuente.idioma,
    palabras: palabras >= 150 ? palabras : undefined,
  };
}

/** Intercala fuentes (más reciente primero dentro de cada una) para que haya variedad. */
function intercalar(notas: ArticuloEdicion[]): ArticuloEdicion[] {
  const porFuente = new Map<string, ArticuloEdicion[]>();
  for (const n of [...notas].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha))) {
    const cola = porFuente.get(n.fuenteId) ?? [];
    cola.push(n);
    porFuente.set(n.fuenteId, cola);
  }
  const colas = [...porFuente.values()];
  const salida: ArticuloEdicion[] = [];
  while (colas.some(c => c.length)) {
    for (const c of colas) {
      const n = c.shift();
      if (n) salida.push(n);
    }
  }
  return salida;
}

async function completarImagenes(secciones: Record<SeccionId, ArticuloEdicion[]>, limite: number): Promise<void> {
  // Primero las notas que probablemente se muestran (las 4 primeras de cada
  // sección); después el resto de filosofía y ciencia, de donde sale "Para guardar".
  const prioridad = [
    ...SECCIONES.flatMap(s => secciones[s].slice(0, 4)),
    ...secciones.filosofia.slice(4),
    ...secciones.ciencia.slice(4),
  ];
  const sinImagen = prioridad.filter(n => !n.imagen).slice(0, MAX_OG_IMAGE);
  await enPool(sinImagen, 8, async nota => {
    const r = await pedir(nota.url, { timeoutMs: 4000, limite, maxBytes: 128 * 1024, reintentos: 0 });
    const src = imagenDesdeMeta(decodificar(r.bytes, r.tipo));
    if (src) nota.imagen = normalizarImagen(src, r.urlFinal);
  });
}

export interface ResultadoEdicion {
  edicion:   EdicionDiaria;
  degradada: boolean;
}

export async function armarEdicion(): Promise<ResultadoEdicion> {
  const ahora = Date.now();
  const limite = ahora + PRESUPUESTO_MS;
  const urls = [...new Set(FUENTES.map(f => f.url))];

  const [xmls, deportes] = await Promise.all([
    enPool(urls, 10, url => pedirTexto(url, { timeoutMs: 5000, limite })),
    obtenerDeportes(limite),
  ]);
  const xmlPorUrl = new Map(urls.map((u, i) => [u, xmls[i]]));

  const secciones = Object.fromEntries(SECCIONES.map(s => [s, [] as ArticuloEdicion[]])) as Record<SeccionId, ArticuloEdicion[]>;
  let fuentesOk = 0;
  for (const fuente of FUENTES) {
    const xml = xmlPorUrl.get(fuente.url);
    if (!xml) continue;
    let items: ItemCrudo[];
    try {
      items = parsearFeed(xml);
    } catch (e) {
      console.warn('[diario] no se pudo parsear', fuente.id, e instanceof Error ? e.message : e);
      continue;
    }
    const notas = items
      .map(i => normalizarItem(i, fuente, ahora))
      .filter((n): n is ArticuloEdicion => n !== null)
      .slice(0, POR_FUENTE);
    if (items.length) fuentesOk++;
    secciones[fuente.seccion].push(...notas);
  }

  // Sin duplicados entre secciones (la primera sección en el orden gana). Solo se
  // marcan como vistas las notas que entran: lo que el tope deja afuera de una
  // sección todavía puede aparecer en otra.
  const vistas = new Set<string>();
  for (const s of SECCIONES) {
    const elegidas: ArticuloEdicion[] = [];
    for (const n of intercalar(secciones[s])) {
      if (elegidas.length >= POR_SECCION) break;
      const claves = [n.url, claveTitulo(n.titulo)].filter(Boolean);
      if (claves.some(c => vistas.has(c))) continue;
      claves.forEach(c => vistas.add(c));
      elegidas.push(n);
    }
    secciones[s] = elegidas;
  }

  await completarImagenes(secciones, limite);

  const degradada =
    fuentesOk < FUENTES.length / 2 ||
    SECCIONES_CLAVE.some(s => secciones[s].length < 2) ||
    deportes.resultados.length + deportes.proximos.length === 0; // ESPN/Jolpica caídos

  return {
    degradada,
    edicion: {
      fecha:        hoyArgentina(),
      generadaEn:   new Date().toISOString(),
      secciones,
      deportes,
      fuentesOk,
      fuentesTotal: FUENTES.length,
      origen:       'red',
    },
  };
}

// Caché en memoria: evita rearmar la edición en cada pedido mientras la
// instancia sigue viva (y en desarrollo, en cada recarga).
let cache: { valor: ResultadoEdicion; expira: number } | null = null;
let enCurso: Promise<ResultadoEdicion> | null = null;

export async function obtenerEdicion(): Promise<ResultadoEdicion> {
  if (cache && cache.expira > Date.now() && cache.valor.edicion.fecha === hoyArgentina()) return cache.valor;
  if (!enCurso) {
    enCurso = armarEdicion()
      .then(valor => {
        cache = { valor, expira: Date.now() + (valor.degradada ? 60_000 : 30 * 60_000) };
        return valor;
      })
      .finally(() => { enCurso = null; });
  }
  return enCurso;
}
