// Páginas de la edición. Cada una recibe ya elegidas sus piezas (utils/edicion.ts).

import { useMemo, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import type {
  ArticuloEdicion, DeporteId, EdicionDiaria, EncuentroDeportivo,
} from '../../types';
import {
  DEPORTES, deportesElegidos, diaSemanaArgentina, horaArgentina, kicker, minutosLectura,
  type Seleccion,
} from '../../utils/edicion';
import { useDiario } from './contexto';
import {
  Acciones, Foto, Idioma, Kicker, LinkFuente, PiezaPrincipal, PiezaSecundaria, Resaltado, TituloSeccion, Vacio,
} from './Piezas';

export interface PaginaInfo { key: string; nombre: string }

// ── Portada ──────────────────────────────────────────────────────────────────

export function PaginaPortada({ sel, paginas, onIr, idTitulo }: {
  sel: Seleccion; paginas: PaginaInfo[]; onIr: (key: string) => void; idTitulo: string;
}) {
  const { principal, destacados } = sel.portada;
  const paginaDe = (a: ArticuloEdicion) =>
    a.seccion === 'deportes' ? 'deportes' : a.seccion === 'cultura' ? 'cultura' : a.seccion === 'ciencia' ? 'ciencia' : 'argentina';
  const nombreDe = (key: string) => paginas.find(p => p.key === key)?.nombre ?? '';
  return (
    <>
      <h2 className="g-seccion" id={idTitulo} tabIndex={-1} style={{ fontSize: 'clamp(26px, 6vw, 40px)' }}>Portada</h2>
      {principal ? <PiezaPrincipal art={principal} /> : <Vacio>La edición de hoy todavía no tiene notas.</Vacio>}
      {destacados.length > 0 && <p className="g-rotulo">Destacados</p>}
      {destacados.map(a => (
        <button key={a.id} type="button" className="g-destacado" onClick={() => onIr(paginaDe(a))}>
          <Foto key={a.id} art={a} className="" />
          <span>
            <Kicker>{nombreDe(paginaDe(a))}</Kicker>
            <span className="g-titular g-titular-breve" style={{ display: 'block' }}>{a.titulo}</span>
          </span>
        </button>
      ))}
      <p className="g-rotulo" style={{ marginTop: 22 }}>En esta edición</p>
      <ol className="g-filas">
        {paginas.slice(1).map((p, i) => (
          <li key={p.key}>
            <button type="button" className="g-fila" style={{ width: '100%', background: 'none', border: 0, borderBottom: '1px solid var(--linea)', cursor: 'pointer' }} onClick={() => onIr(p.key)}>
              <span className="g-fila-dia" style={{ color: 'var(--bordo)', fontFamily: 'var(--serif)' }}>{i + 2}</span>
              <span className="g-fila-texto">{p.nombre}</span>
              <ChevronRight className="g-fila-chev" size={20} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

// ── Argentina ────────────────────────────────────────────────────────────────

export function PaginaArgentina({ sel, idTitulo }: { sel: Seleccion; idTitulo: string }) {
  const [principal, ...resto] = sel.argentina.piezas;
  const ctx = sel.argentina.contexto;
  return (
    <>
      <TituloSeccion titulo="Argentina" subtitulo="Política, economía y sociedad" idTitulo={idTitulo} />
      {principal && <PiezaPrincipal art={principal} omitirTags={['argentina']} />}
      {ctx && (
        <aside className="g-contexto" aria-label="Por qué importa">
          <Kicker>Por qué importa · {ctx.fuente}</Kicker>
          <h3 className="g-titular g-titular-breve">{ctx.titulo}</h3>
          {ctx.bajada && <p className="g-bajada" style={{ fontSize: 16 }}><Resaltado texto={ctx.bajada} /></p>}
          <LinkFuente art={ctx} />
          <Acciones art={ctx} compactas />
        </aside>
      )}
      {resto.map(a => <PiezaSecundaria key={a.id} art={a} omitirTags={['argentina']} />)}
    </>
  );
}

// ── Mundo y tecnología ───────────────────────────────────────────────────────

export function PaginaMundo({ sel, idTitulo }: { sel: Seleccion; idTitulo: string }) {
  const [principal, ...resto] = sel.mundo.piezas;
  return (
    <>
      <TituloSeccion titulo="Mundo y tecnología" subtitulo="Actualidad internacional, IA y cambios tecnológicos" idTitulo={idTitulo} />
      {principal && <PiezaPrincipal art={principal} />}
      {resto.map(a => <PiezaSecundaria key={a.id} art={a} />)}
      {sel.mundo.breves.length > 0 && <p className="g-subrotulo">Breves</p>}
      {sel.mundo.breves.map(a => (
        <article key={a.id} className="g-pieza">
          <Kicker>{kicker(a)}</Kicker>
          <h3 className="g-titular g-titular-breve">{a.titulo}<Idioma art={a} /></h3>
          {a.bajada && <p className="g-bajada" style={{ fontSize: 16 }}><Resaltado texto={a.bajada} /></p>}
          <LinkFuente art={a} />
          <Acciones art={a} compactas />
        </article>
      ))}
    </>
  );
}

// ── Deportes ─────────────────────────────────────────────────────────────────

const ICONO_DEPORTE: Record<DeporteId, string> = { futbol: '⚽', f1: '🏁', ufc: '🥊', tenis: '🎾' };
const NOMBRE_DEPORTE: Record<DeporteId, string> = { futbol: 'Fútbol', f1: 'Fórmula 1', ufc: 'UFC', tenis: 'Tenis' };

function FilaPartido({ e, favoritos }: { e: EncuentroDeportivo; favoritos: string[] }) {
  const fav = (n?: string) => !!n && favoritos.includes(n);
  return (
    <tr>
      <td>
        <span className={`g-equipo g-equipo-local${fav(e.local?.nombre) ? ' g-equipo-favorito' : ''}`}>
          {e.local?.nombre}
          {e.local?.escudo && <img className="g-escudo" src={e.local.escudo} alt="" loading="lazy" referrerPolicy="no-referrer" />}
        </span>
      </td>
      <td className="g-marcador" aria-label={`${e.local?.marcador ?? 0} a ${e.visitante?.marcador ?? 0}`}>
        {e.local?.marcador ?? '–'} — {e.visitante?.marcador ?? '–'}
      </td>
      <td>
        <span className={`g-equipo${fav(e.visitante?.nombre) ? ' g-equipo-favorito' : ''}`}>
          {e.visitante?.escudo && <img className="g-escudo" src={e.visitante.escudo} alt="" loading="lazy" referrerPolicy="no-referrer" />}
          {e.visitante?.nombre}
        </span>
      </td>
    </tr>
  );
}

export function PaginaDeportes({ sel, edicion, onPrefsDeportes, idTitulo }: {
  sel: Seleccion; edicion: EdicionDiaria; idTitulo: string;
  onPrefsDeportes: (deportes: DeporteId[], equipos: string[]) => void;
}) {
  const { prefs } = useDiario();
  const elegidos = deportesElegidos(prefs);
  const equipos = prefs.equipos ?? [];
  const [principal, ...resto] = sel.deportes.piezas;

  const primeroFavoritos = (lista: EncuentroDeportivo[]) => {
    const esFav = (e: EncuentroDeportivo) => equipos.includes(e.local?.nombre ?? '') || equipos.includes(e.visitante?.nombre ?? '');
    return [...lista].sort((a, b) => Number(esFav(b)) - Number(esFav(a)));
  };
  const resultados = edicion.deportes.resultados.filter(e => elegidos.includes(e.deporte));
  const futbol = primeroFavoritos(resultados.filter(e => e.deporte === 'futbol')).slice(0, 6);
  const otros = resultados.filter(e => e.deporte !== 'futbol');
  const proximos = primeroFavoritos(edicion.deportes.proximos.filter(e => elegidos.includes(e.deporte))).slice(0, 8)
    .sort((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha));

  const todosLosEquipos = useMemo(() => {
    const nombres = new Set<string>();
    for (const e of [...edicion.deportes.resultados, ...edicion.deportes.proximos]) {
      if (e.deporte !== 'futbol') continue;
      if (e.local?.nombre) nombres.add(e.local.nombre);
      if (e.visitante?.nombre) nombres.add(e.visitante.nombre);
    }
    return [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
  }, [edicion]);

  const alternarDeporte = (id: DeporteId) => {
    const nuevos = elegidos.includes(id) ? elegidos.filter(d => d !== id) : [...elegidos, id];
    onPrefsDeportes(nuevos, equipos);
  };

  return (
    <>
      <TituloSeccion titulo="Deportes" idTitulo={idTitulo} />
      {principal ? <PiezaPrincipal art={principal} omitirTags={['deporte']} /> : <Vacio>Hoy no hay notas de deportes.</Vacio>}

      <p className="g-subrotulo">Resultados</p>
      {futbol.length === 0 && otros.length === 0 && <Vacio>Sin resultados de tus deportes en los últimos días.</Vacio>}
      {futbol.length > 0 && (
        <div className="g-tabla-scroll" data-sin-swipe>
          <table className="g-resultados">
            <caption className="g-meta" style={{ textAlign: 'left', captionSide: 'top' }}>Liga Profesional</caption>
            <tbody>{futbol.map(e => <FilaPartido key={e.id} e={e} favoritos={equipos} />)}</tbody>
          </table>
        </div>
      )}
      {otros.length > 0 && (
        <ul className="g-filas">
          {otros.map(e => (
            <li key={e.id}>
              <a className="g-fila" href={e.url} target="_blank" rel="noopener noreferrer">
                <span aria-hidden="true">{ICONO_DEPORTE[e.deporte]}</span>
                <span className="g-fila-texto"><strong>{e.titulo}</strong>{e.detalle ? ` · ${e.detalle}` : ''}</span>
                <ChevronRight className="g-fila-chev" size={20} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className="g-subrotulo">Próximos encuentros</p>
      {proximos.length === 0 && <Vacio>No hay próximos encuentros de tus deportes esta semana.</Vacio>}
      <ul className="g-filas">
        {proximos.map(e => (
          <li key={e.id}>
            <a className="g-fila" href={e.url} target="_blank" rel="noopener noreferrer">
              <span className="g-fila-dia">{diaSemanaArgentina(e.fecha)}</span>
              <span className="g-fila-hora">{horaArgentina(e.fecha)}</span>
              <span className="g-fila-texto">· {NOMBRE_DEPORTE[e.deporte]} — {e.titulo}</span>
              <ChevronRight className="g-fila-chev" size={20} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>

      <div className="g-caja">
        <p className="g-caja-titulo">Elegí deportes y equipos para ajustar esta sección</p>
        <div className="g-chips">
          {DEPORTES.map(d => (
            <button key={d.id} type="button" className="g-chip" aria-pressed={elegidos.includes(d.id)} onClick={() => alternarDeporte(d.id)}>
              <span aria-hidden="true">{ICONO_DEPORTE[d.id]}</span> {d.nombre}
            </button>
          ))}
        </div>
        {equipos.length > 0 && (
          <div className="g-chips" style={{ marginTop: 10 }}>
            {equipos.map(eq => (
              <button key={eq} type="button" className="g-chip" aria-pressed="true" aria-label={`Dejar de seguir a ${eq}`}
                onClick={() => onPrefsDeportes(elegidos, equipos.filter(x => x !== eq))}>
                {eq} <X size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        {todosLosEquipos.length > 0 && (
          <label>
            <span className="sr-only">Seguir un equipo</span>
            <select className="g-select" value="" onChange={ev => {
              const eq = ev.target.value;
              if (eq && !equipos.includes(eq)) onPrefsDeportes(elegidos.includes('futbol') ? elegidos : [...elegidos, 'futbol'], [...equipos, eq]);
            }}>
              <option value="">+ Seguir un equipo</option>
              {todosLosEquipos.filter(n => !equipos.includes(n)).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </div>

      {resto.length > 0 && <p className="g-subrotulo">Más deportes</p>}
      {resto.map(a => <PiezaSecundaria key={a.id} art={a} omitirTags={['deporte']} />)}
    </>
  );
}

// ── Ciencia y filosofía ──────────────────────────────────────────────────────

/** Pregunta para pensar: la primera oración interrogativa del texto, si la hay. */
function preguntaDe(a: ArticuloEdicion): string | undefined {
  if (a.titulo.includes('?')) return undefined;
  return a.bajada.match(/¿[^?]{8,160}\?/)?.[0];
}

export function PaginaCiencia({ sel, idTitulo }: { sel: Seleccion; idTitulo: string }) {
  const { ciencia, filosofia } = sel.ciencia;
  return (
    <>
      <TituloSeccion titulo="Ciencia y filosofía" idTitulo={idTitulo} />
      {ciencia && (
        <article className="g-pieza" style={{ borderBottom: 0 }}>
          <Kicker>Ciencia</Kicker>
          <h3 className="g-titular g-titular-principal">{ciencia.titulo}<Idioma art={ciencia} /></h3>
          {ciencia.bajada && <p className="g-bajada"><Resaltado texto={ciencia.bajada} /></p>}
          <Foto key={ciencia.id} art={ciencia} className="g-foto-ancha" pie />
          <LinkFuente art={ciencia} />
          <Acciones art={ciencia} />
        </article>
      )}
      {ciencia && filosofia && <hr className="g-regla" />}
      {filosofia && (
        <article className="g-pieza">
          <Kicker>Filosofía · Una idea para pensar</Kicker>
          <h3 className="g-titular g-titular-principal">{filosofia.titulo}<Idioma art={filosofia} /></h3>
          {filosofia.bajada && <p className="g-bajada" style={{ fontFamily: 'var(--serif)' }}><Resaltado texto={filosofia.bajada} /></p>}
          {preguntaDe(filosofia) && <p className="g-bajada" style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{preguntaDe(filosofia)}</p>}
          <LinkFuente art={filosofia} texto="Leer el ensayo completo" />
          <Acciones art={filosofia} />
        </article>
      )}
    </>
  );
}

// ── Cultura e intereses ──────────────────────────────────────────────────────

export function PaginaCultura({ sel, idTitulo }: { sel: Seleccion; idTitulo: string }) {
  const [principal, ...resto] = sel.cultura.piezas;
  const desc = sel.cultura.descubrimiento;
  return (
    <>
      <TituloSeccion titulo="Cultura e intereses" subtitulo="Seleccionado según tus preferencias" idTitulo={idTitulo} />
      {principal && <PiezaPrincipal art={principal} />}
      {resto.map(a => <PiezaSecundaria key={a.id} art={a} />)}
      {desc && <PiezaSecundaria key={desc.id} art={desc} etiquetaKicker="Descubrimiento" descubrimiento />}
    </>
  );
}

// ── Contratapa ───────────────────────────────────────────────────────────────

export function PaginaContratapa({ sel, edicion, totalPaginas, visitadas, onTerminar, idTitulo }: {
  sel: Seleccion; edicion: EdicionDiaria; totalPaginas: number; visitadas: number;
  onTerminar: (fecha: string) => void; idTitulo: string;
}) {
  const { prefs } = useDiario();
  const { columna, paraGuardar } = sel.contratapa;
  const terminada = prefs.edicionTerminada === edicion.fecha;
  const minutos = paraGuardar ? minutosLectura(paraGuardar) : undefined;
  const [parrafosVisibles, setParrafosVisibles] = useState(4);
  return (
    <>
      <h2 className="g-rotulo" id={idTitulo} tabIndex={-1} style={{ marginTop: 18 }}>Contratapa</h2>
      {columna && (
        <article className="g-pieza">
          <h3 className="g-titular g-titular-principal">{columna.titulo}</h3>
          <p className="g-meta">Columna editorial · {columna.fuente}</p>
          <div className="g-columna">
            {(columna.texto ?? [columna.bajada]).slice(0, parrafosVisibles).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {(columna.texto?.length ?? 0) > parrafosVisibles && (
            <button type="button" className="g-porque-btn" onClick={() => setParrafosVisibles(n => n + 50)}>Seguir leyendo la columna</button>
          )}
          <Acciones art={columna} />
        </article>
      )}

      {paraGuardar && (
        <>
          <p className="g-rotulo">Para guardar</p>
          <article className="g-pieza">
            <div className="g-secundaria" style={{ gridTemplateColumns: '48% 1fr' }}>
              <Foto key={paraGuardar.id} art={paraGuardar} className="" />
              <div>
                <h3 className="g-titular g-titular-secundario">{paraGuardar.titulo}<Idioma art={paraGuardar} /></h3>
                <p className="g-meta">{minutos ? `Ensayo · ${minutos} min` : 'Lectura breve'} · {paraGuardar.fuente}</p>
                {paraGuardar.bajada && <p className="g-bajada" style={{ fontSize: 16 }}>{paraGuardar.bajada}</p>}
                <LinkFuente art={paraGuardar} />
                <Acciones art={paraGuardar} soloGuardar />
              </div>
            </div>
          </article>
        </>
      )}

      <div className="g-fin">
        <div className="g-ornamento" aria-hidden="true">✦</div>
        <p className="g-fin-titulo">Fin de la edición</p>
        <p className="g-fin-meta">
          {visitadas >= totalPaginas ? `${totalPaginas} páginas · Lectura completada` : `Leíste ${visitadas} de ${totalPaginas} páginas`}
        </p>
      </div>
      <button type="button" className="g-boton" disabled={terminada} onClick={() => onTerminar(edicion.fecha)}>
        {terminada ? 'Edición terminada ✓' : 'Terminar edición'}
      </button>
      <p className="g-nota-final">Tus valoraciones orientan la próxima selección.</p>
    </>
  );
}

// ── Guardados ────────────────────────────────────────────────────────────────

export function VistaGuardados({ idTitulo }: { idTitulo: string }) {
  const { prefs, onGuardar } = useDiario();
  const guardados = Object.values(prefs.guardados ?? {}).sort((a, b) => b.guardadoEn.localeCompare(a.guardadoEn));
  return (
    <>
      <TituloSeccion titulo="Guardados" subtitulo={`${guardados.length} ${guardados.length === 1 ? 'nota guardada' : 'notas guardadas'}`} idTitulo={idTitulo} />
      {guardados.length === 0 && <Vacio>Todavía no guardaste notas. Tocá "Guardar" en cualquier pieza.</Vacio>}
      {guardados.map(g => (
        <article key={g.id} className="g-pieza">
          <div className="g-secundaria">
            <Foto key={g.id} art={g} className="" />
            <div>
              <p className="g-meta">{g.fuente} · {new Date(g.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</p>
              <h3 className="g-titular g-titular-breve">{g.titulo}</h3>
              {g.bajada && <p className="g-bajada" style={{ fontSize: 15 }}>{g.bajada}</p>}
              {g.url && <a className="g-link" href={g.url} target="_blank" rel="noopener noreferrer">Leer en {g.fuente} ↗</a>}
              <div className="g-acciones">
                <button type="button" className="g-accion" aria-label={`Quitar de guardados: ${g.titulo}`} onClick={() => onGuardar(g)}><X size={18} aria-hidden="true" /> <span>Quitar</span></button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </>
  );
}
