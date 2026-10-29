// "Mis círculos": qué está pasando en cada grupo (amigos, familia, cole…).
// Junta lo que llegó de WhatsApp sin asignar, las notas ya vinculadas al grupo,
// los eventos y fechas próximas, y los pendientes. No repite hábitos ni
// misiones: eso ya está en el resto de la app.

import type { FSEntradaDiario, FSEvento, FSGrupo, FSInboxItem, FSPersona } from '../../types';
import { sumarDias } from '../../utils/edicion';
import { proponerFecha, type PropuestaFecha } from '../../utils/inboxFecha';
import { Kicker, TituloSeccion, Vacio } from './Piezas';

const VENTANA_EVENTOS = 14;  // días
const VENTANA_FECHAS = 30;   // días

const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const recortar = (s: string, max: number) => (s.length > max ? s.slice(0, max).replace(/\s+\S*$/, '') + '…' : s);

const fechaCorta = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');

const quitarSufijo = (s: string) => s.replace(/\s*\(WhatsApp\)\s*$/i, '').trim();

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

/**
 * Términos con los que reconocer un grupo en un mensaje: su nombre y el de sus
 * integrantes. Son palabras completas, así "Nico" no coincide con "Nicolás".
 */
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

interface Linea { id: string; orden: string; fecha: string; de?: string; texto: string; item?: FSInboxItem }

interface Proximo { id: string; fecha: string; hora?: string; titulo: string; propuesta?: { item: FSInboxItem; datos: PropuestaFecha } }

export function PaginaCirculos({ fsGrupos, fsPersonas, fsInbox, fsEventos, fsEntradas, hoy, idTitulo, onAgendar }: Props) {
  const pendientesInbox = fsInbox.filter(i => !i.procesado);
  const limiteEventos = sumarDias(hoy, VENTANA_EVENTOS);
  const limiteFechas = sumarDias(hoy, VENTANA_FECHAS);
  const notasPorId = new Map(fsEntradas.map(e => [e.id, e]));

  // Para cada grupo: integrantes, qué de WhatsApp le corresponde y lo ya vinculado.
  const tarjetas = fsGrupos.map(g => {
    const miembros = fsPersonas.filter(p => p.grupos?.includes(g.id));
    const terminos = [g.nombre, ...miembros.flatMap(m => [m.nombre, m.apodo ?? ''])];
    const patron = patronDe(terminos);
    const coincide = (texto: string) => (patron ? patron.test(normalizar(texto)) : false);

    const whatsapp: Linea[] = pendientesInbox
      .filter(i => coincide(`${i.texto} ${i.titulo ?? ''} ${i.remitente ?? ''}`))
      .map(i => ({
        id: `in-${i.id}`, orden: i.recibidoEn, fecha: i.recibidoEn.slice(0, 10),
        de: i.remitente ? quitarSufijo(i.remitente) : undefined, texto: i.texto, item: i,
      }));

    const vinculadas: Linea[] = (g.links ?? [])
      .map(id => notasPorId.get(id))
      .filter((e): e is FSEntradaDiario => Boolean(e))
      .map(e => ({
        id: `nota-${e.id}`, orden: `${e.fecha}T12:00`, fecha: e.fecha,
        texto: e.titulo ?? e.contenido.split('\n')[0],
      }));

    const lineas = [...whatsapp, ...vinculadas].sort((a, b) => b.orden.localeCompare(a.orden));

    // Eventos del grupo (los agendados desde el inbox) y, para los viejos sin
    // grupo, los que mencionan el nombre de algún integrante.
    const eventos: Proximo[] = fsEventos
      .filter(e => e.fecha >= hoy && e.fecha <= limiteEventos && (e.grupoId ? e.grupoId === g.id : coincide(e.titulo)))
      .map(e => ({ id: e.id, fecha: e.fecha, hora: e.hora, titulo: e.titulo }));

    // Propuestas: mensajes sin procesar con una fecha (la del agente o la del texto).
    const propuestas: Proximo[] = whatsapp.flatMap(l => {
      if (!l.item) return [];
      const datos = l.item.fechaSugerida
        ? { fecha: l.item.fechaSugerida, hora: l.item.horaSugerida }
        : proponerFecha(l.item.texto, hoy);
      if (!datos || datos.fecha < hoy || datos.fecha > limiteEventos) return [];
      return [{ id: `p-${l.item.id}`, fecha: datos.fecha, hora: datos.hora, titulo: recortar(l.item.texto, 90), propuesta: { item: l.item, datos } }];
    });

    const proximos = [...eventos, ...propuestas]
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora ?? '').localeCompare(b.hora ?? ''))
      .slice(0, 4);

    const fechas = (g.fechasClave ?? [])
      .map(f => ({ f, cuando: proximaOcurrencia(f.fecha, f.anual, hoy) }))
      .filter((x): x is { f: typeof x.f; cuando: string } => Boolean(x.cuando) && (x.cuando as string) <= limiteFechas)
      .sort((a, b) => a.cuando.localeCompare(b.cuando));

    const pendientes = (g.pendientes ?? []).filter(p => !p.saldado);
    const ultima = lineas[0]?.orden ?? '';
    return { g, miembros, lineas, proximos, fechas, pendientes, ultima };
  });

  tarjetas.sort((a, b) => b.ultima.localeCompare(a.ultima) || a.g.nombre.localeCompare(b.g.nombre, 'es'));

  // Mensajes de WhatsApp que no son de ningún grupo: para asignarlos en el Inbox.
  const todosLosPatrones = tarjetas.map(t => patronDe([t.g.nombre, ...t.miembros.flatMap(m => [m.nombre, m.apodo ?? ''])])).filter((p): p is RegExp => Boolean(p));
  const sinCirculo = pendientesInbox
    .filter(i => !todosLosPatrones.some(p => p.test(normalizar(`${i.texto} ${i.titulo ?? ''} ${i.remitente ?? ''}`))))
    .sort((a, b) => b.recibidoEn.localeCompare(a.recibidoEn))
    .slice(0, 4);

  return (
    <>
      <TituloSeccion titulo="Mis círculos" subtitulo="Lo que está pasando en cada grupo" idTitulo={idTitulo} />

      {tarjetas.length === 0 && (
        <Vacio>Todavía no tenés grupos. Creá uno en el Cerebro (amigos, familia, cole) y lo vas a ver acá.</Vacio>
      )}

      {tarjetas.map(({ g, miembros, lineas, proximos, fechas, pendientes }) => (
        <article key={g.id} className="g-pieza">
          <Kicker>{miembros.length ? miembros.map(m => m.nombre).join(' · ') : 'Sin integrantes asignados'}</Kicker>
          <h3 className="g-titular g-titular-secundario">{g.icono ? `${g.icono} ` : ''}{g.nombre}</h3>
          {g.descripcion && <p className="g-bajada">{g.descripcion}</p>}

          {proximos.length > 0 && (
            <>
              <p className="g-subrotulo">Próximo</p>
              <ul className="g-filas">
                {proximos.map(p => (
                  <li key={p.id} className="g-fila" style={p.propuesta ? { flexWrap: 'wrap' } : undefined}>
                    <span className="g-fila-dia">{fechaCorta(p.fecha)}</span>
                    <span className="g-fila-hora">{p.hora ?? ''}</span>
                    <span className="g-fila-texto">{p.titulo}</span>
                    {p.propuesta && (
                      <button type="button" className="g-link" style={{ marginLeft: 'auto', background: 'none', border: 0, cursor: 'pointer' }}
                        onClick={() => onAgendar(p.propuesta!.item, g, p.propuesta!.datos)}>
                        Agendar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {fechas.length > 0 && (
            <>
              <p className="g-subrotulo">Fechas</p>
              <ul className="g-filas">
                {fechas.map(({ f, cuando }) => (
                  <li key={f.id} className="g-fila">
                    <span className="g-fila-dia">{fechaCorta(cuando)}</span>
                    <span className="g-fila-texto">{f.titulo}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="g-subrotulo">Lo último</p>
          {lineas.length === 0
            ? <Vacio>Nada nuevo de este grupo.</Vacio>
            : (
              <ul className="g-filas">
                {lineas.slice(0, 4).map(l => (
                  <li key={l.id} className="g-fila" style={{ alignItems: 'flex-start' }}>
                    <span className="g-fila-dia" style={{ fontSize: 14, minWidth: 64 }}>{fechaCorta(l.fecha)}</span>
                    <span className="g-fila-texto" style={{ whiteSpace: 'normal' }}>
                      {l.de && <strong>{l.de}: </strong>}{recortar(l.texto, 180)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

          {pendientes.length > 0 && (
            <>
              <p className="g-subrotulo">Pendientes</p>
              <ul className="g-filas">
                {pendientes.map(p => (
                  <li key={p.id} className="g-fila">
                    <span className="g-fila-texto">{p.descripcion}</span>
                    <span className="g-fila-chev">{p.direccion === 'le_debo' ? 'le debo' : 'me debe'}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </article>
      ))}

      {sinCirculo.length > 0 && (
        <>
          <p className="g-subrotulo">Por asignar</p>
          <p className="g-meta">Llegaron de WhatsApp y no son de ningún grupo. Asignalos desde el Inbox del Cerebro.</p>
          <ul className="g-filas">
            {sinCirculo.map(i => (
              <li key={i.id} className="g-fila" style={{ alignItems: 'flex-start' }}>
                <span className="g-fila-texto" style={{ whiteSpace: 'normal' }}>
                  {i.remitente && <strong>{quitarSufijo(i.remitente)}: </strong>}{recortar(i.texto, 160)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
