// Parseo de feeds RSS 2.0 / Atom y limpieza de texto e imágenes.

import { XMLParser } from 'fast-xml-parser';

// ── Acceso seguro a nodos (el parser y los JSON devuelven datos sin tipo) ────

type Nodo = Record<string, unknown>;

export const esNodo = (v: unknown): v is Nodo =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function lista(v: unknown): unknown[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

export function hijo(v: unknown, ...ruta: Array<string | number>): unknown {
  let actual: unknown = v;
  for (const paso of ruta) {
    if (typeof paso === 'number') actual = Array.isArray(actual) ? actual[paso] : undefined;
    else actual = esNodo(actual) ? actual[paso] : undefined;
  }
  return actual;
}

export function texto(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return texto(v[0]);
  if (esNodo(v)) return texto(v['#text'] ?? v['#cdata'] ?? '');
  return '';
}

export const attr = (v: unknown, nombre: string): string => (esNodo(v) ? texto(v['@_' + nombre]) : '');

// ── Entidades y limpieza ─────────────────────────────────────────────────────

const ENTIDADES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', Uuml: 'Ü',
  iexcl: '¡', iquest: '¿', laquo: '«', raquo: '»', hellip: '…', mdash: '—', ndash: '–',
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', middot: '·', deg: '°', ordf: 'ª', ordm: 'º',
};

export function decodificarEntidades(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (todo, ent: string) => {
    if (ent[0] === '#') {
      const cod = ent[1].toLowerCase() === 'x' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(cod) && cod > 0 && cod < 0x110000 ? String.fromCodePoint(cod) : todo;
    }
    return Object.hasOwn(ENTIDADES, ent) ? ENTIDADES[ent] : todo;
  });
}

const COLAS_WORDPRESS = [
  /The post .* appeared first on .*$/i,
  /La entrada .* se publicó primero en .*$/i,
  /\s*(Leer más|Seguir leyendo|Continuar leyendo|Read more)\s*(…|\.\.\.)?\s*$/i,
  /\s*\[(…|\.\.\.)\]\s*$/,
];

/** HTML → texto plano de una línea. */
export function limpiarTexto(html: string): string {
  let s = html
    .replace(/<(script|style|figure|figcaption)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  s = decodificarEntidades(s).replace(/\s+/g, ' ').trim();
  for (const cola of COLAS_WORDPRESS) s = s.replace(cola, '').trim();
  return s;
}

/** Corta en un fin de oración cerca de max; si no hay, en un espacio con "…". */
export function cortarBajada(s: string, max = 220): string {
  if (s.length <= max) return s;
  const ventana = s.slice(0, max + 30);
  let corte = -1;
  for (const m of ventana.matchAll(/[.!?](\s|$)/g)) {
    if (m.index !== undefined && m.index >= 80 && m.index <= max + 20) corte = m.index + 1;
  }
  if (corte > 0) return s.slice(0, corte).trim();
  const espacio = s.lastIndexOf(' ', max);
  return s.slice(0, espacio > 60 ? espacio : max).trim() + '…';
}

export const contarPalabras = (s: string): number => (s.match(/\S+/g) ?? []).length;

// ── Imágenes ─────────────────────────────────────────────────────────────────

// Píxeles de seguimiento, íconos y la imagen genérica del sitio (no la de la nota).
const IMAGEN_BASURA = /feedburner\.com|gravatar\.com|\/emoji\/|wp-smiley|favicon|site_image|social-default|spacer\.|1x1\.|blank\.gif|pixel\.(gif|png)|\/track(ing)?\/|\.svg(\?|$)|(^|[/_-])(logo|placeholder|default)([._/-]|$)/i;

/** Normaliza a https absoluta; descarta data:, imágenes genéricas y URLs inválidas. */
export function normalizarImagen(src: string, base: string): string | undefined {
  const limpio = decodificarEntidades(src.trim());
  if (!limpio || limpio.startsWith('data:')) return undefined;
  try {
    const u = new URL(limpio, base);
    if (u.protocol === 'http:') u.protocol = 'https:';
    if (u.protocol !== 'https:') return undefined;
    if (IMAGEN_BASURA.test(u.pathname)) return undefined;
    // BBC publica miniaturas de 240 px; la misma ruta sirve a 800 px.
    if (u.hostname.endsWith('bbci.co.uk')) u.pathname = u.pathname.replace('/ws/240/', '/ws/800/');
    return u.href;
  } catch {
    return undefined;
  }
}

const tamañoChico = (atributos: string): boolean => {
  const w = /\bwidth=["']?(\d+)/i.exec(atributos)?.[1];
  const h = /\bheight=["']?(\d+)/i.exec(atributos)?.[1];
  return (w !== undefined && Number(w) < 100) || (h !== undefined && Number(h) < 100);
};

/** Primer <img> útil dentro de un HTML (desescapa una vez más si viene doble escapado). */
export function imagenDesdeHtml(html: string): string | undefined {
  const fuente = /&lt;img/i.test(html) ? decodificarEntidades(html) : html;
  for (const m of fuente.matchAll(/<img\b([^>]*)>/gi)) {
    const atributos = m[1];
    if (tamañoChico(atributos)) continue;
    const src =
      /\b(?:data-lazy-src|data-src|data-original)=["']([^"']+)["']/i.exec(atributos)?.[1] ??
      /\bsrc=["']([^"']+)["']/i.exec(atributos)?.[1];
    if (src && !src.startsWith('data:') && !IMAGEN_BASURA.test(src)) return src;
  }
  return undefined;
}

/** og:image / twitter:image del <head> de un artículo. */
export function imagenDesdeMeta(html: string): string | undefined {
  const patrones = [
    /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+(?:property|name)=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']twitter:image(?::src)?["']/i,
  ];
  for (const p of patrones) {
    const src = p.exec(html)?.[1];
    if (src && !IMAGEN_BASURA.test(src)) return src;
  }
  return undefined;
}

// ── Feeds ────────────────────────────────────────────────────────────────────

export interface ItemCrudo {
  titulo:      string;
  link:        string;
  descripcion: string;   // HTML
  contenido:   string;   // HTML (content:encoded o content de Atom)
  fecha:       string;
  categorias:  string[];
  imagenes:    string[]; // candidatas de media/enclosure, en orden de preferencia
}

const ARREGLOS = new Set([
  'item', 'entry', 'category', 'link', 'enclosure',
  'media:content', 'media:thumbnail', 'media:group',
]);

const parser = new XMLParser({
  ignoreAttributes:    false,
  attributeNamePrefix: '@_',
  parseTagValue:       false,
  parseAttributeValue: false,
  htmlEntities:        true,
  trimValues:          true,
  isArray: (nombre, _ruta, _hoja, esAtributo) => !esAtributo && ARREGLOS.has(nombre),
});

function esMediaImagen(m: unknown): boolean {
  const medio = attr(m, 'medium');
  const tipo = attr(m, 'type');
  const ancho = Number(attr(m, 'width')) || 0;
  if (ancho && ancho < 100) return false;
  if (medio === 'image' || tipo.startsWith('image/')) return true;
  if (medio || tipo) return false; // video, audio u otro
  return /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(attr(m, 'url'));
}

function imagenesMedia(item: unknown): string[] {
  const grupos = [item, ...lista(hijo(item, 'media:group'))];
  const urls: string[] = [];
  for (const g of grupos) {
    for (const m of lista(hijo(g, 'media:content'))) if (esMediaImagen(m)) urls.push(attr(m, 'url'));
  }
  for (const e of lista(hijo(item, 'enclosure'))) if (esMediaImagen(e)) urls.push(attr(e, 'url'));
  for (const g of grupos) {
    for (const t of lista(hijo(g, 'media:thumbnail'))) {
      const ancho = Number(attr(t, 'width')) || 0;
      if (!ancho || ancho >= 100) urls.push(attr(t, 'url'));
    }
  }
  return urls.filter(Boolean);
}

function categoriasDe(v: unknown): string[] {
  return lista(v)
    .map(c => attr(c, 'term') || texto(c))
    .map(c => c.trim())
    .filter(Boolean);
}

function itemRss(item: unknown): ItemCrudo {
  const guid = texto(hijo(item, 'guid'));
  const link = lista(hijo(item, 'link')).map(texto).find(l => l.startsWith('http'))
    ?? (guid.startsWith('http') ? guid : '');
  return {
    titulo:      texto(hijo(item, 'title')),
    link,
    descripcion: texto(hijo(item, 'description')),
    contenido:   texto(hijo(item, 'content:encoded')),
    fecha:       texto(hijo(item, 'pubDate')) || texto(hijo(item, 'dc:date')) || texto(hijo(item, 'published')),
    categorias:  categoriasDe(hijo(item, 'category')),
    imagenes:    imagenesMedia(item),
  };
}

function itemAtom(entry: unknown): ItemCrudo {
  const links = lista(hijo(entry, 'link'));
  const alterno = links.find(l => !attr(l, 'rel') || attr(l, 'rel') === 'alternate');
  const imagenesEnclosure = links
    .filter(l => attr(l, 'rel') === 'enclosure' && attr(l, 'type').startsWith('image/'))
    .map(l => attr(l, 'href'));
  return {
    titulo:      texto(hijo(entry, 'title')),
    link:        attr(alterno, 'href') || texto(alterno),
    descripcion: texto(hijo(entry, 'summary')),
    contenido:   texto(hijo(entry, 'content')),
    fecha:       texto(hijo(entry, 'published')) || texto(hijo(entry, 'updated')),
    categorias:  categoriasDe(hijo(entry, 'category')),
    imagenes:    [...imagenesMedia(entry), ...imagenesEnclosure],
  };
}

export function parsearFeed(xml: string): ItemCrudo[] {
  const raiz: unknown = parser.parse(xml);
  const rss = hijo(raiz, 'rss', 'channel', 'item');
  if (rss) return lista(rss).map(itemRss);
  const rdf = hijo(raiz, 'rdf:RDF', 'item');
  if (rdf) return lista(rdf).map(itemRss);
  const atom = hijo(raiz, 'feed', 'entry');
  if (atom) return lista(atom).map(itemAtom);
  return [];
}
