import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { FSEvento, FSTarea, FSMision, FSHabito, FSEntradaDiario, FSDiarioPrefs, DiarioReaction } from '../types';
import { ARTICULOS } from '../utils/diarioSeed';
import type { DiarioArticulo } from '../utils/diarioSeed';
import { arteDeArticulo } from '../utils/diarioArte';
import { HOY } from '../utils/constants';
import { isHabitActiveToday, isHabitDoneToday } from '../utils/helpers';

const BG = '#f4ecdb';
const INK = '#1c1a17';
const MUTED = '#6b6357';
const BORDER = '#d6cbb4';
const ACCENT = '#8b2e2e';
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

// Las 8 páginas de la edición. Cada una tiene una función clara.
const PAGINAS = [
  { nombre: 'Portada' },
  { nombre: 'Tu día y trabajo' },
  { nombre: 'Argentina' },
  { nombre: 'Mundo y tecnología' },
  { nombre: 'Deportes' },
  { nombre: 'Ciencia y filosofía' },
  { nombre: 'Cultura e intereses' },
  { nombre: 'Contratapa' },
];

const LARGO_BREVE = 180;

type Props = {
  fsHabitos:   FSHabito[];
  fsEventos:   FSEvento[];
  fsTareas:    FSTarea[];
  fsMisiones:  FSMision[];
  fsEntradas:  FSEntradaDiario[];
  diarioPrefs: FSDiarioPrefs;
  onReact:     (artId: string, reaction: DiarioReaction, tags: string[]) => void;
};

// ── Helpers de datos ──────────────────────────────────────────────────────────

function sumarDias(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fechaCorta(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function puntaje(a: DiarioArticulo, prefs: FSDiarioPrefs): number {
  return a.tags.reduce((s, t) => s + (prefs.tagScores[t] ?? 0), 0);
}

// Primero lo que todavía no valoraste, después por afinidad con tus tags.
function rankear(lista: DiarioArticulo[], prefs: FSDiarioPrefs): DiarioArticulo[] {
  return [...lista].sort((x, y) =>
    Number(!!prefs.reactions[x.id]) - Number(!!prefs.reactions[y.id]) ||
    puntaje(y, prefs) - puntaje(x, prefs)
  );
}

const hasTag = (a: DiarioArticulo, tags: string[]) => a.tags.some(t => tags.includes(t));

// Cada artículo aparece en una sola página (la portada es la excepción: resume).
function armarEdicion(prefs: FSDiarioPrefs) {
  const usados = new Set<string>();
  const tomar = (pool: DiarioArticulo[], n: number) => {
    const r = rankear(pool.filter(a => !usados.has(a.id)), prefs).slice(0, n);
    r.forEach(a => usados.add(a.id));
    return r;
  };
  const general = ARTICULOS.filter(a => !a.seccion);
  const deportes   = tomar(ARTICULOS.filter(a => a.seccion === 'deporte'), 4);
  const argentina  = tomar(general.filter(a => hasTag(a, ['argentina', 'política', 'democracia'])), 3);
  const mundo      = tomar(general.filter(a => hasTag(a, ['ia', 'inteligencia artificial', 'tecnología', 'programación', 'cripto'])), 3);
  const ciencia    = tomar(general.filter(a => hasTag(a, ['ciencia', 'astronomía', 'evolución', 'biología', 'matemáticas', 'física'])), 2);
  const filosofia  = tomar(general.filter(a => hasTag(a, ['filosofía', 'ética', 'mentalidad'])), 1);
  const cultura    = tomar([
    ...ARTICULOS.filter(a => a.seccion === 'entretenimiento'),
    ...general.filter(a => hasTag(a, ['cultura', 'arte', 'música', 'cine', 'fotografía'])),
  ], 3);
  const contratapa = tomar(general, 1);
  return { deportes, argentina, mundo, ciencia, filosofia, cultura, contratapa };
}

// ── Piezas visuales ───────────────────────────────────────────────────────────

const linkBtn: CSSProperties = {
  background: 'none', border: 'none', color: ACCENT, cursor: 'pointer',
  padding: 0, fontFamily: SANS, fontSize: 13,
};

const reactBtn = (activo: boolean): CSSProperties => ({
  background: activo ? INK : 'transparent',
  color: activo ? BG : INK,
  border: `1px solid ${activo ? INK : BORDER}`,
  borderRadius: 999, padding: '4px 12px', cursor: 'pointer', fontSize: 14,
});

// Foto real si el artículo la tiene; si no, ilustración generada a partir del id.
function Ilustracion({ a, alto }: { a: DiarioArticulo; alto: number }) {
  const estilo: CSSProperties = { width: '100%', height: alto, display: 'block', borderRadius: 4, marginBottom: 14 };
  if (a.imagen) {
    return <img src={a.imagen} alt={a.titulo} style={{ ...estilo, objectFit: 'cover' }} />;
  }
  const arte = arteDeArticulo(a.id, a.seccion);
  return (
    <svg viewBox={`0 0 ${arte.ancho} ${arte.alto}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={estilo}>
      <rect width={arte.ancho} height={arte.alto} fill={arte.fondo} />
      {arte.formas.map((f, i) => {
        if (f.tipo === 'circulo') {
          return <circle key={i} cx={f.x} cy={f.y} r={f.r} fill={f.color} opacity={f.opacidad} />;
        }
        if (f.tipo === 'rect') {
          return (
            <rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} fill={f.color} opacity={f.opacidad}
              transform={`rotate(${f.rot} ${f.x + f.w / 2} ${f.y + f.h / 2})`} />
          );
        }
        return <line key={i} x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} stroke={f.color} strokeWidth={f.grosor} />;
      })}
    </svg>
  );
}

function Articulo({ a, prefs, onReact, principal = false }: {
  a: DiarioArticulo; prefs: FSDiarioPrefs;
  onReact: Props['onReact']; principal?: boolean;
}) {
  const [abierto, setAbierto] = useState(principal);
  const largo = a.contenido.length > LARGO_BREVE;
  const texto = abierto || !largo ? a.contenido : a.contenido.slice(0, LARGO_BREVE) + '…';
  const reaccion = prefs.reactions[a.id];

  return (
    <article style={{ borderTop: `1px solid ${BORDER}`, padding: principal ? '12px 0 24px' : '18px 0' }}>
      <Ilustracion a={a} alto={principal ? 260 : 150} />
      <h3 style={{
        fontFamily: SERIF, fontWeight: 700, color: INK, margin: '0 0 8px', lineHeight: 1.2,
        fontSize: principal ? 'clamp(26px, 4vw, 38px)' : 'clamp(18px, 2.4vw, 22px)',
      }}>
        {a.titulo}
      </h3>
      {a.fuente && (
        <p style={{ fontFamily: SANS, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 8px' }}>
          {a.fuente}
        </p>
      )}
      <p style={{ fontFamily: SERIF, fontSize: principal ? 17 : 15, lineHeight: 1.6, color: INK, margin: '0 0 12px' }}>
        {texto}
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {largo && (
          <button onClick={() => setAbierto(v => !v)} style={linkBtn}>
            {abierto ? 'Cerrar' : 'Leer más'}
          </button>
        )}
        <button onClick={() => onReact(a.id, 'like', a.tags)} style={reactBtn(reaccion === 'like')} aria-label="Me gusta">👍</button>
        <button onClick={() => onReact(a.id, 'dislike', a.tags)} style={reactBtn(reaccion === 'dislike')} aria-label="No me interesa">👎</button>
      </div>
    </article>
  );
}

function Encabezado({ kicker, titulo }: { kicker: string; titulo: string }) {
  return (
    <header style={{ borderBottom: `2px solid ${INK}`, paddingBottom: 12, marginBottom: 20 }}>
      <p style={{ fontFamily: SANS, fontSize: 11, color: ACCENT, letterSpacing: '.14em', textTransform: 'uppercase', margin: '0 0 4px' }}>{kicker}</p>
      <h2 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 'clamp(28px, 5vw, 44px)', color: INK, margin: 0, lineHeight: 1.05 }}>{titulo}</h2>
    </header>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <p style={{ fontFamily: SERIF, fontStyle: 'italic', color: MUTED }}>{texto}</p>;
}

// Página con una pieza principal y hasta dos secundarias.
function PaginaNoticias({ kicker, titulo, lista, prefs, onReact }: {
  kicker: string; titulo: string; lista: DiarioArticulo[];
  prefs: FSDiarioPrefs; onReact: Props['onReact'];
}) {
  const [principal, ...breves] = lista;
  return (
    <>
      <Encabezado kicker={kicker} titulo={titulo} />
      {!principal && <Vacio texto="Hoy no hay contenido seleccionado para esta sección." />}
      {principal && <Articulo a={principal} prefs={prefs} onReact={onReact} principal />}
      {breves.slice(0, 2).map(a => <Articulo key={a.id} a={a} prefs={prefs} onReact={onReact} />)}
    </>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function DiarioEdicion({ fsHabitos, fsEventos, fsTareas, fsMisiones, fsEntradas, diarioPrefs, onReact }: Props) {
  const [pagina, setPagina] = useState(0);
  const [indiceAbierto, setIndiceAbierto] = useState(false);
  const [terminada, setTerminada] = useState(false);

  const ed = useMemo(() => armarEdicion(diarioPrefs), [diarioPrefs]);
  // La portada resume: puede repetir artículos que aparecen en las páginas interiores.
  const portada = useMemo(() => rankear(ARTICULOS, diarioPrefs).slice(0, 4), [diarioPrefs]);

  const total = PAGINAS.length;
  const irA = (i: number) => {
    setPagina(Math.max(0, Math.min(total - 1, i)));
    setIndiceAbierto(false);
  };

  const fechaObj = new Date(HOY + 'T12:00:00');
  const fechaLarga = fechaObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fechaCap = fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1);

  // ── Página 1 · Portada
  const renderPortada = () => {
    const [headline, ...resto] = portada;
    return (
      <>
        <p style={{ fontFamily: SANS, fontSize: 12, color: MUTED, textTransform: 'uppercase', letterSpacing: '.1em', margin: '0 0 12px' }}>
          Edición del {fechaCap}
        </p>
        {headline && <Articulo a={headline} prefs={diarioPrefs} onReact={onReact} principal />}
        <h4 style={{ fontFamily: SANS, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: ACCENT, margin: '24px 0 4px' }}>Destacados</h4>
        {resto.slice(0, 3).map(a => <Articulo key={a.id} a={a} prefs={diarioPrefs} onReact={onReact} />)}
        <h4 style={{ fontFamily: SANS, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: ACCENT, margin: '28px 0 8px' }}>En esta edición</h4>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
          {PAGINAS.slice(1).map((p, i) => (
            <li key={p.nombre}>
              <button onClick={() => irA(i + 1)} style={{ ...linkBtn, color: INK, fontFamily: SERIF, fontSize: 17 }}>
                {i + 2}. {p.nombre}
              </button>
            </li>
          ))}
        </ol>
      </>
    );
  };

  // ── Página 2 · Tu día y trabajo
  const renderDia = () => {
    const limite = sumarDias(HOY, 7);
    const agendaHoy = fsEventos
      .filter(e => e.fecha === HOY)
      .sort((a, b) => (a.hora ?? '').localeCompare(b.hora ?? ''));
    const habitosPendientes = fsHabitos.filter(h => isHabitActiveToday(h) && !isHabitDoneToday(h));
    const misionesUrgentes = fsMisiones
      .filter(m => !m.completada && (m.prioridad === 'urgente' || m.prioridad === 'alta'))
      .slice(0, 4);
    const proximos = [
      ...fsEventos
        .filter(e => e.fecha > HOY && e.fecha <= limite)
        .map(e => ({ id: e.id, titulo: e.titulo, fecha: e.fecha, hora: e.hora })),
      ...fsTareas
        .filter(t => t.recurrence === 'once' && !!t.date && t.date > HOY && t.date <= limite && t.completedDates.length === 0)
        .map(t => ({ id: t.id, titulo: t.titulo, fecha: t.date ?? '', hora: t.hora })),
    ].sort((a, b) => a.fecha.localeCompare(b.fecha));
    const ayer = sumarDias(HOY, -1);
    const cronica = fsEntradas.find(e => e.fecha === ayer);

    return (
      <>
        <Encabezado kicker="Tu día" titulo="Tu día y trabajo" />

        <h4 style={{ fontFamily: SANS, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: ACCENT, margin: '0 0 8px' }}>Requiere atención hoy</h4>
        {habitosPendientes.length === 0 && misionesUrgentes.length === 0 && <Vacio texto="Nada urgente pendiente." />}
        <ul style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.7, paddingLeft: 20, margin: '0 0 24px' }}>
          {habitosPendientes.map(h => <li key={h.id}>Hábito: {h.nombre}</li>)}
          {misionesUrgentes.map(m => <li key={m.id}>Misión {m.prioridad}: {m.titulo}</li>)}
        </ul>

        <h4 style={{ fontFamily: SANS, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: ACCENT, margin: '0 0 8px' }}>Agenda de hoy · confirmados</h4>
        {agendaHoy.length === 0 && <Vacio texto="Sin eventos para hoy." />}
        <ul style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.7, paddingLeft: 20, margin: '0 0 24px' }}>
          {agendaHoy.map(e => <li key={e.id}>{e.hora ? `${e.hora} · ` : ''}{e.titulo}</li>)}
        </ul>

        <h4 style={{ fontFamily: SANS, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: ACCENT, margin: '0 0 8px' }}>Próximos vencimientos · 7 días</h4>
        {proximos.length === 0 && <Vacio texto="Nada vence en la próxima semana." />}
        <ul style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.7, paddingLeft: 20, margin: '0 0 24px' }}>
          {proximos.map(p => (
            <li key={p.id}>{fechaCorta(p.fecha)}{p.hora ? ` ${p.hora}` : ''} · {p.titulo}</li>
          ))}
        </ul>

        <h4 style={{ fontFamily: SANS, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: ACCENT, margin: '0 0 8px' }}>Crónica de ayer</h4>
        {cronica
          ? <>
              <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, margin: '0 0 6px' }}>{cronica.titulo ?? 'Sin título'}</h3>
              <p style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.6, margin: 0 }}>{cronica.contenido.slice(0, 400)}</p>
            </>
          : <Vacio texto="No escribiste nada ayer." />}
      </>
    );
  };

  // ── Página 4 · Ciencia y filosofía (dos piezas separadas visualmente)
  const renderCiencia = () => {
    const [cien] = ed.ciencia;
    const [filo] = ed.filosofia;
    return (
      <>
        <Encabezado kicker="Ciencia y filosofía" titulo="Ciencia y filosofía" />
        {!cien && !filo && <Vacio texto="Hoy no hay contenido seleccionado para esta sección." />}
        {cien && <>
          <p style={{ fontFamily: SANS, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '.1em', margin: 0 }}>Ciencia</p>
          <Articulo a={cien} prefs={diarioPrefs} onReact={onReact} principal />
        </>}
        {filo && <>
          <div style={{ height: 1, background: BORDER, margin: '24px 0' }} />
          <p style={{ fontFamily: SANS, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '.1em', margin: 0 }}>Filosofía · para pensar despacio</p>
          <Articulo a={filo} prefs={diarioPrefs} onReact={onReact} />
        </>}
      </>
    );
  };

  // ── Página 5 · Deportes (con franja de agenda deportiva)
  const renderDeportes = () => {
    const deporteRe = /futbol|fútbol|hockey|mma|ufc|jiu|padel|pádel|tenis|partido|torneo|selección/i;
    const agendaDep = fsEventos
      .filter(e => e.fecha >= HOY && deporteRe.test(e.titulo))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, 4);
    return (
      <>
        <PaginaNoticias kicker="Sección deporte" titulo="Deportes" lista={ed.deportes} prefs={diarioPrefs} onReact={onReact} />
        <div style={{ marginTop: 24, borderTop: `2px solid ${INK}`, paddingTop: 12 }}>
          <h4 style={{ fontFamily: SANS, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.1em', color: ACCENT, margin: '0 0 8px' }}>Próximos encuentros</h4>
          {agendaDep.length === 0 && <Vacio texto="Sin encuentros cargados en tu agenda." />}
          <ul style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
            {agendaDep.map(e => <li key={e.id}>{fechaCorta(e.fecha)}{e.hora ? ` ${e.hora}` : ''} · {e.titulo}</li>)}
          </ul>
        </div>
      </>
    );
  };

  // ── Página 8 · Contratapa
  const renderContratapa = () => {
    const [lectura] = ed.contratapa;
    return (
      <>
        <Encabezado kicker="Cierre de la edición" titulo="Contratapa" />
        {lectura && <>
          <p style={{ fontFamily: SANS, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '.1em', margin: '0 0 4px' }}>Lectura para guardar</p>
          <Articulo a={lectura} prefs={diarioPrefs} onReact={onReact} principal />
        </>}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          {terminada
            ? <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 18 }}>Edición terminada. Nos vemos mañana.</p>
            : <button onClick={() => setTerminada(true)} style={{
                background: INK, color: BG, border: 'none', borderRadius: 999,
                padding: '12px 24px', fontFamily: SANS, fontSize: 15, cursor: 'pointer',
              }}>Terminar edición</button>}
        </div>
      </>
    );
  };

  const renderPagina = () => {
    switch (pagina) {
      case 0: return renderPortada();
      case 1: return renderDia();
      case 2: return <PaginaNoticias kicker="Actualidad nacional" titulo="Argentina" lista={ed.argentina} prefs={diarioPrefs} onReact={onReact} />;
      case 3: return <PaginaNoticias kicker="Mundo y tecnología" titulo="Mundo y tecnología" lista={ed.mundo} prefs={diarioPrefs} onReact={onReact} />;
      case 4: return renderDeportes();
      case 5: return renderCiencia();
      case 6: return <PaginaNoticias kicker="Intereses" titulo="Cultura e intereses" lista={ed.cultura} prefs={diarioPrefs} onReact={onReact} />;
      default: return renderContratapa();
    }
  };

  return (
    <div style={{ background: BG, color: INK, minHeight: '100vh', fontFamily: SANS }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 16px 60px' }}>

        {/* Barra superior: nombre de la página e índice */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${BORDER}`, paddingBottom: 10, marginBottom: 20 }}>
          <span style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>{PAGINAS[pagina].nombre}</span>
          <button onClick={() => setIndiceAbierto(v => !v)} style={{ ...linkBtn, fontSize: 14 }}>
            {indiceAbierto ? 'Cerrar índice' : 'Índice'}
          </button>
        </div>

        {indiceAbierto && (
          <ol style={{ listStyle: 'none', margin: '0 0 24px', display: 'grid', gap: 8, background: '#ebe2cc', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 16 }}>
            {PAGINAS.map((p, i) => (
              <li key={p.nombre}>
                <button onClick={() => irA(i)} style={{ ...linkBtn, color: i === pagina ? ACCENT : INK, fontWeight: i === pagina ? 700 : 400, fontSize: 16 }}>
                  {i + 1}. {p.nombre}
                </button>
              </li>
            ))}
          </ol>
        )}

        <main key={pagina}>{renderPagina()}</main>

        {/* Pie: navegación sin depender solo del gesto */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${INK}`, marginTop: 32, paddingTop: 14, fontSize: 14 }}>
          <button onClick={() => irA(pagina - 1)} disabled={pagina === 0} style={{ ...linkBtn, opacity: pagina === 0 ? 0.35 : 1 }}>← Anterior</button>
          <span style={{ color: MUTED }}>{pagina + 1} de {total}</span>
          <button onClick={() => irA(pagina + 1)} disabled={pagina === total - 1} style={{ ...linkBtn, opacity: pagina === total - 1 ? 0.35 : 1 }}>Siguiente →</button>
        </nav>
      </div>
    </div>
  );
}
