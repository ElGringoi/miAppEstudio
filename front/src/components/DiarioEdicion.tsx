// Diario "La Gaceta": edición diaria por páginas, con noticias en vivo
// (api/edicion.ts) personalizadas según tus valoraciones.

import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, House, Menu, X } from 'lucide-react';
import type {
  ArticuloEdicion, ArticuloGuardado, DeporteId, DiarioReaction, EdicionDiaria,
  FSDiarioPrefs, FSEntradaDiario, FSEvento, FSHabito, FSMision, FSTarea,
} from '../types';
import { armarSeleccion, numeroEdicion, terminosFavoritos } from '../utils/edicion';
// "Tu día" usa el mismo HOY con el que la app guarda eventos, tareas y notas.
import { HOY } from '../utils/constants';
import { CSS_GACETA, NOMBRE_DIARIO } from './diario/estilos';
import { DiarioContexto, type DiarioAcciones } from './diario/contexto';
import {
  PaginaArgentina, PaginaCiencia, PaginaContratapa, PaginaCultura, PaginaDeportes, PaginaDia,
  PaginaMundo, PaginaPortada, VistaGuardados, type PaginaInfo,
} from './diario/Paginas';

interface Props {
  edicion:         EdicionDiaria | null;
  fsHabitos:       FSHabito[];
  fsEventos:       FSEvento[];
  fsTareas:        FSTarea[];
  fsMisiones:      FSMision[];
  fsEntradas:      FSEntradaDiario[];
  diarioPrefs:     FSDiarioPrefs;
  visitadas:       string[];
  onVisitar:       (pagina: string) => void;
  onReact:         (artId: string, reaction: DiarioReaction, tags: string[]) => void;
  onGuardar:       (art: ArticuloEdicion | ArticuloGuardado) => void;
  onPrefsDeportes: (deportes: DeporteId[], equipos: string[]) => void;
  onTerminar:      (fecha: string) => void;
}

const ID_TITULO = 'gaceta-titulo-pagina';

function fechaCabecera(fecha: string): string {
  const f = new Date(fecha + 'T12:00:00');
  const mes = f.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase();
  return `${f.getDate()} ${mes} ${f.getFullYear()}`;
}

export function DiarioEdicion(props: Props) {
  const { diarioPrefs, visitadas, onVisitar } = props;

  // La edición queda fija desde que empezás a navegar: si llega una más nueva
  // mientras leés, se usa en la próxima apertura (no te saca de la página).
  const [navego, setNavego] = useState(false);
  const [edicion, setEdicion] = useState(props.edicion);
  if (props.edicion && props.edicion !== edicion && (!edicion || !navego || edicion.origen !== 'red')) {
    setEdicion(props.edicion);
  }

  // La selección se fija al abrir la edición: valorar una nota no la saca de
  // su lugar mientras leés. Las valoraciones pesan en la próxima carga.
  const [prefsBase] = useState(diarioPrefs);
  const seleccion = useMemo(() => (edicion ? armarSeleccion(edicion, prefsBase) : null), [edicion, prefsBase]);

  const paginas: PaginaInfo[] = useMemo(() => {
    if (!seleccion || !edicion) return [];
    const s = seleccion;
    const hayDeportes = s.deportes.piezas.length > 0 || edicion.deportes.resultados.length > 0 || edicion.deportes.proximos.length > 0;
    return [
      { key: 'portada',    nombre: 'Portada' },
      { key: 'dia',        nombre: 'Tu día y trabajo' },
      ...(s.argentina.piezas.length ? [{ key: 'argentina', nombre: 'Argentina' }] : []),
      ...(s.mundo.piezas.length ? [{ key: 'mundo', nombre: 'Mundo y tecnología' }] : []),
      ...(hayDeportes ? [{ key: 'deportes', nombre: 'Deportes' }] : []),
      ...(s.ciencia.ciencia || s.ciencia.filosofia ? [{ key: 'ciencia', nombre: 'Ciencia y filosofía' }] : []),
      ...(s.cultura.piezas.length ? [{ key: 'cultura', nombre: 'Cultura e intereses' }] : []),
      { key: 'contratapa', nombre: 'Contratapa' },
    ];
  }, [seleccion, edicion]);

  const [actual, setActual] = useState('portada');
  const [indiceAbierto, setIndiceAbierto] = useState(false);
  const [verGuardados, setVerGuardados] = useState(false);
  const idx = Math.max(0, paginas.findIndex(p => p.key === actual));
  const pagina = paginas[idx];

  const raizRef = useRef<HTMLDivElement>(null);
  const navegoRef = useRef(false);
  const toqueRef = useRef<{ x: number; y: number } | null>(null);

  const irA = (key: string) => {
    navegoRef.current = true;
    setNavego(true);
    setVerGuardados(false);
    setIndiceAbierto(false);
    setActual(key);
  };
  const mover = (delta: number) => {
    const destino = paginas[idx + delta];
    if (destino) irA(destino.key);
  };

  const claveActual = pagina?.key;

  // Registrar la página como leída.
  useEffect(() => {
    if (claveActual) onVisitar(claveActual);
  }, [claveActual, onVisitar]);

  // Al navegar (no al montar ni al valorar), volver arriba y enfocar el título.
  useEffect(() => {
    if (!navegoRef.current) return;
    raizRef.current?.scrollIntoView({ block: 'start' });
    document.getElementById(ID_TITULO)?.focus({ preventScroll: true });
  }, [claveActual, verGuardados]);

  // ← / → para pasar de página (sin interferir con campos de texto).
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || verGuardados) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      if (e.key === 'ArrowRight') mover(1);
      if (e.key === 'ArrowLeft') mover(-1);
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  });

  // Deslizar para pasar de página (salvo sobre la tabla de resultados).
  const alTocar = (e: TouchEvent) => {
    const t = e.touches[0];
    const enTabla = (e.target as HTMLElement).closest('[data-sin-swipe]');
    toqueRef.current = enTabla ? null : { x: t.clientX, y: t.clientY };
  };
  const alSoltar = (e: TouchEvent) => {
    const ini = toqueRef.current;
    toqueRef.current = null;
    if (!ini || verGuardados) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - ini.x;
    const dy = t.clientY - ini.y;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 50) mover(dx < 0 ? 1 : -1);
  };

  const acciones: DiarioAcciones = useMemo(() => ({
    prefs:     diarioPrefs,
    terminos:  terminosFavoritos(diarioPrefs),
    onReact:   props.onReact,
    onGuardar: props.onGuardar,
  }), [diarioPrefs, props.onReact, props.onGuardar]);

  const cantidadGuardados = Object.keys(diarioPrefs.guardados ?? {}).length;
  const ultima = idx === paginas.length - 1;
  const leidas = paginas.filter(p => visitadas.includes(p.key)).length;

  const renderPagina = () => {
    if (!seleccion || !edicion || !pagina) return null;
    switch (pagina.key) {
      case 'portada':    return <PaginaPortada sel={seleccion} paginas={paginas} onIr={irA} idTitulo={ID_TITULO} />;
      case 'dia':        return <PaginaDia fsHabitos={props.fsHabitos} fsEventos={props.fsEventos} fsTareas={props.fsTareas} fsMisiones={props.fsMisiones} fsEntradas={props.fsEntradas} hoy={HOY} idTitulo={ID_TITULO} />;
      case 'argentina':  return <PaginaArgentina sel={seleccion} idTitulo={ID_TITULO} />;
      case 'mundo':      return <PaginaMundo sel={seleccion} idTitulo={ID_TITULO} />;
      case 'deportes':   return <PaginaDeportes sel={seleccion} edicion={edicion} onPrefsDeportes={props.onPrefsDeportes} idTitulo={ID_TITULO} />;
      case 'ciencia':    return <PaginaCiencia sel={seleccion} idTitulo={ID_TITULO} />;
      case 'cultura':    return <PaginaCultura sel={seleccion} idTitulo={ID_TITULO} />;
      default:           return <PaginaContratapa sel={seleccion} edicion={edicion} totalPaginas={paginas.length} visitadas={leidas} onTerminar={props.onTerminar} idTitulo={ID_TITULO} />;
    }
  };

  return (
    <DiarioContexto.Provider value={acciones}>
      <style>{CSS_GACETA}</style>
      <div className="gaceta" ref={raizRef} onTouchStart={alTocar} onTouchEnd={alSoltar}>
        <div className="g-hoja">
          <header className="g-cabecera">
            <div className="g-marca">
              <h1 className="g-nombre">{NOMBRE_DIARIO}</h1>
              {edicion && (
                <p className="g-fecha" style={{ margin: 0 }}>
                  {fechaCabecera(edicion.fecha)}<br />Edición N° {numeroEdicion(edicion.fecha)}
                </p>
              )}
            </div>
            <button type="button" className="g-indice-btn" aria-expanded={indiceAbierto} aria-controls="gaceta-indice"
              onClick={() => setIndiceAbierto(v => !v)}>
              {indiceAbierto ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />} Índice
            </button>
          </header>

          {indiceAbierto && (
            <nav className="g-indice" id="gaceta-indice" aria-label="Índice de la edición">
              <ol>
                {paginas.map((p, i) => (
                  <li key={p.key}>
                    <button type="button" aria-current={!verGuardados && p.key === pagina?.key ? 'page' : undefined} onClick={() => irA(p.key)}>
                      <span className="g-num">{i + 1}</span> {p.nombre}
                      {visitadas.includes(p.key) && <span className="g-meta" style={{ margin: '0 0 0 auto' }}>leída</span>}
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" aria-current={verGuardados ? 'page' : undefined}
                    onClick={() => { navegoRef.current = true; setNavego(true); setIndiceAbierto(false); setVerGuardados(true); }}>
                    <Bookmark size={18} aria-hidden="true" className="g-num" /> Guardados ({cantidadGuardados})
                  </button>
                </li>
              </ol>
            </nav>
          )}

          {edicion?.origen === 'respaldo' && (
            <p className="g-aviso" role="status">Sin conexión: edición de respaldo con ensayos del archivo.</p>
          )}

          <main aria-labelledby={ID_TITULO}>
            {!edicion && (
              <div role="status" aria-live="polite">
                <p className="g-seccion" style={{ fontSize: 'clamp(26px, 6vw, 40px)' }}>Cargando la edición…</p>
                <div className="g-esqueleto" style={{ aspectRatio: '16/9', marginBottom: 14 }} />
                <div className="g-esqueleto" style={{ height: 34, width: '85%', marginBottom: 10 }} />
                <div className="g-esqueleto" style={{ height: 18, width: '70%' }} />
              </div>
            )}
            {edicion && (verGuardados ? <VistaGuardados idTitulo={ID_TITULO} /> : renderPagina())}
          </main>

          {edicion && !verGuardados && pagina && (
            <nav className="g-nav" aria-label="Páginas">
              <button type="button" onClick={() => mover(-1)} disabled={idx === 0}>
                <ChevronLeft size={24} aria-hidden="true" /> Anterior
              </button>
              <span className="g-nav-num" aria-live="polite">{idx + 1} de {paginas.length}</span>
              {ultima
                ? <button type="button" className="g-nav-sig" onClick={() => irA('portada')}><House size={22} aria-hidden="true" /> Volver a portada</button>
                : <button type="button" className="g-nav-sig" onClick={() => mover(1)}>Siguiente <ChevronRight size={24} aria-hidden="true" /></button>}
            </nav>
          )}
          {verGuardados && (
            <nav className="g-nav" aria-label="Volver">
              <button type="button" onClick={() => irA(pagina?.key ?? 'portada')}><ChevronLeft size={24} aria-hidden="true" /> Volver a la edición</button>
            </nav>
          )}
        </div>
      </div>
    </DiarioContexto.Provider>
  );
}
