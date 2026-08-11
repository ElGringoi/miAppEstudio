import React, { useState, useCallback } from 'react';
import type { Stat, Habit, FSRutina, FSMision, FSLibro, FSEntradaDiario } from '../types';
import type { FSDiarioPrefs, DiarioReaction } from '../types';
import { HOY } from '../utils/constants';
import { ARTICULOS, scoreArticulos } from '../utils/diarioSeed';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG     = '#f4ebd8';
const BG_ALT = '#f0e7d3';
const INK    = '#1a1a1a';
const INK2   = '#4a4a4a';
const ACC    = '#8c3b3b';
const BORDER = '#d6cec2';
const SERIF  = "'Newsreader', Georgia, serif";
const SANS   = "'Work Sans', system-ui, sans-serif";

const RESPONSIVE_CSS = `
  .diario-root { padding: 0 40px 80px; }
  .diario-section { padding: 48px 0; }
  .diario-lead-grid {
    display: grid;
    grid-template-columns: minmax(0,7fr) minmax(220px,3fr);
    gap: 48px;
    margin-top: 32px;
  }
  .diario-diary-grid {
    display: grid;
    grid-template-columns: minmax(0,3fr) minmax(160px,1fr);
    gap: 32px;
    margin-top: 32px;
  }
  .diario-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .diario-reactions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .diario-drop-cap {
    float: left;
    font-size: 64px;
    line-height: 0.8;
    padding-right: 10px;
    padding-top: 6px;
  }
  .diario-articles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 32px;
    margin-top: 24px;
  }
  .diario-subtab-pills {
    display: flex;
    gap: 8px;
    margin: 18px 0 0;
    flex-wrap: wrap;
  }
  @media (max-width: 680px) {
    .diario-root { padding: 0 16px 60px !important; }
    .diario-section { padding: 28px 0 !important; }
    .diario-lead-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
    .diario-diary-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
    .diario-drop-cap { font-size: 46px !important; padding-right: 8px !important; }
    .diario-meta-row { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
    .diario-articles-grid { grid-template-columns: 1fr !important; }
  }
`;

interface Props {
  stats:       Stat[];
  habits:      Habit[];
  fsRutinas:   FSRutina[];
  fsMisiones:  FSMision[];
  fsLibros:    FSLibro[];
  fsEntradas:  FSEntradaDiario[];
  userName:    string;
  diarioPrefs: FSDiarioPrefs;
  onReact:     (artId: string, reaction: DiarioReaction, tags: string[]) => void;
}

// ── Reusable components ───────────────────────────────────────────────────────
function Hr({ thick }: { thick?: boolean }) {
  return (
    <div style={{ borderTop: thick ? `3px double ${INK}` : `1px solid ${INK}` }} />
  );
}

function SectionHead({ category, title, subtitle }: {
  category: string; title: string; subtitle?: string;
}) {
  return (
    <div style={{ margin: '0 0 8px' }}>
      <div style={{
        fontFamily: SANS, fontSize: '10px', letterSpacing: '0.18em',
        textTransform: 'uppercase', fontWeight: 700, color: ACC, marginBottom: '10px',
      }}>
        {category}
      </div>
      <h2 style={{
        fontFamily: SERIF, fontWeight: 800,
        fontSize: 'clamp(24px, 4vw, 48px)',
        lineHeight: 1.05, letterSpacing: '-0.01em',
        margin: '0 0 10px', color: INK,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontFamily: SERIF, fontStyle: 'italic',
          fontSize: 'clamp(13px, 2vw, 15px)', color: INK2, margin: 0,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function TagBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: SANS, fontSize: '10px', letterSpacing: '0.08em',
      textTransform: 'uppercase', fontWeight: 700,
      border: `1px solid ${INK}`, padding: '2px 8px',
    }}>
      {label}
    </span>
  );
}

/** TikTok/Instagram-style reaction buttons */
function ArticleReactions({ artId, tags, reactions, onReact, onDismiss }: {
  artId: string;
  tags: string[];
  reactions: Record<string, DiarioReaction>;
  onReact: (id: string, r: DiarioReaction, t: string[]) => void;
  onDismiss?: (id: string) => void;
}) {
  const liked = reactions[artId] === 'like';
  const [heartBeat, setHeartBeat] = useState(false);

  function handleLike() {
    if (!liked) {
      setHeartBeat(true);
      setTimeout(() => setHeartBeat(false), 500);
    }
    onReact(artId, 'like', tags);
  }

  function handleDislike() {
    onReact(artId, 'dislike', tags);
    onDismiss?.(artId);
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* ♥ Like */}
      <button
        onClick={handleLike}
        title="Me interesa"
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: SANS, fontSize: '11px', letterSpacing: '0.07em',
          textTransform: 'uppercase', fontWeight: 700,
          padding: '6px 14px', border: `1.5px solid ${liked ? '#c0392b' : BORDER}`,
          background: liked ? '#fef2f2' : 'transparent',
          color: liked ? '#c0392b' : INK2,
          cursor: 'pointer',
          transform: heartBeat ? 'scale(1.15)' : 'scale(1)',
          transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <span style={{ fontSize: '16px', lineHeight: 1 }}>
          {liked ? '♥' : '♡'}
        </span>
        {liked ? 'Guardado' : 'Me gusta'}
      </button>

      {/* ✕ No me interesa */}
      {onDismiss && (
        <button
          onClick={handleDislike}
          title="No me interesa"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: SANS, fontSize: '11px', letterSpacing: '0.07em',
            textTransform: 'uppercase', fontWeight: 700,
            padding: '6px 14px', border: `1.5px solid ${BORDER}`,
            background: 'transparent', color: INK2,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = ACC;
            (e.currentTarget as HTMLButtonElement).style.color = ACC;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER;
            (e.currentTarget as HTMLButtonElement).style.color = INK2;
          }}
        >
          <span style={{ fontSize: '14px', lineHeight: 1 }}>✕</span>
          No me interesa
        </button>
      )}
    </div>
  );
}

/** Lead article: solo ♥ like, sin dismiss */
function LeadReactions({ artId, tags, reactions, onReact }: {
  artId: string; tags: string[];
  reactions: Record<string, DiarioReaction>;
  onReact: (id: string, r: DiarioReaction, t: string[]) => void;
}) {
  return (
    <ArticleReactions
      artId={artId} tags={tags} reactions={reactions}
      onReact={onReact} onDismiss={undefined}
    />
  );
}

// ── ArticleCard — usado en secciones Deporte y Entretenimiento ───────────────
function ArticleCard({ art, reactions, onReact, dismiss, dismissedIds }: {
  art: import('../utils/diarioSeed').DiarioArticulo;
  reactions: Record<string, DiarioReaction>;
  onReact: (id: string, r: DiarioReaction, t: string[]) => void;
  dismiss: (id: string) => void;
  dismissedIds: Set<string>;
}) {
  const isDismissed = dismissedIds.has(art.id);
  const paragraphs  = art.contenido.split('\n\n');

  if (isDismissed) return (
    <div style={{
      border: `1px solid ${BORDER}`, padding: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: BG_ALT, gap: '12px',
    }}>
      <span style={{ fontFamily: SANS, fontSize: '12px', color: INK2 }}>
        ✕ Descartado
      </span>
    </div>
  );

  return (
    <article style={{ border: `1px solid ${BORDER}`, background: BG_ALT, padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {art.subseccion && (
        <div style={{
          fontFamily: SANS, fontSize: '10px', letterSpacing: '0.18em',
          textTransform: 'uppercase', fontWeight: 700, color: ACC,
        }}>
          {art.subseccion}
        </div>
      )}
      <h3 style={{
        fontFamily: SERIF, fontWeight: 800,
        fontSize: 'clamp(18px, 2.5vw, 24px)',
        lineHeight: 1.15, margin: 0, color: INK,
      }}>
        {art.titulo}
      </h3>
      <p style={{ fontFamily: SERIF, fontSize: '14px', lineHeight: 1.7, color: INK2, margin: 0 }}>
        {paragraphs[0]?.slice(0, 260)}{paragraphs[0] && paragraphs[0].length > 260 ? '…' : ''}
      </p>
      {art.fuente && (
        <p style={{ fontFamily: SANS, fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', color: INK2, margin: 0 }}>
          {art.fuente}
        </p>
      )}
      <div style={{ marginTop: '4px' }}>
        <ArticleReactions
          artId={art.id} tags={art.tags}
          reactions={reactions} onReact={onReact}
          onDismiss={dismiss}
        />
      </div>
    </article>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function DiarioView({
  stats, habits: _habits, fsRutinas: _fsRutinas, fsMisiones,
  fsLibros, fsEntradas, userName, diarioPrefs, onReact,
}: Props) {
  const [articulos] = useState(() =>
    scoreArticulos(ARTICULOS, diarioPrefs.tagScores, diarioPrefs.reactions)
  );

  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [deporteSub,  setDeporteSub]  = useState<string>('Todos');
  const [entSub,      setEntSub]      = useState<string>('Todos');

  const dismiss   = useCallback((id: string) => setDismissedIds(p => new Set([...p, id])), []);
  const undismiss = useCallback((id: string) => setDismissedIds(p => {
    const n = new Set(p); n.delete(id); return n;
  }), []);

  const deporteArticulos = ARTICULOS.filter(a => a.seccion === 'deporte');
  const entArticulos     = ARTICULOS.filter(a => a.seccion === 'entretenimiento');

  const DEPORTE_SUBS      = ['Todos', 'futbol', 'hockey', 'mma', 'jiujitsu', 'padel', 'tenis'];
  const ENT_SUBS          = ['Todos', 'anime', 'netflix', 'disney', 'crunchyroll', 'videojuegos', 'consolas'];

  const totalLevel    = stats.reduce((s, st) => s + st.level, 0);
  const librosLeyendo = fsLibros.filter(l => l.estado === 'leyendo');
  const pendingM      = fsMisiones.filter(m => !m.completada).slice(0, 5);

  const fechaObj   = new Date(HOY + 'T12:00:00');
  const fechaLarga = fechaObj.toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const fechaCap = fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1);
  const epoch    = new Date('2024-01-01').getTime();
  const edicion  = Math.floor((fechaObj.getTime() - epoch) / 86400000);
  const hora     = new Date().getHours();
  const saludo   = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';

  const leadArt  = articulos[0];
  const lecturas = articulos.slice(1, 9);

  const sectionBorder: React.CSSProperties = { borderBottom: `1px solid ${BORDER}` };

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>
      <div className="diario-root" style={{ background: BG, fontFamily: SANS, color: INK, minHeight: '100vh' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* ══ § 1  MASTHEAD ══ */}
          <header style={{
            textAlign: 'center', padding: 'clamp(24px,5vw,40px) 0 clamp(20px,4vw,32px)',
            borderBottom: `3px double ${INK}`,
          }}>
            <div style={{
              fontFamily: SANS, fontSize: '11px', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: INK2, fontWeight: 600,
              marginBottom: '20px', display: 'flex', gap: '10px',
              justifyContent: 'center', flexWrap: 'wrap',
            }}>
              {['FILOSOFÍA', 'IA', 'CIENCIA', 'DEPORTE', 'ENTRETENIMIENTO', 'HISTORIA', 'PSICOLOGÍA', 'ECONOMÍA'].map((c, i, a) => (
                <React.Fragment key={c}>
                  <span>{c}</span>
                  {i < a.length - 1 && <span style={{ opacity: 0.3 }}>·</span>}
                </React.Fragment>
              ))}
            </div>
            <div style={{
              fontFamily: SANS, fontSize: '10px', letterSpacing: '0.18em',
              textTransform: 'uppercase', color: ACC, fontWeight: 700, marginBottom: '12px',
            }}>
              Edición personal · El Questflow
            </div>
            <h1 style={{
              fontFamily: SERIF, fontWeight: 800,
              fontSize: 'clamp(36px, 7vw, 88px)',
              lineHeight: 0.95, letterSpacing: '-0.025em', margin: '0 0 20px',
            }}>
              {saludo},<br />{userName}
            </h1>
            <p style={{
              fontFamily: SERIF, fontStyle: 'italic',
              fontSize: 'clamp(14px, 2.5vw, 18px)', color: INK2, margin: '0 0 24px',
            }}>
              "El conocimiento es el único recurso que crece al compartirse"
            </p>
            <div
              className="diario-meta-row"
              style={{
                borderTop: `1px solid ${INK}`, paddingTop: '12px',
                fontFamily: SANS, fontSize: '10.5px', letterSpacing: '0.08em',
                textTransform: 'uppercase', fontWeight: 600, color: INK2,
              }}
            >
              <span>{fechaCap}</span>
              <span>Edición N.º {edicion}</span>
              <span>@{userName} · Level {totalLevel}</span>
            </div>
          </header>

          {/* ══ § 2  NOTICIA PRINCIPAL ══ */}
          <section className="diario-section" style={sectionBorder}>
            {/* Breaking news banner */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: ACC, color: BG,
              fontFamily: SANS, fontSize: '10px', fontWeight: 800,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              padding: '4px 14px', marginBottom: '14px',
            }}>
              ▶ EDICIÓN DEL DÍA
            </div>
            <SectionHead
              category="Noticia principal"
              title={leadArt?.titulo?.toUpperCase() ?? ''}
              subtitle="El artículo más relevante según tus intereses"
            />
            <Hr />
            <div className="diario-lead-grid">
              {leadArt && (
                <article>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                    {leadArt.tags.map(t => <TagBadge key={t} label={t} />)}
                  </div>
                  <div>
                    {leadArt.contenido.split('\n\n').map((p, i) => (
                      i === 0 ? (
                        <p key={i} style={{
                          fontFamily: SERIF, fontSize: 'clamp(14px, 2vw, 16px)', lineHeight: 1.75,
                          color: INK, margin: '0 0 16px',
                        }}>
                          <span
                            className="diario-drop-cap"
                            style={{ fontFamily: SERIF, fontWeight: 800, color: ACC }}
                          >
                            {p.charAt(0)}
                          </span>
                          {p.slice(1)}
                        </p>
                      ) : (
                        <p key={i} style={{
                          fontFamily: SERIF, fontSize: 'clamp(14px, 2vw, 16px)', lineHeight: 1.75,
                          color: INK, margin: '0 0 16px',
                        }}>
                          {p}
                        </p>
                      )
                    ))}
                    {leadArt.fuente && (
                      <p style={{
                        fontFamily: SANS, fontSize: '10px', letterSpacing: '0.07em',
                        textTransform: 'uppercase', color: INK2, margin: '16px 0 0',
                      }}>
                        Fuente: {leadArt.fuente}
                      </p>
                    )}
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <LeadReactions
                      artId={leadArt.id} tags={leadArt.tags}
                      reactions={diarioPrefs.reactions} onReact={onReact}
                    />
                  </div>
                </article>
              )}

              {/* Sidebar */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                <div>
                  <div style={{
                    fontFamily: SANS, fontSize: '10px', letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: ACC, fontWeight: 700, marginBottom: '8px',
                  }}>
                    Misiones activas
                  </div>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(20px, 3vw, 26px)', lineHeight: 1.1, margin: '0 0 6px' }}>
                    TODAY'S FOCUS
                  </h3>
                  <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '13px', color: INK2, margin: '0 0 16px' }}>
                    Tus prioridades para hoy
                  </p>
                  <Hr />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                    {pendingM.length === 0 ? (
                      <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '13px', color: INK2 }}>
                        Sin misiones pendientes.
                      </p>
                    ) : pendingM.map(m => (
                      <div key={m.id} style={{
                        border: `1px solid ${BORDER}`, background: BG_ALT,
                        padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '12px',
                      }}>
                        <div style={{
                          width: '14px', height: '14px', borderRadius: '50%',
                          border: `1.5px solid ${INK}`, flexShrink: 0, marginTop: '4px',
                        }} />
                        <div>
                          <p style={{ fontFamily: SERIF, fontSize: '15px', fontWeight: 600, color: INK, margin: 0, lineHeight: 1.3 }}>
                            {m.titulo}
                          </p>
                          {m.prioridad && (
                            <p style={{
                              fontFamily: SANS, fontSize: '9.5px', textTransform: 'uppercase',
                              letterSpacing: '0.08em', fontWeight: 700, margin: '4px 0 0',
                              color: m.prioridad === 'urgente' ? ACC : INK2,
                            }}>
                              {m.prioridad}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {librosLeyendo.length > 0 && (
                  <div>
                    <div style={{
                      fontFamily: SANS, fontSize: '10px', letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: ACC, fontWeight: 700, marginBottom: '8px',
                    }}>
                      Biblioteca
                    </div>
                    <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(20px, 3vw, 26px)', lineHeight: 1.1, margin: '0 0 6px' }}>
                      En Lectura
                    </h3>
                    <p style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '13px', color: INK2, margin: '0 0 16px' }}>
                      Lo que estás leyendo ahora
                    </p>
                    <Hr />
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {librosLeyendo.slice(0, 3).map(l => {
                        const leidos = l.capitulos.filter(c => c.leido).length;
                        const total  = l.capitulos.length;
                        const pct    = total > 0 ? Math.round((leidos / total) * 100) : 0;
                        return (
                          <div key={l.id} style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: '14px' }}>
                            <h4 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '17px', margin: '0 0 3px', lineHeight: 1.25 }}>
                              {l.titulo}
                            </h4>
                            {l.autor && (
                              <p style={{ fontFamily: SANS, fontSize: '12px', color: INK2, margin: '0 0 8px' }}>{l.autor}</p>
                            )}
                            <p style={{ fontFamily: SANS, fontSize: '11px', color: INK2, margin: '0 0 6px' }}>{pct}% completado</p>
                            <div style={{ height: '3px', background: BORDER, borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: '#a5793a', transition: 'width 0.3s' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </section>

          {/* ══ § 3  MENSAJES Y DIARIO ══ */}
          {fsEntradas.length > 0 && (
            <section className="diario-section" style={sectionBorder}>
              <SectionHead
                category="Diario personal"
                title="Mensajes y Diario"
                subtitle="Tus últimas entradas, leídas como conversación"
              />
              <Hr />
              <div className="diario-diary-grid">
                <div>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(22px, 3vw, 28px)', margin: '0 0 24px', lineHeight: 1.2 }}>
                    {fsEntradas[0].titulo ?? 'Notas Personales'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {fsEntradas.slice(0, 3).map((entrada, i) => {
                      const isRight = i % 2 === 1;
                      const personas = ['Gym Bro', 'Yo', 'Coach'];
                      const persona = personas[i % personas.length];
                      const fechaE = new Date(entrada.fecha + 'T12:00:00')
                        .toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
                      const snippet = entrada.contenido.split('\n')[0].slice(0, 220);
                      return (
                        <div key={entrada.id} style={{
                          display: 'flex', gap: '14px',
                          flexDirection: isRight ? 'row-reverse' : 'row',
                        }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '50%',
                            background: isRight ? '#1e40af' : BORDER,
                            flexShrink: 0, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 700,
                            color: isRight ? '#fff' : INK, fontFamily: SANS,
                          }}>
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div style={{
                            flex: 1, background: isRight ? INK : BG_ALT,
                            border: `1px solid ${isRight ? INK : BORDER}`,
                            borderRadius: isRight ? '14px 0 14px 14px' : '0 14px 14px 14px',
                            padding: '14px',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{
                                fontFamily: SANS, fontSize: '10px', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                color: isRight ? '#93c5fd' : INK2,
                              }}>
                                {persona}
                              </span>
                              <span style={{ fontFamily: SANS, fontSize: '10px', color: isRight ? '#6b7280' : INK2 }}>
                                {fechaE}
                              </span>
                            </div>
                            <p style={{ fontFamily: SERIF, fontSize: '15px', lineHeight: 1.65, color: isRight ? BG : INK, margin: 0 }}>
                              {snippet}{entrada.contenido.length > 220 ? '…' : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ background: BG_ALT, border: `1px solid ${BORDER}`, padding: '20px', alignSelf: 'start' }}>
                  <div style={{
                    fontFamily: SANS, fontSize: '10px', letterSpacing: '0.12em',
                    textTransform: 'uppercase', fontWeight: 700, color: ACC, marginBottom: '6px',
                  }}>
                    Stats
                  </div>
                  <h5 style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '20px', margin: '0 0 12px', lineHeight: 1.2 }}>
                    Resumen Diario
                  </h5>
                  <Hr />
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: SERIF, fontSize: '14px', color: INK2 }}>
                    <div><strong style={{ color: INK }}>Entradas:</strong> {fsEntradas.length} registradas</div>
                    {fsEntradas[0]?.titulo && (
                      <div><strong style={{ color: INK }}>Última:</strong> {fsEntradas[0].titulo}</div>
                    )}
                    <div>
                      <strong style={{ color: INK }}>Fecha:</strong>{' '}
                      {new Date((fsEntradas[0]?.fecha ?? HOY) + 'T12:00:00')
                        .toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ══ § DEPORTE ══ */}
          <section className="diario-section" style={sectionBorder}>
            <SectionHead
              category="Sección Deporte"
              title="DEPORTE"
              subtitle="Hockey · MMA · Fútbol · Jiujitsu · Pádel · Tenis"
            />
            <Hr thick />
            <div className="diario-subtab-pills">
              {DEPORTE_SUBS.map(sub => (
                <button
                  key={sub}
                  onClick={() => setDeporteSub(sub)}
                  style={{
                    fontFamily: SANS, fontSize: '11px', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '5px 14px', border: `1px solid ${BORDER}`,
                    background: deporteSub === sub ? ACC : 'transparent',
                    color: deporteSub === sub ? '#fff' : INK2,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                >
                  {sub === 'Todos' ? 'Todos' : sub.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="diario-articles-grid">
              {deporteArticulos
                .filter(a => deporteSub === 'Todos' || a.subseccion === deporteSub)
                .map(art => (
                  <ArticleCard
                    key={art.id}
                    art={art}
                    reactions={diarioPrefs.reactions}
                    onReact={onReact}
                    dismiss={dismiss}
                    dismissedIds={dismissedIds}
                  />
                ))}
            </div>
          </section>

          {/* ══ § ENTRETENIMIENTO ══ */}
          <section className="diario-section" style={sectionBorder}>
            <SectionHead
              category="Sección Entretenimiento"
              title="ENTRETENIMIENTO"
              subtitle="Anime · Netflix · Disney · Crunchyroll · Videojuegos · Consolas"
            />
            <Hr thick />
            <div className="diario-subtab-pills">
              {ENT_SUBS.map(sub => (
                <button
                  key={sub}
                  onClick={() => setEntSub(sub)}
                  style={{
                    fontFamily: SANS, fontSize: '11px', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '5px 14px', border: `1px solid ${BORDER}`,
                    background: entSub === sub ? ACC : 'transparent',
                    color: entSub === sub ? '#fff' : INK2,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                >
                  {sub === 'Todos' ? 'Todos' : sub.charAt(0).toUpperCase() + sub.slice(1)}
                </button>
              ))}
            </div>
            <div className="diario-articles-grid">
              {entArticulos
                .filter(a => entSub === 'Todos' || a.subseccion === entSub)
                .map(art => (
                  <ArticleCard
                    key={art.id}
                    art={art}
                    reactions={diarioPrefs.reactions}
                    onReact={onReact}
                    dismiss={dismiss}
                    dismissedIds={dismissedIds}
                  />
                ))}
            </div>
          </section>

          {/* ══ § 4  LECTURAS DEL DÍA ══ */}
          <section className="diario-section" style={{ borderBottom: 'none' }}>
            <SectionHead
              category="Inteligencia adaptativa"
              title="Lecturas del día"
              subtitle="Tocá ♥ para guardar o ✕ para descartar — el algoritmo aprende de tus elecciones."
            />
            <Hr />

            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '8px' }}>
              {lecturas.map((art, idx) => {
                const isDismissed = dismissedIds.has(art.id);
                const isExpanded  = expandedId === art.id;
                const paragraphs  = art.contenido.split('\n\n');
                const primaryTag  = art.tags[0] ?? '';

                return (
                  <div
                    key={art.id}
                    style={{
                      overflow: 'hidden',
                      maxHeight: isDismissed ? '60px' : '3000px',
                      opacity: isDismissed ? 0.7 : 1,
                      transition: 'max-height 0.45s ease, opacity 0.3s ease',
                      borderBottom: idx < lecturas.length - 1 ? `1px solid ${BORDER}` : 'none',
                    }}
                  >
                    {/* Dismissed bar */}
                    {isDismissed ? (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 0', color: INK2, gap: '12px', flexWrap: 'wrap',
                      }}>
                        <span style={{ fontFamily: SANS, fontSize: '12px', letterSpacing: '0.04em' }}>
                          ✕ Contenido descartado — el algoritmo aprendió tus preferencias
                        </span>
                        <button
                          onClick={() => undismiss(art.id)}
                          style={{
                            fontFamily: SANS, fontSize: '11px', fontWeight: 700,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            background: 'none', border: `1px solid ${BORDER}`,
                            color: INK2, cursor: 'pointer', padding: '4px 12px',
                          }}
                        >
                          Deshacer
                        </button>
                      </div>
                    ) : (
                      <article style={{ padding: 'clamp(24px, 4vw, 40px) 0' }}>
                        {/* Category label */}
                        <div style={{
                          fontFamily: SANS, fontSize: '10px', letterSpacing: '0.18em',
                          textTransform: 'uppercase', fontWeight: 700, color: ACC, marginBottom: '8px',
                        }}>
                          {primaryTag}
                        </div>
                        {/* Title */}
                        <h3
                          style={{
                            fontFamily: SERIF, fontWeight: 700,
                            fontSize: 'clamp(20px, 3vw, 34px)',
                            lineHeight: 1.15, margin: '0 0 10px',
                            cursor: 'pointer', color: INK,
                          }}
                          onClick={() => setExpandedId(isExpanded ? null : art.id)}
                        >
                          {art.titulo}
                        </h3>
                        {/* Tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                          {art.tags.map(t => <TagBadge key={t} label={t} />)}
                        </div>

                        {/* Content */}
                        {isExpanded ? (
                          <>
                            {paragraphs.map((p, i) => (
                              <p key={i} style={{
                                fontFamily: SERIF, fontSize: 'clamp(14px, 2vw, 15px)', lineHeight: 1.75,
                                color: INK2, margin: '0 0 14px',
                              }}>
                                {p}
                              </p>
                            ))}
                            {art.fuente && (
                              <p style={{
                                fontFamily: SANS, fontSize: '10px', letterSpacing: '0.07em',
                                textTransform: 'uppercase', color: INK2, margin: '8px 0 0',
                              }}>
                                Fuente: {art.fuente}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p style={{
                              fontFamily: SERIF, fontStyle: 'italic',
                              fontSize: 'clamp(14px, 2vw, 16px)', lineHeight: 1.6,
                              color: INK2, margin: '0 0 6px',
                            }}>
                              {paragraphs[0].split('.')[0]}.
                            </p>
                            <p style={{
                              fontFamily: SERIF, fontSize: 'clamp(13px, 2vw, 14.5px)', lineHeight: 1.65,
                              color: INK2, margin: '0 0 14px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            } as React.CSSProperties}>
                              {paragraphs[0].split('.').slice(1).join('.').trim()}
                            </p>
                          </>
                        )}

                        {/* Reactions + expand */}
                        <div className="diario-reactions">
                          <ArticleReactions
                            artId={art.id} tags={art.tags}
                            reactions={diarioPrefs.reactions}
                            onReact={onReact}
                            onDismiss={dismiss}
                          />
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : art.id)}
                            style={{
                              fontFamily: SANS, fontSize: '11px', letterSpacing: '0.07em',
                              textTransform: 'uppercase', background: 'none',
                              border: `1px solid ${BORDER}`,
                              color: INK2, cursor: 'pointer', padding: '6px 14px', fontWeight: 700,
                            }}
                          >
                            {isExpanded ? '▲ Cerrar' : '▼ Leer más'}
                          </button>
                        </div>
                      </article>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Algorithm hint */}
            <div style={{
              marginTop: '24px', padding: '16px 20px',
              border: `1px solid ${BORDER}`, background: BG_ALT,
              display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '20px' }}>♥</span>
              <div>
                <p style={{ fontFamily: SANS, fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 2px', color: INK }}>
                  Algoritmo adaptativo
                </p>
                <p style={{ fontFamily: SERIF, fontSize: '13px', color: INK2, margin: 0 }}>
                  {Object.values(diarioPrefs.reactions).filter(r => r === 'like').length} guardados ·{' '}
                  {Object.values(diarioPrefs.reactions).filter(r => r === 'dislike').length} descartados ·{' '}
                  El orden mejora con cada reacción
                </p>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer style={{
            marginTop: '16px', paddingTop: '24px',
            borderTop: `3px double ${INK}`,
            textAlign: 'center', fontFamily: SANS, fontSize: '10px',
            letterSpacing: '0.06em', color: INK2, textTransform: 'uppercase',
          }}>
            El Questflow — Edición personal · {userName}
            <div style={{ marginTop: '8px', fontSize: '9.5px', opacity: 0.65, textTransform: 'none', letterSpacing: '0.02em' }}>
              {Object.keys(diarioPrefs.reactions).length} artículos valorados · Sistema adaptativo · {fechaCap}
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}
