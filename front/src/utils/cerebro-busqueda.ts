/**
 * Búsqueda local del Segundo Cerebro: sin IA ni servicios externos.
 * Puntúa notas, personas y grupos por coincidencia de palabras clave
 * y arma una respuesta con lo que encuentra.
 */

import type { FSEntradaDiario, FSPersona, FSGrupo } from '../types';

export interface DatosCerebro {
  entradas: FSEntradaDiario[];
  personas: FSPersona[];
  grupos: FSGrupo[];
}

export interface Resultados {
  notas: FSEntradaDiario[];
  personas: FSPersona[];
  grupos: FSGrupo[];
}

const STOPWORDS = new Set([
  'que', 'qué', 'como', 'cómo', 'cual', 'cuál', 'cuales', 'cuáles', 'quien', 'quién', 'quienes', 'quiénes',
  'cuando', 'cuándo', 'donde', 'dónde', 'para', 'por', 'con', 'sobre', 'los', 'las', 'del', 'una', 'uno',
  'unos', 'unas', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'hay', 'tengo', 'tenes', 'tenés',
  'estoy', 'estas', 'estás', 'fue', 'son', 'sus', 'mis', 'tus', 'mas', 'más', 'pero', 'algo', 'alguien',
  'mes', 'anote', 'anoté', 'quedé', 'quede', 'quedo', 'ando', 'sobre', 'hacer', 'hizo',
]);

/** Minúsculas, sin acentos ni signos. */
const normalizar = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ');

const palabrasClave = (query: string): string[] =>
  normalizar(query)
    .split(/\s+/)
    .filter(p => p.length > 3 && !STOPWORDS.has(p));

/** Cuántas palabras clave aparecen en el texto. Compara por raíz de 5 letras para tolerar conjugaciones (juntarme ~ juntada). */
const puntuar = (texto: string, claves: string[]): number => {
  const t = normalizar(texto);
  return claves.reduce((acc, kw) => acc + (t.includes(kw.slice(0, 5)) ? 1 : 0), 0);
};

const recortar = (texto: string, largo = 150): string =>
  texto.length > largo ? texto.slice(0, largo).trimEnd() + '…' : texto;

interface Coincidencia<T> {
  item: T;
  score: number;
}

const topN = <T>(items: Coincidencia<T>[], n = 3): T[] =>
  items
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(c => c.item);

/** Las 3 notas, personas y grupos que más coinciden con la pregunta. */
export function buscarRelevantes(query: string, datos: DatosCerebro) {
  const claves = palabrasClave(query);
  if (claves.length === 0) {
    return { notas: [], personas: [], grupos: [] } as Resultados;
  }

  return {
    notas: topN(
      datos.entradas.map(e => ({
        item: e,
        score: puntuar([e.titulo ?? '', e.contenido, (e.tags ?? []).join(' ')].join(' '), claves),
      }))
    ),
    personas: topN(
      datos.personas.map(p => ({
        item: p,
        score: puntuar([p.nombre, p.apodo ?? '', (p.tags ?? []).join(' '), p.notas ?? ''].join(' '), claves),
      }))
    ),
    grupos: topN(
      datos.grupos.map(g => ({
        item: g,
        score: puntuar([g.nombre, (g.tags ?? []).join(' '), g.notas ?? ''].join(' '), claves),
      }))
    ),
  } as Resultados;
}

/** Devuelve la respuesta armada con lo que coincide con la pregunta, sin IA. */
export function responderConMisDatos(query: string, datos: DatosCerebro): string {
  if (palabrasClave(query).length === 0) {
    return 'Escribí una pregunta con alguna palabra concreta (un tema, una persona o un grupo) y busco en tus notas.';
  }

  const { notas, personas, grupos } = buscarRelevantes(query, datos);

  if (notas.length === 0 && personas.length === 0 && grupos.length === 0) {
    return 'No encontré nada en tus notas, personas ni grupos que coincida con esa pregunta. Probá con otras palabras o con alguno de tus tags.';
  }

  const partes: string[] = [];

  if (notas.length) {
    partes.push(
      `Encontré ${notas.length} ${notas.length === 1 ? 'nota' : 'notas'}:\n` +
        notas
          .map(n => `• ${n.titulo || '(sin título)'} (${n.fecha}): ${recortar(n.contenido)}`)
          .join('\n')
    );
  }

  if (personas.length) {
    partes.push(
      'Personas:\n' +
        personas
          .map(p => `• ${p.nombre}${p.notas ? ': ' + recortar(p.notas, 120) : ''}`)
          .join('\n')
    );
  }

  if (grupos.length) {
    partes.push(
      'Grupos:\n' +
        grupos
          .map(g => `• ${g.nombre}${g.notas ? ': ' + recortar(g.notas, 120) : ''}`)
          .join('\n')
    );
  }

  return partes.join('\n\n');
}
