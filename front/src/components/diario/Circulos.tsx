// "Mis círculos": una columna de opinión por día sobre tu vida social. Las
// frases salen de utils/columnaCirculos.ts; acá se junta lo que pasó en cada
// grupo (WhatsApp sin asignar, notas vinculadas, eventos, fechas, propuestas).

import { useState } from 'react';
import type { FSEntradaDiario, FSEvento, FSGrupo, FSInboxItem, FSPersona } from '../../types';
import { sumarDias } from '../../utils/edicion';
import { proponerFecha, type PropuestaFecha } from '../../utils/inboxFecha';
import { armarColumnas, corto, type Columna, type Hecho } from '../../utils/columnaCirculos';
import { TituloSeccion, Vacio } from './Piezas';

const DIAS_ATRAS = 7;     // ventana de lo que ya pasó
const DIAS_ADELANTE = 14; // ventana de lo que viene
const VENTANA_FECHAS = 30;

const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const quitarSufijo = (s: string) => s.replace(/\s*\(WhatsApp\)\s*$/i, '').trim();

const fechaColumna = (iso: string) => {
  const t = new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Próxima ocurrencia de una fecha clave (si es anual, se mueve al año siguiente cuando ya pasó). */
function proximaOcurrencia(fecha: string, anual: boolean, hoy: string): string | undefined {
  if (!anual) return fecha >= hoy ? fecha : undefined;
  const anio = Number(hoy.slice(0, 4));
  for (const a of [anio, anio + 1]) {
    const f = `${a}${fecha.slice(4)}`;
    if (f >= hoy) return f;
  }
  return undefined;
}

/** Palabras con las que reconocer un grupo: su nombre y el de sus integrantes, como palabra completa. */
function patronDe(terminos: string[]): RegExp | null {
  const validos = terminos.map(normalizar).filter(t => t.length >= 3);
  if (!validos.length) return null;
  return new RegExp(`(?<!\\p{L})(${validos.map(escapar).join('|')})(?!\\p{L})`, 'u');
}

interface Props {
  fsGrupos:   FSGrupo[];
  fsPersonas: FSPersona[];
  fsInbox:    FSInboxItem[];
  fsEventos:  FSEvento[];
  fsEntradas: FSEntradaDiario[];
  hoy:        string;
  idTitulo:   string;
  onAgendar:  (item: FSInboxItem, grupo: FSGrupo, propuesta: PropuestaFecha) => void;
}

export function PaginaCirculos({ fsGrupos, fsPersonas, fsInbox, fsEventos, fsEntradas, hoy, idTitulo, onAgendar }: Props) {
  const [filtro, setFiltro] = useState<string | null>(null);

  const desde = sumarDias(hoy, -DIAS_ATRAS);
  const hasta = sumarDias(hoy, DIAS_ADELANTE);
  const pendientesInbox = fsInbox.filter(i => !i.procesado);
  const notasPorId = new Map(fsEntradas.map(e => [e.id, e]));

  const grupos = fsGrupos.map(g => {
    const miembros = fsPersonas.filter(p => p.grupos?.includes(g.id));
    const patron = patronDe([g.nombre, ...miembros.flatMap(m => [m.nombre, m.apodo ?? ''])]);
    const coincide = (texto: string) => (patron ? patron.test(normalizar(texto)) : false);

    const hechos: Hecho[] = [];

    // Mensajes de WhatsApp sin asignar que son de este círculo.
    for (const i of pendientesInbox) {
      if (!coincide(`${i.texto} ${i.titulo ?? ''} ${i.remitente ?? ''}`)) continue;
      const fecha = i.recibidoEn.slice(0, 10);
      if (fecha >= desde && fecha <= hoy) {
        hechos.push({ tipo: 'mensaje', grupoId: g.id, circulo: g.nombre, fecha, de: i.remitente ? quitarSufijo(i.remitente) : undefined, texto: i.texto });
      }
      // Propuesta con día: la del agente, o la que sale del texto. "Mañana" y
      // "el jueves" se cuentan desde el día en que llegó el mensaje, no desde hoy.
      const datos = i.fechaSugerida
        ? { fecha: i.fechaSugerida, hora: i.horaSugerida }
        : proponerFecha(i.texto, fecha);
      if (datos && datos.fecha >= hoy && datos.fecha <= hasta) {
        hechos.push({
          tipo: 'propuesta', grupoId: g.id, circulo: g.nombre, fecha: datos.fecha, hora: datos.hora,
          texto: i.texto, accion: { itemId: i.id, grupoId: g.id, propuesta: datos },
        });
      }
    }

    // Notas del diario vinculadas al grupo.
    for (const id of g.links ?? []) {
      const e = notasPorId.get(id);
      if (e && e.fecha >= desde && e.fecha <= hoy) {
        hechos.push({ tipo: 'nota', grupoId: g.id, circulo: g.nombre, fecha: e.fecha, titulo: e.titulo ?? e.contenido.split('\n')[0] });
      }
    }

    // Eventos del grupo (los agendados desde el inbox) y, para los viejos sin grupo, los que mencionan a alguien.
    for (const e of fsEventos) {
      if (e.fecha < desde || e.fecha > hasta) continue;
      if (e.grupoId ? e.grupoId !== g.id : !coincide(e.titulo)) continue;
      hechos.push({ tipo: 'evento', grupoId: g.id, circulo: g.nombre, fecha: e.fecha, hora: e.hora, titulo: e.titulo });
    }

    // Fechas clave del grupo dentro de la ventana de 30 días.
    for (const f of g.fechasClave ?? []) {
      const cuando = proximaOcurrencia(f.fecha, f.anual, hoy);
      if (cuando && cuando <= sumarDias(hoy, VENTANA_FECHAS)) {
        hechos.push({ tipo: 'fecha', grupoId: g.id, circulo: g.nombre, fecha: cuando, titulo: f.titulo });
      }
    }

    const pendientes = (g.pendientes ?? []).filter(p => !p.saldado);
    return { g, miembros, hechos, pendientes };
  });

  const visibles = filtro ? grupos.filter(x => x.g.id === filtro) : grupos;
  const columnas = armarColumnas(visibles.flatMap(x => x.hechos), hoy);
  // Lo que ya pasó (y hoy) va arriba, del más reciente al más viejo. Lo que viene, aparte y en orden.
  const pasado = columnas.filter(c => c.fecha <= hoy);
  const futuro = columnas.filter(c => c.fecha > hoy).sort((a, b) => a.fecha.localeCompare(b.fecha));

  // Mensajes de WhatsApp que no son de ningún círculo, para asignarlos en el Inbox.
  const patrones = grupos
    .map(x => patronDe([x.g.nombre, ...x.miembros.flatMap(m => [m.nombre, m.apodo ?? ''])]))
    .filter((p): p is RegExp => Boolean(p));
  const sinCirculo = pendientesInbox
    .filter(i => !patrones.some(p => p.test(normalizar(`${i.texto} ${i.titulo ?? ''} ${i.remitente ?? ''}`))))
    .sort((a, b) => b.recibidoEn.localeCompare(a.recibidoEn))
    .slice(0, 4);

  // La columna guarda el id del mensaje y del grupo: acá se buscan los objetos reales.
  const agendar = (itemId: string, grupoId: string, propuesta: PropuestaFecha) => {
    const item = pendientesInbox.find(i => i.id === itemId);
    const grupo = fsGrupos.find(g => g.id === grupoId);
    if (item && grupo) onAgendar(item, grupo, propuesta);
  };

  const renderColumna = (c: Columna) => (
    <article key={c.fecha} className="g-opinion">
      <p className="g-firma">Opinión · Mis círculos</p>
      <p className="g-dia-columna">{fechaColumna(c.fecha)}</p>
      <h3 className="g-titular g-titular-principal">{c.titular}</h3>
      <p className="g-bajada">{c.bajada}</p>
      <div className="g-cuerpo">
        {c.parrafos.map((p, i) => (
          <p key={i}>
            {p.texto}
            {p.accion && (
              <>
                {' '}
                <button type="button" className="g-link"
                  style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => agendar(p.accion!.itemId, p.accion!.grupoId, p.accion!.propuesta)}>
                  Agendar
                </button>
              </>
            )}
          </p>
        ))}
      </div>
    </article>
  );

  return (
    <>
      <TituloSeccion titulo="Mis círculos" subtitulo="Opinión sobre tu vida social, día por día" idTitulo={idTitulo} />

      {grupos.length > 0 && (
        <nav className="g-chips" aria-label="Círculos" style={{ margin: '4px 0 18px' }}>
          <button type="button" className="g-chip" aria-pressed={filtro === null} onClick={() => setFiltro(null)}>Todos</button>
          {grupos.map(({ g }) => (
            <button key={g.id} type="button" className="g-chip" aria-pressed={filtro === g.id}
              onClick={() => setFiltro(filtro === g.id ? null : g.id)}>
              {g.icono ? `${g.icono} ` : ''}{g.nombre}
            </button>
          ))}
        </nav>
      )}

      {grupos.length === 0 && (
        <Vacio>Todavía no tenés círculos. Creá uno en el Cerebro (amigos, familia, cole) y va a aparecer acá.</Vacio>
      )}
      {grupos.length > 0 && columnas.length === 0 && (
        <Vacio>Esta semana no hay nada para comentar. Cuando pase algo en tus círculos, aparece acá.</Vacio>
      )}

      {pasado.map(renderColumna)}

      {futuro.length > 0 && (
        <>
          <p className="g-subrotulo">Lo que viene</p>
          {futuro.map(renderColumna)}
        </>
      )}

      {grupos.length > 0 && (
        <>
          <p className="g-subrotulo">Notas al pie</p>
          <ul className="g-filas">
            {grupos.map(({ g, miembros, pendientes }) => (
              <li key={g.id} className="g-fila" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <span className="g-fila-texto" style={{ whiteSpace: 'normal' }}>
                  <strong>{g.icono ? `${g.icono} ` : ''}{g.nombre}</strong>
                  {miembros.length > 0 && <> · {miembros.map(m => m.nombre).join(', ')}</>}
                  {pendientes.length > 0 && (
                    <span className="g-meta" style={{ display: 'block', margin: '2px 0 0' }}>
                      {pendientes.map(p => `${p.direccion === 'le_debo' ? 'le debés' : 'te debe'}: ${p.descripcion}`).join(' · ')}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {sinCirculo.length > 0 && (
        <>
          <p className="g-subrotulo">Por asignar</p>
          <p className="g-meta">Llegaron de WhatsApp y no son de ningún círculo. Asignalos desde el Inbox del Cerebro.</p>
          <ul className="g-filas">
            {sinCirculo.map(i => (
              <li key={i.id} className="g-fila" style={{ alignItems: 'flex-start' }}>
                <span className="g-fila-texto" style={{ whiteSpace: 'normal' }}>
                  {i.remitente && <strong>{quitarSufijo(i.remitente)}: </strong>}{corto(i.texto, 160)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
