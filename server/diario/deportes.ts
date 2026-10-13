// Resultados y próximos encuentros: ESPN (fútbol argentino, UFC, tenis ATP)
// y Jolpica/Ergast (Fórmula 1). Endpoints públicos, sin API key.

import type { Competidor, DeportesEdicion, EncuentroDeportivo } from './tipos.js';
import { hoyArgentina, sumarDias } from './fecha.js';
import { enPool, pedirJson } from './red.js';
import { hijo, lista, texto } from './xml.js';

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports';
const JOLPICA = 'https://api.jolpi.ca/ergast/f1';

type Estado = EncuentroDeportivo['estado'];

const estadoDe = (v: unknown): Estado => {
  const s = texto(hijo(v, 'status', 'type', 'state'));
  return s === 'post' || s === 'in' ? s : 'pre';
};

function competidorEspn(c: unknown): Competidor {
  const equipo = hijo(c, 'team');
  const atleta = hijo(c, 'athlete');
  const nombre = texto(hijo(equipo, 'displayName')) || texto(hijo(atleta, 'displayName')) || texto(hijo(atleta, 'shortName'));
  const escudo = texto(hijo(equipo, 'logo')) || texto(hijo(atleta, 'flag', 'href'));
  const marcador = texto(hijo(c, 'score'));
  return {
    nombre,
    abrev:   texto(hijo(equipo, 'abbreviation')) || undefined,
    escudo:  escudo || undefined,
    marcador: marcador || undefined,
    ganador: hijo(c, 'winner') === true,
  };
}

function linkEspn(evento: unknown): string | undefined {
  const link = lista(hijo(evento, 'links')).find(l => lista(hijo(l, 'rel')).map(texto).includes('summary'))
    ?? lista(hijo(evento, 'links'))[0];
  return texto(hijo(link, 'href')) || undefined;
}

// ── Fútbol: Liga Profesional, día por día (el rango de fechas no funciona) ───

function partidosFutbol(json: unknown): EncuentroDeportivo[] {
  return lista(hijo(json, 'events')).map((ev): EncuentroDeportivo => {
    const comp = hijo(ev, 'competitions', 0);
    const competidores = lista(hijo(comp, 'competitors'));
    const local = competidores.find(c => texto(hijo(c, 'homeAway')) === 'home') ?? competidores[0];
    const visitante = competidores.find(c => texto(hijo(c, 'homeAway')) === 'away') ?? competidores[1];
    const l = competidorEspn(local);
    const v = competidorEspn(visitante);
    const estado = estadoDe(comp);
    // ESPN manda "0" de marcador en los partidos que todavía no se jugaron.
    if (estado === 'pre') { l.marcador = undefined; v.marcador = undefined; }
    return {
      id:          'futbol-' + texto(hijo(ev, 'id')),
      deporte:     'futbol',
      competencia: 'Liga Profesional',
      fecha:       texto(hijo(ev, 'date')),
      estado,
      titulo:      `${l.nombre} vs ${v.nombre}`,
      local:       l,
      visitante:   v,
      // En vivo ESPN manda el minuto ("67'"); el resto se describe en español.
      detalle:     estado === 'in' ? texto(hijo(comp, 'status', 'type', 'shortDetail')) || 'En juego'
                 : estado === 'post' ? 'Final' : undefined,
      url:         linkEspn(ev),
    };
  });
}

// ── Fórmula 1 ────────────────────────────────────────────────────────────────

const GP_ES: Record<string, string> = {
  'Australian': 'Australia', 'Chinese': 'China', 'Japanese': 'Japón', 'Bahrain': 'Baréin',
  'Saudi Arabian': 'Arabia Saudita', 'Miami': 'Miami', 'Emilia Romagna': 'Emilia-Romaña',
  'Monaco': 'Mónaco', 'Spanish': 'España', 'Barcelona-Catalunya': 'Barcelona', 'Madrid': 'Madrid',
  'Canadian': 'Canadá', 'Austrian': 'Austria', 'British': 'Gran Bretaña', 'Belgian': 'Bélgica',
  'Hungarian': 'Hungría', 'Dutch': 'Países Bajos', 'Italian': 'Italia', 'Azerbaijan': 'Azerbaiyán',
  'Singapore': 'Singapur', 'United States': 'Estados Unidos', 'Mexico City': 'México',
  'São Paulo': 'Brasil', 'Las Vegas': 'Las Vegas', 'Qatar': 'Catar', 'Abu Dhabi': 'Abu Dabi',
};
const nombreGp = (carrera: unknown) => {
  const base = texto(hijo(carrera, 'raceName')).replace(/ Grand Prix$/, '');
  return GP_ES[base] ?? base;
};
const fechaGp = (carrera: unknown) => {
  const fecha = texto(hijo(carrera, 'date'));
  const hora = texto(hijo(carrera, 'time')) || '12:00:00Z';
  return fecha ? `${fecha}T${hora}` : '';
};
const piloto = (r: unknown) => `${texto(hijo(r, 'Driver', 'givenName'))} ${texto(hijo(r, 'Driver', 'familyName'))}`.trim();

function f1Ultima(json: unknown): EncuentroDeportivo[] {
  const carrera = hijo(json, 'MRData', 'RaceTable', 'Races', 0);
  if (!carrera) return [];
  const podio = lista(hijo(carrera, 'Results')).slice(0, 3);
  if (!podio.length) return [];
  const ganador = podio[0];
  const tiempo = texto(hijo(ganador, 'Time', 'time'));
  const resto = podio.slice(1).map((r, i) => `${i + 2}º ${texto(hijo(r, 'Driver', 'familyName'))}`).join(' · ');
  return [{
    id:          'f1-' + texto(hijo(carrera, 'season')) + '-' + texto(hijo(carrera, 'round')),
    deporte:     'f1',
    competencia: 'Fórmula 1',
    fecha:       fechaGp(carrera),
    estado:      'post',
    titulo:      `GP de ${nombreGp(carrera)}`,
    detalle:     `Ganó ${piloto(ganador)} (${texto(hijo(ganador, 'Constructor', 'name'))})${tiempo ? ' · ' + tiempo : ''}${resto ? ' · ' + resto : ''}`,
    url:         texto(hijo(carrera, 'url')) || undefined,
  }];
}

function f1Proxima(json: unknown): EncuentroDeportivo[] {
  const carrera = hijo(json, 'MRData', 'RaceTable', 'Races', 0);
  if (!carrera) return [];
  const circuito = texto(hijo(carrera, 'Circuit', 'circuitName'));
  const lugar = texto(hijo(carrera, 'Circuit', 'Location', 'locality'));
  return [{
    id:          'f1-' + texto(hijo(carrera, 'season')) + '-' + texto(hijo(carrera, 'round')),
    deporte:     'f1',
    competencia: 'Fórmula 1',
    fecha:       fechaGp(carrera),
    estado:      'pre',
    titulo:      `GP de ${nombreGp(carrera)}`,
    detalle:     [circuito, lugar].filter(Boolean).join(' · ') || undefined,
    url:         texto(hijo(carrera, 'url')) || undefined,
  }];
}

// ── UFC ──────────────────────────────────────────────────────────────────────

function eventosUfc(json: unknown): EncuentroDeportivo[] {
  return lista(hijo(json, 'events')).map((ev): EncuentroDeportivo => {
    const peleas = lista(hijo(ev, 'competitions'));
    const estado = hijo(ev, 'status') ? estadoDe(ev) : estadoDe(hijo(ev, 'competitions', 0));
    const ganadores = peleas
      .map(p => lista(hijo(p, 'competitors')).find(c => hijo(c, 'winner') === true))
      .filter(Boolean)
      .slice(-2)
      .map(c => texto(hijo(c, 'athlete', 'displayName')));
    return {
      id:          'ufc-' + texto(hijo(ev, 'id')),
      deporte:     'ufc',
      competencia: 'UFC',
      fecha:       texto(hijo(ev, 'date')),
      estado,
      titulo:      texto(hijo(ev, 'name')) || 'UFC',
      detalle:     estado === 'post' && ganadores.length
        ? `Ganaron ${ganadores.join(' y ')}`
        : `${peleas.length} peleas en la cartelera`,
      url:         linkEspn(ev),
    };
  });
}

// ── Tenis ATP ────────────────────────────────────────────────────────────────

function partidosTenis(json: unknown): EncuentroDeportivo[] {
  const salida: EncuentroDeportivo[] = [];
  for (const torneo of lista(hijo(json, 'events'))) {
    const nombreTorneo = texto(hijo(torneo, 'name')) || 'ATP';
    for (const cuadro of lista(hijo(torneo, 'groupings'))) {
      const nombreCuadro = texto(hijo(cuadro, 'grouping', 'displayName'));
      if (nombreCuadro && !/singles/i.test(nombreCuadro)) continue;
      for (const p of lista(hijo(cuadro, 'competitions'))) {
        const [a, b] = lista(hijo(p, 'competitors'));
        if (!a || !b) continue;
        const ca = competidorEspn(a);
        const cb = competidorEspn(b);
        const sets = lista(hijo(a, 'linescores'))
          .map((s, i) => `${texto(hijo(s, 'value'))}-${texto(hijo(lista(hijo(b, 'linescores'))[i], 'value'))}`)
          .join(' ');
        const estado = estadoDe(p);
        const ganador = ca.ganador ? ca.nombre : cb.ganador ? cb.nombre : '';
        salida.push({
          id:          'tenis-' + texto(hijo(p, 'id')),
          deporte:     'tenis',
          competencia: nombreTorneo,
          fecha:       texto(hijo(p, 'date')) || texto(hijo(torneo, 'date')),
          estado,
          titulo:      `${ca.nombre} vs ${cb.nombre}`,
          detalle:     estado === 'post' && ganador ? `Ganó ${ganador}${sets ? ' · ' + sets : ''}` : nombreTorneo,
          url:         linkEspn(p) ?? linkEspn(torneo),
        });
      }
    }
  }
  return salida;
}

// ── Armado ───────────────────────────────────────────────────────────────────

const porFecha = (a: EncuentroDeportivo, b: EncuentroDeportivo) => Date.parse(a.fecha) - Date.parse(b.fecha);

export async function obtenerDeportes(limite: number): Promise<DeportesEdicion> {
  const hoy = hoyArgentina();
  // De -4 a +8 días: lo mismo que aceptan los filtros de resultados y próximos.
  const dias = Array.from({ length: 13 }, (_, i) => sumarDias(hoy, i - 4).replace(/-/g, ''));

  const pedidos: Array<{ url: string; armar: (json: unknown) => EncuentroDeportivo[] }> = [
    ...dias.map(d => ({ url: `${ESPN}/soccer/arg.1/scoreboard?dates=${d}`, armar: partidosFutbol })),
    { url: `${JOLPICA}/current/last/results.json`, armar: f1Ultima },
    { url: `${JOLPICA}/current/next.json`,         armar: f1Proxima },
    { url: `${ESPN}/mma/ufc/scoreboard`,            armar: eventosUfc },
    { url: `${ESPN}/tennis/atp/scoreboard`,         armar: partidosTenis },
  ];

  const respuestas = await enPool(pedidos, 8, async p => p.armar(await pedirJson(p.url, { timeoutMs: 5000, limite })));
  const todos = new Map<string, EncuentroDeportivo>();
  for (const lote of respuestas) for (const e of lote ?? []) if (e.fecha && !Number.isNaN(Date.parse(e.fecha))) todos.set(e.id, e);

  const ahora = Date.now();
  const hace4Dias = ahora - 4 * 86_400_000;
  const en8Dias = ahora + 8 * 86_400_000;
  const en21Dias = ahora + 21 * 86_400_000; // la F1 corre cada dos o tres semanas
  const enc = [...todos.values()];

  const resultados = enc
    .filter(e => e.estado !== 'pre' && Date.parse(e.fecha) >= hace4Dias)
    .sort((a, b) => porFecha(b, a));
  const proximos = enc
    .filter(e => e.estado === 'pre' && Date.parse(e.fecha) >= ahora - 3 * 3_600_000
      && Date.parse(e.fecha) <= (e.deporte === 'f1' ? en21Dias : en8Dias))
    .sort(porFecha);

  // Tope por deporte para que el tenis (cientos de partidos) no tape al resto.
  const topePorDeporte = (lista: EncuentroDeportivo[], tope: Record<EncuentroDeportivo['deporte'], number>) => {
    const cuenta: Record<string, number> = {};
    return lista.filter(e => (cuenta[e.deporte] = (cuenta[e.deporte] ?? 0) + 1) <= tope[e.deporte]);
  };

  return {
    resultados: topePorDeporte(resultados, { futbol: 10, f1: 1, ufc: 1, tenis: 4 }),
    proximos:   topePorDeporte(proximos,   { futbol: 10, f1: 1, ufc: 1, tenis: 4 }),
  };
}

