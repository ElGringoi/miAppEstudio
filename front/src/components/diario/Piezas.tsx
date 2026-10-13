// Piezas del Diario: foto, acciones, pieza principal y secundaria.

import { useState, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, Bookmark, BookmarkCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { ArticuloEdicion } from '../../types';
import { arteDeArticulo } from '../../utils/diarioArte';
import { kicker, porQueVeoEsto } from '../../utils/edicion';
import { useDiario } from './contexto';

// ── Imagen: foto del medio o, si falta o no carga, ilustración generada ─────

// Lo mínimo para mostrar una imagen: sirve para notas de la edición y guardadas.
type ConImagen = Pick<ArticuloEdicion, 'id' | 'imagen' | 'fuente'> & { seccion?: ArticuloEdicion['seccion'] };

function Ilustracion({ art, className }: { art: ConImagen; className: string }) {
  const arte = arteDeArticulo(art.id, art.seccion === 'deportes' ? 'deporte' : art.seccion === 'cultura' ? 'entretenimiento' : undefined);
  return (
    <svg viewBox={`0 0 ${arte.ancho} ${arte.alto}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <rect width={arte.ancho} height={arte.alto} fill={arte.fondo} />
      {arte.formas.map((f, i) => {
        if (f.tipo === 'circulo') return <circle key={i} cx={f.x} cy={f.y} r={f.r} fill={f.color} opacity={f.opacidad} />;
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

/** Usar con key={art.id}: así el estado de error no pasa de una nota a otra. */
export function Foto({ art, className, pie = false }: { art: ConImagen; className: string; pie?: boolean }) {
  const [fallo, setFallo] = useState(false);
  const usarArte = !art.imagen || fallo;
  return (
    <figure className="g-figura">
      {usarArte
        ? <Ilustracion art={art} className={`g-foto ${className}`} />
        : (
          // El titular está al lado: la foto es decorativa para lectores de pantalla.
          <img src={art.imagen} alt="" loading="lazy" referrerPolicy="no-referrer" decoding="async"
            className={`g-foto ${className}`} onError={() => setFallo(true)} />
        )}
      {pie && <figcaption className="g-pie-foto">{usarArte ? 'Imagen ilustrativa' : `Imagen: ${art.fuente}`}</figcaption>}
    </figure>
  );
}

// ── Texto ────────────────────────────────────────────────────────────────────

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Resalta en negrita (hasta 2 veces) los temas que te interesan. */
export function Resaltado({ texto }: { texto: string }) {
  const { terminos } = useDiario();
  if (!terminos.length || !texto) return <>{texto}</>;
  const patron = new RegExp(`(?<![\\p{L}\\p{N}])(${terminos.map(escapar).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  const partes = texto.split(patron);
  let resaltados = 0;
  return (
    <>
      {partes.map((p, i) => {
        const esTermino = i % 2 === 1;
        if (esTermino && resaltados < 2) {
          resaltados++;
          return <strong key={i}>{p}</strong>;
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="g-kicker">{children}</p>;
}

export function Idioma({ art }: { art: ArticuloEdicion }) {
  return art.idioma === 'en' ? <span className="g-idioma" title="Nota en inglés">EN</span> : null;
}

export function LinkFuente({ art, texto }: { art: ArticuloEdicion; texto?: string }) {
  if (!art.url) return null;
  return (
    <a className="g-link" href={art.url} target="_blank" rel="noopener noreferrer">
      {texto ?? `Leer en ${art.fuente}`} <ArrowUpRight size={15} aria-hidden="true" />
    </a>
  );
}

// ── Acciones ─────────────────────────────────────────────────────────────────

export function Acciones({ art, compactas = false, soloGuardar = false }: { art: ArticuloEdicion; compactas?: boolean; soloGuardar?: boolean }) {
  const { prefs, onReact, onGuardar } = useDiario();
  const reaccion = prefs.reactions[art.id];
  const guardado = Boolean(prefs.guardados?.[art.id]);
  const IconoGuardar = guardado ? BookmarkCheck : Bookmark;
  const botonGuardar = (
    <button type="button" className="g-accion" aria-pressed={guardado} onClick={() => onGuardar(art)}>
      <IconoGuardar size={20} aria-hidden="true" /> <span>{guardado ? 'Guardado' : 'Guardar'}</span>
    </button>
  );
  if (soloGuardar) return <div className="g-acciones">{botonGuardar}</div>;
  return (
    <div className={`g-acciones${compactas ? ' g-acciones-compactas' : ''}`} role="group" aria-label={`Valorar: ${art.titulo}`}>
      <button type="button" className="g-accion" aria-pressed={reaccion === 'like'} onClick={() => onReact(art.id, 'like', art.tags)}>
        <ThumbsUp size={20} aria-hidden="true" /> <span>Me interesa</span>
      </button>
      <button type="button" className="g-accion" aria-pressed={reaccion === 'dislike'} onClick={() => onReact(art.id, 'dislike', art.tags)}>
        <ThumbsDown size={20} aria-hidden="true" /> <span>Menos</span>
      </button>
      {botonGuardar}
    </div>
  );
}

// ── Piezas ───────────────────────────────────────────────────────────────────

interface PiezaProps {
  art:             ArticuloEdicion;
  etiquetaKicker?: string;     // reemplaza al kicker por tags (por ejemplo "DESCUBRIMIENTO")
  omitirTags?:     string[];
  descubrimiento?: boolean;
}

export function PiezaPrincipal({ art, etiquetaKicker, omitirTags }: PiezaProps) {
  return (
    <article className="g-pieza">
      <Foto key={art.id} art={art} className="g-foto-principal" />
      <Kicker>{etiquetaKicker ?? kicker(art, omitirTags)}</Kicker>
      <h3 className="g-titular g-titular-principal">{art.titulo}<Idioma art={art} /></h3>
      {art.bajada && <p className="g-bajada"><Resaltado texto={art.bajada} /></p>}
      <LinkFuente art={art} />
      <Acciones art={art} />
    </article>
  );
}

export function PiezaSecundaria({ art, etiquetaKicker, omitirTags, descubrimiento = false }: PiezaProps) {
  const { prefs } = useDiario();
  const [abierto, setAbierto] = useState(false);
  const idPorque = `porque-${art.id}`;
  return (
    <article className="g-pieza">
      <div className="g-secundaria">
        <Foto key={art.id} art={art} className="" />
        <div>
          <Kicker>{etiquetaKicker ?? kicker(art, omitirTags)}</Kicker>
          <h3 className="g-titular g-titular-secundario">{art.titulo}<Idioma art={art} /></h3>
          {art.bajada && <p className="g-bajada"><Resaltado texto={art.bajada} /></p>}
          <button type="button" className="g-porque-btn" aria-expanded={abierto} aria-controls={idPorque} onClick={() => setAbierto(v => !v)}>
            ¿Por qué veo esto? <ArrowRight size={16} aria-hidden="true" />
          </button>
          {abierto && (
            <div id={idPorque}>
              <p className="g-porque">{porQueVeoEsto(art, prefs, descubrimiento)}</p>
              <LinkFuente art={art} />
            </div>
          )}
        </div>
      </div>
      <Acciones art={art} compactas />
    </article>
  );
}

export function TituloSeccion({ titulo, subtitulo, idTitulo }: { titulo: string; subtitulo?: string; idTitulo: string }) {
  return (
    <header>
      <h2 className="g-seccion" id={idTitulo} tabIndex={-1}>{titulo}</h2>
      {subtitulo && <p className="g-subtitulo">{subtitulo}</p>}
      <hr className="g-seccion-regla" />
    </header>
  );
}

export function Vacio({ children }: { children: ReactNode }) {
  return <p className="g-vacio">{children}</p>;
}
