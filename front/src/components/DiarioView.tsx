import React, { useState } from 'react';
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function Hr() {
  return <div style={{ borderTop: `1px solid ${INK}` }} />;
}

function TagBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: SANS, fontSize: '10px', letterSpacing: '0.08em',
      textTransform: 'uppercase', fontWeight: 700,
      border: `1px solid ${INK}`, padding: '2px 7px',
    }}>
      {label}
    </span>
  );
}

function ReactionBar({ artId, tags, reactions, onReact }: {
  artId: string;
  tags: string[];
  reactions: Record<string, DiarioReaction>;
  onReact: (id: string, r: DiarioReaction, t: string[]) => void;
}) {
  const current = reactions[artId];
  const btn = (r: DiarioReaction, symbol: string, label: string) => (
    <button
      key={r}
      onClick={() => onReact(artId, r, tags)}
      style={{
        fontFamily: SANS, fontSize: '10px', letterSpacing: '0.06em',
        textTransform: 'uppercase', fontWeight: 700,
        padding: '4px 10px', border: `1px solid ${INK}`,
        background: current === r ? (r === 'like' ? INK : ACC) : 'transparent',
        color: current === r ? BG : INK2,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: '8px' }}>{symbol}</span> {label}
    </button>
  );
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {btn('like', '▲', 'ÚTIL')}
      {btn('dislike', '▼', 'PASAR')}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function DiarioView({
  stats, habits: _habits, fsRutinas: _fsRutinas, fsMisiones,
  fsLibros, fsEntradas, userName, diarioPrefs, onReact,
}: Props) {
  // Freeze article order on mount
  const [articulos] = useState(() =>
    scoreArticulos(ARTICULOS, diarioPrefs.tagScores, diarioPrefs.reactions)
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalLevel    = stats.reduce((s, st) => s + st.level, 0);
  const librosLeyendo = fsLibros.filter(l => l.estado === 'leyendo');
  const pendingM      = fsMisiones.filter(m => !m.completada).slice(0, 4);

  const fechaObj  = new Date(HOY + 'T12:00:00');
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

  return (
    <div style={{
      background: BG,
      fontFamily: SANS,
      color: INK,
      padding: '32px 40px 80px',
      minHeight: '100vh',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── MASTHEAD ── */}
        <header style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            fontFamily: SANS, fontSize: '11px', letterSpacing: '0.15em',
            textTransform: 'uppercase', color: INK2, fontWeight: 600,
            marginBottom: '16px', display: 'flex', gap: '10px',
            justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {['FILOSOFÍA', 'IA', 'CIENCIA', 'HISTORIA', 'PSICOLOGÍA', 'ECONOMÍA'].map((c, i, a) => (
              <React.Fragment key={c}>
                <span>{c}</span>
                {i < a.length - 1 && <span style={{ opacity: 0.35 }}>·</span>}
              </React.Fragment>
            ))}
          </div>
          <h1 style={{
            fontFamily: SERIF, fontWeight: 800,
            fontSize: 'clamp(32px, 6vw, 72px)',
            lineHeight: 1, letterSpacing: '-0.02em',
            margin: '0 0 16px',
          }}>
            {saludo}, {userName}
          </h1>
          <p style={{
            fontFamily: SERIF, fontStyle: 'italic',
            fontSize: '17px', color: INK2, margin: 0,
          }}>
            "El conocimiento es el único recurso que crece al compartirse"
          </p>
        </header>

        <Hr />
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 0',
          fontFamily: SANS, fontSize: '10.5px', letterSpacing: '0.08em',
          textTransform: 'uppercase', fontWeight: 600, color: INK2,
          flexWrap: 'wrap', gap: '8px',
        }}>
          <span>{fechaCap}</span>
          <span>Edición N.º {edicion}</span>
          <span>@{userName} · Level {totalLevel}</span>
        </div>
        <Hr />

        {/* ── LEAD + SIDEBAR ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,7fr) minmax(220px,3fr)',
          gap: '48px',
          margin: '40px 0 56px',
        }}>
          {/* Lead article */}
          {leadArt && (
            <article>
              <div style={{
                fontFamily: SANS, fontSize: '10px', letterSpacing: '0.12em',
                textTransform: 'uppercase', fontWeight: 700, color: ACC,
                marginBottom: '12px',
              }}>
                Idea del día
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {leadArt.tags.map(t => <TagBadge key={t} label={t} />)}
              </div>
              <h2 style={{
                fontFamily: SERIF, fontWeight: 700, fontSize: '32px',
                lineHeight: 1.2, margin: '0 0 20px',
              }}>
                {leadArt.titulo}
              </h2>
              <div>
                {leadArt.contenido.split('\n\n').map((p, i) => (
                  i === 0 ? (
                    <p key={i} style={{
                      fontFamily: SERIF, fontSize: '15px', lineHeight: 1.7,
                      color: INK, margin: '0 0 14px',
                    }}>
                      <span style={{
                        float: 'left', fontFamily: SERIF, fontWeight: 800,
                        fontSize: '56px', lineHeight: 0.8,
                        paddingRight: '8px', paddingTop: '4px', color: ACC,
                      }}>
                        {p.charAt(0)}
                      </span>
                      {p.slice(1)}
                    </p>
                  ) : (
                    <p key={i} style={{
                      fontFamily: SERIF, fontSize: '15px', lineHeight: 1.7,
                      color: INK, margin: '0 0 14px',
                    }}>
                      {p}
                    </p>
                  )
                ))}
                {leadArt.fuente && (
                  <p style={{
                    fontFamily: SANS, fontSize: '10px', letterSpacing: '0.07em',
                    textTransform: 'uppercase', color: INK2, margin: '12px 0 0',
                  }}>
                    Fuente: {leadArt.fuente}
                  </p>
                )}
              </div>
              <div style={{ marginTop: '16px' }}>
                <ReactionBar
                  artId={leadArt.id} tags={leadArt.tags}
                  reactions={diarioPrefs.reactions} onReact={onReact}
                />
              </div>
            </article>
          )}

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* TODAY'S FOCUS */}
            <div>
              <h3 style={{
                fontFamily: SERIF, fontWeight: 700, fontSize: '18px',
                borderBottom: `1px solid ${INK}`, paddingBottom: '8px',
                margin: '0 0 16px',
              }}>
                TODAY'S FOCUS
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingM.length === 0 ? (
                  <p style={{
                    fontFamily: SERIF, fontStyle: 'italic',
                    fontSize: '13px', color: INK2,
                  }}>
                    Sin misiones pendientes.
                  </p>
                ) : pendingM.map(m => (
                  <div key={m.id} style={{
                    border: `1px solid ${BORDER}`, background: BG_ALT,
                    padding: '12px', display: 'flex',
                    alignItems: 'flex-start', gap: '10px',
                  }}>
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      border: `1px solid ${INK}`, flexShrink: 0, marginTop: '3px',
                    }} />
                    <div>
                      <p style={{
                        fontFamily: SERIF, fontSize: '15px', fontWeight: 600,
                        color: INK, margin: 0, lineHeight: 1.3,
                      }}>
                        {m.titulo}
                      </p>
                      {m.prioridad && (
                        <p style={{
                          fontFamily: SANS, fontSize: '10px', textTransform: 'uppercase',
                          letterSpacing: '0.07em', fontWeight: 700, margin: '4px 0 0',
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

            {/* EN LECTURA */}
            {librosLeyendo.length > 0 && (
              <div>
                <h3 style={{
                  fontFamily: SERIF, fontWeight: 700, fontSize: '18px',
                  borderBottom: `1px solid ${INK}`, paddingBottom: '8px',
                  margin: '0 0 16px',
                }}>
                  EN LECTURA
                </h3>
                {librosLeyendo.slice(0, 3).map(l => {
                  const leidos = l.capitulos.filter(c => c.leido).length;
                  const total  = l.capitulos.length;
                  const pct    = total > 0 ? Math.round((leidos / total) * 100) : 0;
                  return (
                    <div key={l.id} style={{
                      borderBottom: `1px solid ${BORDER}`,
                      paddingBottom: '14px', marginBottom: '14px',
                    }}>
                      <h4 style={{
                        fontFamily: SERIF, fontWeight: 700, fontSize: '16px',
                        margin: '0 0 4px', lineHeight: 1.25,
                      }}>
                        {l.titulo}
                      </h4>
                      {l.autor && (
                        <p style={{
                          fontFamily: SANS, fontSize: '12px',
                          color: INK2, margin: '0 0 6px',
                        }}>
                          {l.autor}
                        </p>
                      )}
                      <p style={{ fontFamily: SANS, fontSize: '11px', color: INK2, margin: '0 0 6px' }}>
                        {pct}% completado
                      </p>
                      <div style={{
                        height: '3px', background: BORDER,
                        borderRadius: '2px', overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: '#a5793a', transition: 'width 0.3s',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        </div>

        {/* ── LECTURAS DEL DÍA ── */}
        <Hr />
        <div style={{ padding: '20px 0 16px' }}>
          <h2 style={{
            fontFamily: SERIF, fontWeight: 700, fontSize: '26px',
            margin: '0 0 4px',
          }}>
            Lecturas del día
          </h2>
          <p style={{
            fontFamily: SERIF, fontStyle: 'italic',
            fontSize: '13px', color: INK2, margin: 0,
          }}>
            Usá ▲ y ▼ para enseñarle qué te interesa. El orden se adapta con el tiempo.
          </p>
        </div>
        <Hr />

        {/* ── Mensajes y Diario ── */}
        {fsEntradas.length > 0 && (
          <article style={{
            borderBottom: `1px solid ${BORDER}`,
            paddingBottom: '40px', marginBottom: '40px', marginTop: '32px',
          }}>
            <h4 style={{
              fontFamily: SERIF, fontWeight: 700, fontSize: '18px',
              borderBottom: `1px solid ${INK}`, paddingBottom: '8px',
              marginBottom: '20px', textTransform: 'uppercase',
              letterSpacing: '0.04em', margin: '0 0 20px',
            }}>
              Mensajes y Diario
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,3fr) minmax(160px,1fr)',
              gap: '24px',
            }}>
              <div>
                <h5 style={{
                  fontFamily: SERIF, fontWeight: 700, fontSize: '26px',
                  margin: '0 0 20px', lineHeight: 1.2,
                }}>
                  {fsEntradas[0].titulo ?? 'Notas Personales'}
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {fsEntradas.slice(0, 3).map((entrada, i) => {
                    const isRight = i % 2 === 1;
                    const personas = ['Gym Bro', 'Yo', 'Coach'];
                    const persona = personas[i % personas.length];
                    const fechaE = new Date(entrada.fecha + 'T12:00:00')
                      .toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
                    const snippet = entrada.contenido.split('\n')[0].slice(0, 200);
                    return (
                      <div key={entrada.id} style={{
                        display: 'flex', gap: '12px',
                        flexDirection: isRight ? 'row-reverse' : 'row',
                      }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: isRight ? '#1e40af' : BORDER,
                          flexShrink: 0, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 700,
                          color: isRight ? '#fff' : INK, fontFamily: SANS,
                        }}>
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{
                          flex: 1, background: isRight ? INK : BG_ALT,
                          border: `1px solid ${isRight ? INK : BORDER}`,
                          borderRadius: isRight
                            ? '12px 0 12px 12px'
                            : '0 12px 12px 12px',
                          padding: '12px',
                        }}>
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            marginBottom: '6px',
                          }}>
                            <span style={{
                              fontFamily: SANS, fontSize: '10px', fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.07em',
                              color: isRight ? '#93c5fd' : INK2,
                            }}>
                              {persona}
                            </span>
                            <span style={{
                              fontFamily: SANS, fontSize: '10px',
                              color: isRight ? '#6b7280' : INK2,
                            }}>
                              {fechaE}
                            </span>
                          </div>
                          <p style={{
                            fontFamily: SERIF, fontSize: '14px', lineHeight: 1.65,
                            color: isRight ? BG : INK, margin: 0,
                          }}>
                            {snippet}
                            {entrada.contenido.length > 200 ? '…' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Mini sidebar */}
              <div style={{
                background: BG_ALT, border: `1px solid ${BORDER}`,
                padding: '16px', alignSelf: 'start',
              }}>
                <h6 style={{
                  fontFamily: SANS, fontWeight: 700, fontSize: '10px',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  borderBottom: `1px solid ${BORDER}`,
                  paddingBottom: '8px', margin: '0 0 12px',
                }}>
                  Resumen Diario
                </h6>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '8px',
                  fontFamily: SERIF, fontSize: '13px', color: INK2,
                }}>
                  <div>
                    <strong style={{ color: INK }}>Entradas:</strong>{' '}
                    {fsEntradas.length} registradas
                  </div>
                  {fsEntradas[0]?.titulo && (
                    <div>
                      <strong style={{ color: INK }}>Última:</strong>{' '}
                      {fsEntradas[0].titulo}
                    </div>
                  )}
                  <div>
                    <strong style={{ color: INK }}>Fecha:</strong>{' '}
                    {new Date((fsEntradas[0]?.fecha ?? HOY) + 'T12:00:00')
                      .toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}

        {/* ── Article grid ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {lecturas.map(art => {
            const isExpanded = expandedId === art.id;
            const paragraphs = art.contenido.split('\n\n');
            const faded = diarioPrefs.reactions[art.id] === 'dislike';
            return (
              <article key={art.id} style={{
                borderBottom: `1px solid ${BORDER}`,
                paddingBottom: '36px',
                opacity: faded ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                  {art.tags.map(t => <TagBadge key={t} label={t} />)}
                </div>
                <h4
                  style={{
                    fontFamily: SERIF, fontWeight: 700, fontSize: '22px',
                    lineHeight: 1.25, margin: '0 0 12px', cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : art.id)}
                >
                  {art.titulo}
                </h4>
                {isExpanded ? (
                  <>
                    {paragraphs.map((p, i) => (
                      <p key={i} style={{
                        fontFamily: SERIF, fontSize: '14.5px', lineHeight: 1.7,
                        color: INK2, margin: '0 0 12px',
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
                  <p style={{
                    fontFamily: SERIF, fontSize: '14.5px', lineHeight: 1.65,
                    color: INK2, margin: '0 0 12px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  } as React.CSSProperties}>
                    {paragraphs[0]}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <ReactionBar
                    artId={art.id} tags={art.tags}
                    reactions={diarioPrefs.reactions} onReact={onReact}
                  />
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : art.id)}
                    style={{
                      fontFamily: SANS, fontSize: '10px', letterSpacing: '0.06em',
                      textTransform: 'uppercase', background: 'none', border: 'none',
                      color: INK2, cursor: 'pointer', padding: '4px 4px',
                      fontWeight: 700,
                    }}
                  >
                    {isExpanded ? '▲ cerrar' : '▼ leer más'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* ── FOOTER ── */}
        <footer style={{
          marginTop: '48px', paddingTop: '20px',
          borderTop: `3px double ${INK}`,
          textAlign: 'center', fontFamily: SANS, fontSize: '10px',
          letterSpacing: '0.06em', color: INK2, textTransform: 'uppercase',
        }}>
          El Questflow — Edición personal · {userName}
          <div style={{
            marginTop: '8px', fontSize: '9.5px', opacity: 0.7,
            textTransform: 'none', letterSpacing: '0.02em',
          }}>
            {Object.keys(diarioPrefs.reactions).length} artículos valorados · Sistema adaptativo · {fechaCap}
          </div>
        </footer>

      </div>
    </div>
  );
}
