import React, { useState } from 'react';
import type { Stat, Habit, FSRutina, FSLibro } from '../types';
import type { FSDiarioPrefs, DiarioReaction } from '../types';
import { HOY } from '../utils/constants';
import { ARTICULOS, scoreArticulos } from '../utils/diarioSeed';

const INK       = '#211d16';
const INK_SOFT  = '#4a4438';
const PAPER     = '#efe8d8';
const PAPER_ALT = '#e6ddc8';
const RED       = '#9c2b1f';
const BLUE      = '#2a4258';
const GOLD      = '#a5793a';
const GREEN     = '#2a5e3a';
const RULE      = '#c9bfa4';
const SERIF     = "Georgia, 'Times New Roman', serif";
const MONO      = "'Courier New', Courier, monospace";

interface Props {
  stats:        Stat[];
  habits:       Habit[];
  fsRutinas:    FSRutina[];
  fsLibros:     FSLibro[];
  userName:     string;
  diarioPrefs:  FSDiarioPrefs;
  onReact:      (artId: string, reaction: DiarioReaction, tags: string[]) => void;
}

function DropCapPara({ text, style }: { text: string; style: React.CSSProperties }) {
  return (
    <p style={style}>
      <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '48px', float: 'left', lineHeight: 0.8, padding: '4px 6px 0 0', color: RED }}>
        {text.charAt(0)}
      </span>
      {text.slice(1)}
    </p>
  );
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', margin: '32px 0 16px' }}>
      <h2 style={{
        fontFamily: SERIF, fontWeight: 700, fontSize: '22px',
        textTransform: 'uppercase', letterSpacing: '0.03em',
        margin: 0, whiteSpace: 'nowrap', color,
      }}>
        {label}
      </h2>
      <div style={{ flex: 1, height: '1px', background: INK }} />
    </div>
  );
}

export function DiarioView({ stats, habits, fsRutinas, fsLibros, userName, diarioPrefs, onReact }: Props) {
  const todayDow      = new Date().getDay();
  const rutinaHoy     = fsRutinas.find(r => (r.diasSemana ?? []).includes(todayDow));
  const habitsHoy     = habits.filter(h => h.activeToday);
  const habitsDone    = habitsHoy.filter(h => h.completed).length;
  const librosLeyendo = fsLibros.filter(l => l.estado === 'leyendo');
  const totalLevel    = stats.reduce((s, st) => s + st.level, 0);

  const fechaObj  = new Date(HOY + 'T12:00:00');
  const fechaLarga = fechaObj.toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const fechaCap = fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1);

  const epoch   = new Date('2024-01-01').getTime();
  const edicion = Math.floor((fechaObj.getTime() - epoch) / 86400000);

  const hora   = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';

  const articulosOrdenados = scoreArticulos(ARTICULOS, diarioPrefs.tagScores, diarioPrefs.reactions);
  const leadArticulo       = articulosOrdenados[0];
  const lecturas           = articulosOrdenados.slice(1, 7);

  const [expanded, setExpanded] = useState<string | null>(null);

  const sh: React.CSSProperties = {
    background: PAPER,
    backgroundImage: 'radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)',
    backgroundSize: '3px 3px',
    padding: '28px 36px 64px',
    minHeight: '100vh',
    color: INK,
  };

  const bodyText: React.CSSProperties = {
    fontSize: '14.5px', lineHeight: 1.65, margin: '0 0 12px', fontFamily: SERIF,
  };

  const briefH4: React.CSSProperties = {
    fontFamily: SERIF, fontWeight: 600, fontSize: '16px', lineHeight: 1.2, margin: '0 0 6px',
  };

  const briefP: React.CSSProperties = {
    fontSize: '13px', lineHeight: 1.55, color: INK_SOFT, margin: 0, fontFamily: SERIF,
  };

  const tag: React.CSSProperties = {
    fontFamily: MONO, fontSize: '9.5px', letterSpacing: '0.08em', textTransform: 'uppercase',
    color: INK_SOFT, opacity: 0.7, display: 'block', marginTop: '6px',
  };

  const brief: React.CSSProperties = {
    breakInside: 'avoid', marginBottom: '20px', paddingBottom: '16px',
    borderBottom: `1px solid ${RULE}`,
  };

  const statBox: React.CSSProperties = {
    marginTop: '12px', padding: '12px 16px', background: PAPER_ALT, border: `1px solid ${RULE}`,
  };

  function ReactionBtn({ artId, artTags, reaction }: { artId: string; artTags: string[]; reaction: DiarioReaction }) {
    const current = diarioPrefs.reactions[artId];
    const isActive = current === reaction;
    const baseStyle: React.CSSProperties = {
      fontFamily: MONO, fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '5px 10px', border: `1px solid ${RULE}`, cursor: 'pointer',
      background: isActive ? (reaction === 'like' ? GREEN : RED) : 'transparent',
      color: isActive ? PAPER : INK_SOFT,
      transition: 'all 0.15s',
      userSelect: 'none',
    };
    return (
      <button
        style={baseStyle}
        onClick={() => onReact(artId, reaction, artTags)}
        title={reaction === 'like' ? 'Me interesa' : 'No me interesa'}
      >
        {reaction === 'like' ? '▲ útil' : '▼ pasar'}
      </button>
    );
  }

  function ArticleCard({ art, isLead }: { art: typeof ARTICULOS[0]; isLead?: boolean }) {
    const isExpanded = expanded === art.id || isLead;
    const paragraphs = art.contenido.split('\n\n');
    const reaction   = diarioPrefs.reactions[art.id];

    return (
      <div style={{ ...brief, opacity: reaction === 'dislike' ? 0.55 : 1 }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {art.tags.map(t => (
            <span key={t} style={{
              fontFamily: MONO, fontSize: '8.5px', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: BLUE, border: `1px solid ${BLUE}`, padding: '2px 6px', opacity: 0.75,
            }}>{t}</span>
          ))}
        </div>
        <h4
          style={{ ...briefH4, fontSize: isLead ? '22px' : '16px', cursor: 'pointer', marginBottom: '8px' }}
          onClick={() => setExpanded(expanded === art.id ? null : art.id)}
        >
          {art.titulo}
        </h4>

        {isExpanded ? (
          <>
            {isLead ? (
              <>
                <DropCapPara text={paragraphs[0]} style={bodyText} />
                {paragraphs.slice(1).map((p, i) => (
                  <p key={i} style={bodyText}>{p}</p>
                ))}
              </>
            ) : (
              paragraphs.map((p, i) => (
                <p key={i} style={briefP}>{p}</p>
              ))
            )}
            {art.fuente && (
              <span style={{ ...tag, marginTop: '10px' }}>Fuente: {art.fuente}</span>
            )}
          </>
        ) : (
          <p style={{ ...briefP, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {paragraphs[0]}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
          <ReactionBtn artId={art.id} artTags={art.tags} reaction="like" />
          <ReactionBtn artId={art.id} artTags={art.tags} reaction="dislike" />
          {!isLead && (
            <button
              style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'none', border: 'none', color: INK_SOFT, cursor: 'pointer', padding: '5px 0' }}
              onClick={() => setExpanded(expanded === art.id ? null : art.id)}
            >
              {expanded === art.id ? '▲ cerrar' : '▼ leer más'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={sh}>

      {/* ── MASTHEAD ── */}
      <div style={{ textAlign: 'center', borderBottom: `4px double ${INK}`, paddingBottom: '14px', marginBottom: '10px' }}>
        <div style={{ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_SOFT, marginBottom: '6px' }}>
          Filosofía · IA · Ciencia · Historia · Psicología · Economía
        </div>
        <h1 style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 'clamp(28px, 5.5vw, 72px)', letterSpacing: '-0.01em', margin: 0, lineHeight: 1 }}>
          {saludo}, {userName}
        </h1>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '14px', color: INK_SOFT, marginTop: '8px' }}>
          "El conocimiento es el único recurso que crece al compartirse"
        </div>
      </div>

      {/* ── META ROW ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: MONO, fontSize: '10.5px', letterSpacing: '0.05em', textTransform: 'uppercase',
        color: INK_SOFT, padding: '8px 0 16px', borderBottom: `1.5px solid ${INK}`, marginBottom: '22px',
      }}>
        <span>{fechaCap}</span>
        <span>Edición N.º {edicion}</span>
        <span>@{userName} · Level {totalLevel}</span>
      </div>

      {/* ── LEAD — IDEA DEL DÍA ── */}
      {leadArticulo && (
        <>
          <div style={{ marginBottom: '6px' }}>
            <span style={{
              fontFamily: MONO, fontSize: '10.5px', letterSpacing: '0.12em', textTransform: 'uppercase',
              color: RED, fontWeight: 700, display: 'inline-block',
            }}>
              Idea del día
            </span>
          </div>
          <ArticleCard art={leadArticulo} isLead />
        </>
      )}

      {/* ── COLUMNAS — GYM / BIBLIOTECA ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', paddingBottom: '26px', borderBottom: `1px solid ${RULE}`, marginBottom: '26px' }}>
        <div>
          <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: '18px', margin: '0 0 12px', color: INK }}>{rutinaHoy ? rutinaHoy.nombre : 'Descanso'}</h3>
          {rutinaHoy ? (
            <div style={statBox}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '32px', color: BLUE, lineHeight: 1 }}>
                {(rutinaHoy.ejercicios ?? []).filter(e => e.lastCompletedDate === HOY).length}/
                {(rutinaHoy.ejercicios ?? []).length}
              </div>
              <div style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', color: INK_SOFT, marginTop: '6px' }}>
                Ejercicios completados · Gym
              </div>
            </div>
          ) : (
            <p style={{ ...briefP, fontStyle: 'italic' }}>Sin rutina asignada para hoy.</p>
          )}
          {habitsHoy.length > 0 && (
            <div style={{ ...statBox, marginTop: '12px' }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '32px', color: GOLD, lineHeight: 1 }}>
                {habitsDone}/{habitsHoy.length}
              </div>
              <div style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', color: INK_SOFT, marginTop: '6px' }}>
                Quests completadas hoy
              </div>
            </div>
          )}
        </div>
        {librosLeyendo.length > 0 && (
          <div style={{ borderLeft: `1px solid ${RULE}`, paddingLeft: '24px' }}>
            <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: '18px', margin: '0 0 12px', color: INK }}>En lectura</h3>
            {librosLeyendo.slice(0, 3).map(l => {
              const leidos = (l.capitulos ?? []).filter(c => c.leido).length;
              const total  = (l.capitulos ?? []).length;
              const pct    = total > 0 ? Math.round((leidos / total) * 100) : 0;
              return (
                <div key={l.id} style={{ marginBottom: '14px' }}>
                  <h4 style={briefH4}>{l.titulo}</h4>
                  <p style={briefP}>{l.autor && `${l.autor} · `}{pct}% completado</p>
                  <div style={{ height: '3px', background: RULE, marginTop: '6px', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: GOLD, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── LECTURAS DEL DÍA ── */}
      <SectionHeader label="Lecturas del día" color={BLUE} />
      <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '13px', color: INK_SOFT, margin: '-10px 0 18px' }}>
        Usá ▲ y ▼ para enseñarle qué te interesa. El orden se adapta con el tiempo.
      </p>
      <div style={{ columns: '2 320px', columnGap: '36px' }}>
        {lecturas.map(art => (
          <ArticleCard key={art.id} art={art} />
        ))}
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        marginTop: '40px', paddingTop: '16px', borderTop: `3px double ${INK}`,
        textAlign: 'center', fontFamily: MONO, fontSize: '10px',
        letterSpacing: '0.05em', color: INK_SOFT, textTransform: 'uppercase',
      }}>
        El Questflow — Edición personal · {userName}
        <div style={{ marginTop: '8px', fontSize: '9.5px', opacity: 0.7, textTransform: 'none', letterSpacing: '0.02em' }}>
          {Object.keys(diarioPrefs.reactions).length} artículos valorados · Sistema adaptativo · {fechaCap}
        </div>
      </footer>

    </div>
  );
}
