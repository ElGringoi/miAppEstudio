import React from 'react';
import type { Stat, Habit, FSRutina, FSMision, FSLibro } from '../types';
import { HOY } from '../utils/constants';

const INK       = '#211d16';
const INK_SOFT  = '#4a4438';
const PAPER     = '#efe8d8';
const PAPER_ALT = '#e6ddc8';
const RED       = '#9c2b1f';
const BLUE      = '#2a4258';
const GOLD      = '#a5793a';
const RULE      = '#c9bfa4';
const SERIF     = "Georgia, 'Times New Roman', serif";
const MONO      = "'Courier New', Courier, monospace";

interface Props {
  stats:       Stat[];
  habits:      Habit[];
  fsRutinas:   FSRutina[];
  fsMisiones:  FSMision[];
  fsLibros:    FSLibro[];
  userName:    string;
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

export function DiarioView({ stats, habits, fsRutinas, fsMisiones, fsLibros, userName }: Props) {
  const todayDow     = new Date().getDay();
  const rutinaHoy    = fsRutinas.find(r => (r.diasSemana ?? []).includes(todayDow));
  const habitsHoy    = habits.filter(h => h.activeToday);
  const habitsDone   = habitsHoy.filter(h => h.completed).length;
  const allDone      = habitsHoy.length > 0 && habitsDone === habitsHoy.length;

  const pending      = fsMisiones.filter(m => !m.completada);
  const urgentM      = pending.find(m => m.prioridad === 'urgente')
                    ?? pending.find(m => m.prioridad === 'alta')
                    ?? pending[0];

  const librosLeyendo = fsLibros.filter(l => l.estado === 'leyendo');
  const totalLevel    = stats.reduce((s, st) => s + st.level, 0);

  const fechaObj  = new Date(HOY + 'T12:00:00');
  const fechaLarga = fechaObj.toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const fechaCap = fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1);

  const epoch     = new Date('2024-01-01').getTime();
  const edicion   = Math.floor((fechaObj.getTime() - epoch) / 86400000);

  const leadTitle = allDone
    ? `${userName} conquista el día: todas las quests completadas`
    : urgentM
      ? urgentM.titulo
      : 'Sin misiones críticas activas: día de consolidación';

  const leadDek = allDone
    ? `El aventurero no dejó ninguna tarea pendiente. ${habitsDone} de ${habitsHoy.length} quests completadas. La racha continúa.`
    : urgentM
      ? `Misión clasificada como "${urgentM.prioridad ?? 'normal'}". Requiere atención para avanzar en el árbol de objetivos.`
      : 'Jornada sin alertas críticas. Buen momento para revisar misiones en progreso y planificar próximos pasos.';

  const leadBody = allDone
    ? `Con ${habitsDone} quests completadas y nivel global ${totalLevel}, el progreso del día cierra en verde. El sistema de XP registró actividad en múltiples atributos.`
    : pending.length > 0
      ? `El árbol de misiones registra ${pending.length} objetivos activos. ${pending.filter(m => m.prioridad === 'urgente').length} urgentes y ${pending.filter(m => m.prioridad === 'alta').length} de alta prioridad esperan atención esta jornada.`
      : 'No hay misiones activas registradas. Buen momento para definir nuevos objetivos y expandir el árbol de misiones.';

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

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div style={sh}>

      {/* ── MASTHEAD ── */}
      <div style={{ textAlign: 'center', borderBottom: `4px double ${INK}`, paddingBottom: '14px', marginBottom: '10px' }}>
        <div style={{ fontFamily: MONO, fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: INK_SOFT, marginBottom: '6px' }}>
          Edición personal · Quests · Gym · Misiones · Progreso
        </div>
        <h1 style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 'clamp(28px, 5.5vw, 72px)', letterSpacing: '-0.01em', margin: 0, lineHeight: 1 }}>
          {saludo}, {userName}
        </h1>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '14px', color: INK_SOFT, marginTop: '8px' }}>
          "La batalla de hoy construye el héroe de mañana"
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

      {/* ── LEAD ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px',
        paddingBottom: '26px', borderBottom: `1px solid ${RULE}`, marginBottom: '26px',
      }}>
        <div>
          <span style={{
            fontFamily: MONO, fontSize: '10.5px', letterSpacing: '0.12em', textTransform: 'uppercase',
            color: RED, fontWeight: 700, marginBottom: '8px', display: 'inline-block',
          }}>
            {allDone ? '🏆 Logro del día' : urgentM?.prioridad === 'urgente' ? '🚨 Urgente' : '🎯 Misión activa'}
          </span>
          <h2 style={{
            fontFamily: SERIF, fontWeight: 700, fontSize: 'clamp(22px, 3vw, 36px)',
            lineHeight: 1.05, margin: '0 0 14px',
          }}>
            {leadTitle}
          </h2>
          <p style={{ fontSize: '15px', color: INK_SOFT, fontStyle: 'italic', margin: '0 0 14px', lineHeight: 1.45, fontFamily: SERIF }}>
            {leadDek}
          </p>
          <DropCapPara text={leadBody} style={bodyText} />
          <div style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.06em', textTransform: 'uppercase', color: INK_SOFT, marginTop: '10px' }}>
            Redacción QuestFlow · {fechaCap}
          </div>
        </div>

        <div style={{ borderLeft: `1px solid ${RULE}`, paddingLeft: '28px' }}>
          <h3 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: '20px', lineHeight: 1.15, margin: '0 0 10px' }}>
            El marcador
          </h3>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: INK_SOFT, fontFamily: SERIF, margin: 0 }}>
            {habitsHoy.length > 0
              ? `${habitsDone} de ${habitsHoy.length} quests completadas hoy.`
              : 'Sin quests activas para hoy.'
            }
            {rutinaHoy ? ` Rutina asignada: ${rutinaHoy.nombre}.` : ' Sin rutina de gym para hoy.'}
          </p>
          <div style={statBox}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '34px', color: RED, lineHeight: 1 }}>
              {habitsDone}/{habitsHoy.length}
            </div>
            <div style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', color: INK_SOFT, marginTop: '6px' }}>
              Quests completadas hoy
            </div>
          </div>
          <div style={statBox}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '34px', color: BLUE, lineHeight: 1 }}>
              {pending.length}
            </div>
            <div style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', color: INK_SOFT, marginTop: '6px' }}>
              Misiones en curso
            </div>
          </div>
          {rutinaHoy && (
            <div style={statBox}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '34px', color: GOLD, lineHeight: 1 }}>
                {(rutinaHoy.ejercicios ?? []).filter(e => e.lastCompletedDate === HOY).length}/
                {(rutinaHoy.ejercicios ?? []).length}
              </div>
              <div style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase', color: INK_SOFT, marginTop: '6px' }}>
                Ejercicios completados hoy
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── QUESTS DEL DÍA ── */}
      <SectionHeader label="Quests del día" color={RED} />
      {habitsHoy.length === 0 ? (
        <p style={{ fontFamily: SERIF, color: INK_SOFT, fontSize: '14px', fontStyle: 'italic' }}>Sin quests activas para hoy.</p>
      ) : (
        <div style={{ columns: '3 200px', columnGap: '28px' }}>
          {habitsHoy.map(h => (
            <div key={h.id} style={{ ...brief, opacity: h.completed ? 0.55 : 1 }}>
              <h4 style={briefH4}>
                {h.completed ? '✓ ' : '◯ '}{h.name}
              </h4>
              <p style={briefP}>{h.xpValue} XP · {h.attribute}</p>
              <span style={tag}>{h.completed ? 'Completada' : 'Pendiente'} · {h.recurrence}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── GYM ── */}
      <SectionHeader label="Gym" color={BLUE} />
      {rutinaHoy ? (
        <>
          <p style={{ fontSize: '15px', color: INK_SOFT, fontStyle: 'italic', margin: '0 0 16px', lineHeight: 1.45, fontFamily: SERIF }}>
            Rutina de hoy: <strong style={{ fontStyle: 'normal' }}>{rutinaHoy.nombre}</strong>
          </p>
          <div style={{ columns: '3 200px', columnGap: '28px' }}>
            {(rutinaHoy.ejercicios ?? []).map(ej => {
              const done = ej.lastCompletedDate === HOY;
              return (
                <div key={ej.id} style={{ ...brief, opacity: done ? 0.55 : 1 }}>
                  <h4 style={briefH4}>{done ? '✓ ' : '◯ '}{ej.nombre}</h4>
                  <p style={briefP}>
                    {[ej.series && `${ej.series} series`, ej.reps && `${ej.reps} reps`].filter(Boolean).join(' × ')}
                    {ej.notas ? ` — ${ej.notas}` : ''}
                  </p>
                  <span style={tag}>{done ? 'Completado' : 'Pendiente'}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p style={{ fontFamily: SERIF, color: INK_SOFT, fontSize: '14px', fontStyle: 'italic' }}>
          Descanso programado. Sin rutina asignada para hoy.
        </p>
      )}

      {/* ── MISIONES ACTIVAS ── */}
      <SectionHeader label="Misiones activas" color={GOLD} />
      {pending.length === 0 ? (
        <p style={{ fontFamily: SERIF, color: INK_SOFT, fontSize: '14px', fontStyle: 'italic' }}>
          Sin misiones activas. El héroe está en pausa estratégica.
        </p>
      ) : (
        <div style={{ columns: '3 200px', columnGap: '28px' }}>
          {pending.slice(0, 9).map(m => (
            <div key={m.id} style={brief}>
              <h4 style={briefH4}>{m.titulo}</h4>
              {m.descripcion && <p style={briefP}>{m.descripcion}</p>}
              <span style={tag}>
                {m.prioridad
                  ? m.prioridad.charAt(0).toUpperCase() + m.prioridad.slice(1)
                  : 'Normal'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── BIBLIOTECA ── */}
      {librosLeyendo.length > 0 && (
        <>
          <SectionHeader label="Biblioteca" color={INK_SOFT} />
          <div style={{ columns: '3 200px', columnGap: '28px' }}>
            {librosLeyendo.map(l => {
              const leidos = (l.capitulos ?? []).filter(c => c.leido).length;
              const total  = (l.capitulos ?? []).length;
              const pct    = total > 0 ? Math.round((leidos / total) * 100) : 0;
              return (
                <div key={l.id} style={brief}>
                  <h4 style={briefH4}>{l.titulo}</h4>
                  <p style={briefP}>
                    {l.autor && `${l.autor} · `}
                    {leidos}/{total} capítulos ({pct}%) · {l.xpPorCapitulo} XP/cap.
                  </p>
                  <span style={tag}>En lectura</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── FOOTER ── */}
      <footer style={{
        marginTop: '40px', paddingTop: '16px', borderTop: `3px double ${INK}`,
        textAlign: 'center', fontFamily: MONO, fontSize: '10px',
        letterSpacing: '0.05em', color: INK_SOFT, textTransform: 'uppercase',
      }}>
        El Questflow — Edición personal · {userName}
        <div style={{ marginTop: '8px', fontSize: '9.5px', opacity: 0.7, textTransform: 'none', letterSpacing: '0.02em' }}>
          Datos sincronizados con Firebase Firestore · Sistema de progresión RPG · {fechaCap}
        </div>
      </footer>

    </div>
  );
}
