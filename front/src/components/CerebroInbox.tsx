import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { FSInboxItem, InboxDestino, InboxOrigen, FSPersona, FSGrupo } from '../types';
import { cn } from '../lib/utils';
import { Send, Trash2, ExternalLink, Inbox, CheckCircle2 } from 'lucide-react';
import { CerebroLayout, PanelActions, CerebroVacio } from './CerebroLayout';

const ORIGEN: Record<InboxOrigen, { icon: string; label: string }> = {
  manual: { icon: '✍️', label: 'Captura' },
  agente: { icon: '🤖', label: 'Agente' },
  gmail:  { icon: '✉️', label: 'Gmail' },
};

const DESTINOS: { id: InboxDestino; icon: string; label: string }[] = [
  { id: 'nota',    icon: '📝', label: 'Nota' },
  { id: 'idea',    icon: '💡', label: 'Idea' },
  { id: 'tarea',   icon: '✅', label: 'Tarea' },
  { id: 'mision',  icon: '🎯', label: 'Misión' },
  { id: 'persona', icon: '👤', label: 'Persona' },
  { id: 'grupo',   icon: '👥', label: 'Grupo' },
];

const destinoLabel = (d?: InboxDestino) => DESTINOS.find(x => x.id === d);

function hace(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(min)) return '';
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

/** Primera línea del texto, para la lista cuando el ítem no tiene título. */
const resumen = (it: FSInboxItem) => it.titulo || it.texto.split('\n')[0].slice(0, 80);

interface Props {
  header:      ReactNode;
  inbox:       FSInboxItem[];
  personas:    FSPersona[];
  grupos:      FSGrupo[];
  onCapturar:  (texto: string) => Promise<void>;
  onProcesar:  (item: FSInboxItem, destino: InboxDestino, opts: { titulo: string; texto: string; fecha?: string; targetId?: string }) => Promise<void>;
  onBorrar:    (id: string) => Promise<void>;
}

export function CerebroInbox({ header, inbox, personas, grupos, onCapturar, onProcesar, onBorrar }: Props) {
  const [verProcesados, setVerProcesados] = useState(false);
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [showRight,     setShowRight]     = useState(false);
  const [captura,       setCaptura]       = useState('');
  const [ocupado,       setOcupado]       = useState(false);

  // Formulario de procesado del ítem abierto.
  const [destino,  setDestino]  = useState<InboxDestino | null>(null);
  const [titulo,   setTitulo]   = useState('');
  const [texto,    setTexto]    = useState('');
  const [fecha,    setFecha]    = useState(new Date().toISOString().slice(0, 10));
  const [targetId, setTargetId] = useState('');

  const ordenados = useMemo(
    () => [...inbox].sort((a, b) => b.recibidoEn.localeCompare(a.recibidoEn)),
    [inbox]
  );
  const pendientes = ordenados.filter(i => !i.procesado);
  const procesados = ordenados.filter(i =>  i.procesado);
  const lista = verProcesados ? procesados : pendientes;
  const selected = inbox.find(i => i.id === selectedId) ?? null;

  function abrir(it: FSInboxItem) {
    setSelectedId(it.id);
    setShowRight(true);
    setDestino(null);
    setTitulo(it.titulo ?? '');
    setTexto(it.texto);
    setTargetId('');
  }

  async function capturar() {
    if (!captura.trim()) return;
    const t = captura;
    setCaptura('');
    await onCapturar(t);
  }

  async function procesar() {
    if (!selected || !destino) return;
    setOcupado(true);
    try {
      await onProcesar(selected, destino, { titulo, texto, fecha, targetId });
      // Pasa solo al siguiente pendiente: procesar un inbox es ir uno tras otro.
      const siguiente = pendientes.find(i => i.id !== selected.id);
      if (siguiente) abrir(siguiente);
      else { setSelectedId(null); setShowRight(false); }
    } finally { setOcupado(false); }
  }

  async function borrar(it: FSInboxItem) {
    if (!window.confirm(`¿Borrar "${resumen(it)}" del inbox?`)) return;
    await onBorrar(it.id);
    if (selectedId === it.id) { setSelectedId(null); setShowRight(false); }
  }

  const necesitaTarget = destino === 'persona' || destino === 'grupo';
  const opcionesTarget = destino === 'persona'
    ? [...personas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(p => ({ id: p.id, label: `${p.avatar || '👤'} ${p.nombre}` }))
    : [...grupos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(g => ({ id: g.id, label: `${g.icono || '👥'} ${g.nombre}` }));
  const puedeProcesar = !!destino && (titulo.trim() || texto.trim()) && (!necesitaTarget || !!targetId) && !ocupado;

  // ── Panel izquierdo ────────────────────────────────────────────────────────

  const left = (
    <>
      {/* Captura rápida */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex gap-1.5">
          <input
            className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Anotá algo rápido…"
            value={captura}
            onChange={e => setCaptura(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') capturar(); }}
          />
          <button onClick={capturar} disabled={!captura.trim()} title="Guardar en el inbox"
            className="px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-2 border-b border-slate-100 dark:border-slate-800">
        {([['pendientes', false, pendientes.length], ['procesados', true, procesados.length]] as const).map(([label, val, n]) => (
          <button key={label} onClick={() => setVerProcesados(val)}
            className={cn('flex-1 px-2 py-1 rounded-md text-xs font-bold capitalize transition-all',
              verProcesados === val ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}
          >{label} · {n}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {lista.length === 0 ? (
          <p className="text-center text-slate-400 text-sm mt-10 px-4">
            {verProcesados ? 'Todavía no procesaste nada.' : 'Inbox vacío. 🎉'}
          </p>
        ) : lista.map(it => (
          <div key={it.id}
            className={cn(
              'group flex items-start gap-1 pr-2 border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
              selectedId === it.id && 'bg-blue-50 dark:bg-blue-900/20 border-l-[3px] border-l-blue-500'
            )}
          >
            <button onClick={() => abrir(it)} className="flex-1 min-w-0 text-left pl-4 py-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0" title={ORIGEN[it.origen]?.label}>{ORIGEN[it.origen]?.icon ?? '📥'}</span>
                <span className={cn('text-sm truncate flex-1', it.procesado ? 'text-slate-400' : 'font-semibold text-slate-800 dark:text-slate-100')}>
                  {resumen(it)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 ml-6 text-[11px] text-slate-400">
                {it.remitente && <span className="truncate max-w-[50%]">{it.remitente}</span>}
                {it.remitente && <span>·</span>}
                <span className="shrink-0">{hace(it.recibidoEn)}</span>
                {it.procesado && destinoLabel(it.procesadoComo) && (
                  <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-bold">
                    {destinoLabel(it.procesadoComo)!.icon} {destinoLabel(it.procesadoComo)!.label}
                  </span>
                )}
              </div>
            </button>
            <button onClick={() => borrar(it)} title="Borrar"
              className="mt-2.5 p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );

  // ── Panel derecho ──────────────────────────────────────────────────────────

  const right = !selected ? (
    <CerebroVacio
      icono="📥"
      titulo="Inbox"
      texto="Todo lo que entra sin clasificar: lo que anotás al paso, y lo que trae tu agente de tus mensajes y tu Gmail. Abrí un ítem y decidí qué es."
    />
  ) : (
    <div className="flex flex-col h-full">
      <PanelActions onBack={() => setShowRight(false)}>
        <button onClick={() => borrar(selected)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </PanelActions>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
            {ORIGEN[selected.origen]?.icon} {ORIGEN[selected.origen]?.label}
          </span>
          {selected.remitente && <span>{selected.remitente}</span>}
          <span>· {new Date(selected.recibidoEn).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          {selected.url && (
            <a href={selected.url} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 text-blue-500 hover:underline">
              Abrir original <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {selected.procesado ? (
          <>
            {selected.titulo && <h1 className="text-xl font-black text-slate-900 dark:text-white">{selected.titulo}</h1>}
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selected.texto}</p>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Procesado como {destinoLabel(selected.procesadoComo)?.label.toLowerCase() ?? '—'}
              {selected.procesadoEn && ` el ${new Date(selected.procesadoEn).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`}
            </div>
          </>
        ) : (
          <>
            <input
              className="w-full text-xl font-black bg-transparent outline-none border-b-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 pb-2 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="Título (opcional)"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
            />
            <textarea
              className="w-full px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={{ minHeight: '140px' }}
              value={texto}
              onChange={e => setTexto(e.target.value)}
            />

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">¿Qué es?</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {DESTINOS.map(d => (
                  <button key={d.id} onClick={() => { setDestino(d.id); setTargetId(''); }}
                    className={cn('flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-bold transition-all border',
                      destino === d.id
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400')}
                  >
                    <span className="text-lg">{d.icon}</span>{d.label}
                  </button>
                ))}
              </div>
            </div>

            {destino === 'tarea' && (
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                Para el día
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
            )}

            {necesitaTarget && (
              opcionesTarget.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Todavía no hay {destino === 'persona' ? 'personas' : 'grupos'} cargados en el Cerebro.
                </p>
              ) : (
                <select value={targetId} onChange={e => setTargetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Elegí {destino === 'persona' ? 'una persona' : 'un grupo'}…</option>
                  {opcionesTarget.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              )
            )}

            {destino && (
              <button onClick={procesar} disabled={!puedeProcesar}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-sm transition-colors">
                <Inbox className="w-4 h-4" />
                {ocupado ? 'Guardando…' : `Guardar como ${destinoLabel(destino)!.label.toLowerCase()}`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return <CerebroLayout header={header} showRight={showRight} left={left} right={right} />;
}
