import { useState } from 'react';
import type { FSPendiente, FSFechaClave, TipoFechaClave, Moneda, PendienteDireccion } from '../types';
import { cn } from '../lib/utils';
import { Plus, Trash2, Check, Pencil, X } from 'lucide-react';
import { MONEDA_META, TIPO_FECHA_META } from '../utils/constants';
import { proximaOcurrencia, saldoPendientes } from '../utils/helpers';

const MONEDAS: Moneda[] = ['ARS', 'USD', 'EUR', 'BRL', 'CLP', 'UYU'];

const tipoIcon = (t: TipoFechaClave) => TIPO_FECHA_META.find(x => x.id === t)?.icon ?? '📅';

function fmtMonto(monto: number, moneda?: string) {
  const sym = MONEDA_META[moneda ?? 'ARS']?.symbol ?? '$';
  return `${sym} ${monto.toLocaleString('es-AR')}`;
}

const INPUT = 'px-3 py-2 rounded-lg bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400';
const ICON_BTN = 'p-1 rounded text-slate-400 shrink-0 transition-colors';

/**
 * Arma un pendiente sin dejar `undefined` en ningún campo: Firestore rechaza
 * undefined a cualquier profundidad, así que monto y moneda van con spread
 * condicional DENTRO del objeto.
 */
function armarPendiente(
  base: Pick<FSPendiente, 'id' | 'saldado'> & Partial<Pick<FSPendiente, 'saldadoEn' | 'fecha'>>,
  descripcion: string, direccion: PendienteDireccion, monto: string, moneda: Moneda,
): FSPendiente {
  const montoNum = parseFloat(monto);
  return {
    id: base.id,
    descripcion: descripcion.trim(),
    direccion,
    saldado: base.saldado,
    ...(base.saldadoEn ? { saldadoEn: base.saldadoEn } : {}),
    ...(base.fecha ? { fecha: base.fecha } : {}),
    ...(Number.isFinite(montoNum) && montoNum > 0 ? { monto: montoNum, moneda } : {}),
  };
}

function toggleSaldado(p: FSPendiente): FSPendiente {
  const next: FSPendiente = { ...p, saldado: !p.saldado };
  // delete, no `= undefined`: Firestore rechaza undefined a cualquier nivel.
  if (next.saldado) next.saldadoEn = new Date().toISOString().slice(0, 10);
  else delete next.saldadoEn;
  return next;
}

// ─── Pendientes ───────────────────────────────────────────────────────────────

/**
 * Una fila de pendiente. Sin `onChange` es de solo lectura; con `onChange`
 * permite tildarla como saldada, editarla en el lugar y borrarla.
 */
function PendienteFila({ p, onChange, onDelete }: {
  p: FSPendiente;
  onChange?: (next: FSPendiente) => void;
  onDelete?: () => void;
}) {
  const [editando,  setEditando]  = useState(false);
  const [desc,      setDesc]      = useState(p.descripcion);
  const [direccion, setDireccion] = useState<PendienteDireccion>(p.direccion);
  const [monto,     setMonto]     = useState(Number.isFinite(p.monto) ? String(p.monto) : '');
  const [moneda,    setMoneda]    = useState<Moneda>(p.moneda ?? 'ARS');

  function abrirEdicion() {
    setDesc(p.descripcion); setDireccion(p.direccion);
    setMonto(Number.isFinite(p.monto) ? String(p.monto) : ''); setMoneda(p.moneda ?? 'ARS');
    setEditando(true);
  }

  function guardar() {
    if (!desc.trim() || !onChange) return;
    onChange(armarPendiente(p, desc, direccion, monto, moneda));
    setEditando(false);
  }

  if (editando) return (
    <div className="flex flex-wrap items-center gap-1.5 px-2 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-800">
      <button
        onClick={() => setDireccion(d => d === 'me_debe' ? 'le_debo' : 'me_debe')}
        className={cn('px-2.5 py-2 rounded-lg text-[10px] font-bold shrink-0',
          direccion === 'me_debe' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')}
      >{direccion === 'me_debe' ? 'ME DEBE' : 'LE DEBO'}</button>
      <input autoFocus className={cn(INPUT, 'flex-1 min-w-[120px]')} value={desc}
        onChange={e => setDesc(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') setEditando(false); }} />
      <input type="number" className={cn(INPUT, 'w-24')} placeholder="Monto" value={monto}
        onChange={e => setMonto(e.target.value)} />
      <select className={INPUT} value={moneda} onChange={e => setMoneda(e.target.value as Moneda)}>
        {MONEDAS.map(m => <option key={m} value={m}>{MONEDA_META[m].symbol}</option>)}
      </select>
      <button onClick={guardar} disabled={!desc.trim()} title="Guardar"
        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={() => setEditando(false)} title="Cancelar"
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
      p.saldado ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-slate-100 dark:bg-slate-800'
    )}>
      {onChange && (
        <button onClick={() => onChange(toggleSaldado(p))}
          title={p.saldado ? 'Marcar como pendiente' : 'Marcar como saldado'}
          className={cn(
            'w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors',
            p.saldado ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
          )}
        >
          {p.saldado && <Check className="w-3 h-3 text-white" />}
        </button>
      )}
      <span className={cn(
        'px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0',
        p.direccion === 'me_debe' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white',
        p.saldado && 'opacity-50'
      )}>
        {p.direccion === 'me_debe' ? 'ME DEBE' : 'LE DEBO'}
      </span>
      <span className={cn('flex-1 truncate text-slate-700 dark:text-slate-300', p.saldado && 'line-through opacity-50')}>
        {p.descripcion}
      </span>
      {Number.isFinite(p.monto) && (
        <span className={cn('font-bold text-slate-600 dark:text-slate-400 shrink-0 text-xs', p.saldado && 'opacity-50')}>
          {fmtMonto(p.monto!, p.moneda)}
        </span>
      )}
      {onChange && (
        <button onClick={abrirEdicion} title="Editar" className={cn(ICON_BTN, 'hover:text-blue-500')}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} title="Borrar" className={cn(ICON_BTN, 'hover:text-red-500')}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Lista de pendientes para la ficha de una persona o grupo. Si recibe
 * `onChange`, cada ítem se puede tildar, editar y borrar ahí mismo.
 */
export function PendientesList({ pendientes, onChange }: {
  pendientes: FSPendiente[];
  onChange?:  (next: FSPendiente[]) => void;
}) {
  if (pendientes.length === 0) return null;
  const saldo = saldoPendientes(pendientes);
  const ordenados = [...pendientes.filter(p => !p.saldado), ...pendientes.filter(p => p.saldado)];

  return (
    <div className="space-y-2">
      {Object.entries(saldo).filter(([, v]) => v !== 0).map(([moneda, v]) => (
        <div key={moneda} className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold mr-2',
          v > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
        )}>
          {v > 0 ? 'Me debe' : 'Le debo'} {fmtMonto(Math.abs(v), moneda)}
        </div>
      ))}

      <div className="space-y-1.5 mt-2">
        {ordenados.map(p => (
          <PendienteFila key={p.id} p={p}
            onChange={onChange && (next => onChange(pendientes.map(x => x.id === p.id ? next : x)))}
            onDelete={onChange && (() => {
              if (window.confirm(`¿Borrar "${p.descripcion}"?`)) onChange(pendientes.filter(x => x.id !== p.id));
            })}
          />
        ))}
      </div>
    </div>
  );
}

/** Editor del modo edición: agregar, tildar, editar y borrar pendientes. */
export function PendientesEditor({ pendientes, onChange }: {
  pendientes: FSPendiente[];
  onChange:   (next: FSPendiente[]) => void;
}) {
  const [desc,      setDesc]      = useState('');
  const [direccion, setDireccion] = useState<PendienteDireccion>('me_debe');
  const [monto,     setMonto]     = useState('');
  const [moneda,    setMoneda]    = useState<Moneda>('ARS');

  function agregar() {
    if (!desc.trim()) return;
    onChange([...pendientes, armarPendiente({ id: crypto.randomUUID(), saldado: false }, desc, direccion, monto, moneda)]);
    setDesc(''); setMonto('');
  }

  return (
    <div className="space-y-2">
      {pendientes.length > 0 && (
        <div className="space-y-1.5">
          {pendientes.map(p => (
            <PendienteFila key={p.id} p={p}
              onChange={next => onChange(pendientes.map(x => x.id === p.id ? next : x))}
              onDelete={() => onChange(pendientes.filter(x => x.id !== p.id))}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setDireccion(d => d === 'me_debe' ? 'le_debo' : 'me_debe')}
          className={cn(
            'px-2.5 py-2 rounded-lg text-[10px] font-bold shrink-0 transition-colors',
            direccion === 'me_debe' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          )}
        >
          {direccion === 'me_debe' ? 'ME DEBE' : 'LE DEBO'}
        </button>
        <input
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          placeholder="ej: le presté el taladro"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }}
        />
        <input
          type="number"
          className="w-24 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          placeholder="Monto"
          value={monto}
          onChange={e => setMonto(e.target.value)}
        />
        <select
          className="px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={moneda}
          onChange={e => setMoneda(e.target.value as Moneda)}
        >
          {MONEDAS.map(m => <option key={m} value={m}>{MONEDA_META[m].symbol}</option>)}
        </select>
        <button onClick={agregar} disabled={!desc.trim()}
          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[11px] text-slate-400">El monto es opcional — puede ser un favor, no plata.</p>
    </div>
  );
}

// ─── Fechas clave ─────────────────────────────────────────────────────────────

/** Una fila de fecha clave. Con `onChange` se puede editar en el lugar. */
function FechaFila({ f, onChange, onDelete }: {
  f: FSFechaClave;
  onChange?: (next: FSFechaClave) => void;
  onDelete?: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [titulo,   setTitulo]   = useState(f.titulo);
  const [tipo,     setTipo]     = useState<TipoFechaClave>(f.tipo);
  const [fecha,    setFecha]    = useState(f.fecha);
  const [anual,    setAnual]    = useState(f.anual);
  const prox = proximaOcurrencia(f.fecha, f.anual);

  function abrirEdicion() {
    setTitulo(f.titulo); setTipo(f.tipo); setFecha(f.fecha); setAnual(f.anual);
    setEditando(true);
  }

  function guardar() {
    if (!titulo.trim() || !fecha || !onChange) return;
    onChange({ id: f.id, titulo: titulo.trim(), tipo, fecha, anual });
    setEditando(false);
  }

  if (editando) return (
    <div className="flex flex-wrap items-center gap-1.5 px-2 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-800">
      <select className={INPUT} value={tipo} onChange={e => setTipo(e.target.value as TipoFechaClave)}>
        {TIPO_FECHA_META.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
      </select>
      <input autoFocus className={cn(INPUT, 'flex-1 min-w-[110px]')} value={titulo}
        onChange={e => setTitulo(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') setEditando(false); }} />
      <input type="date" className={INPUT} value={fecha} onChange={e => setFecha(e.target.value)} />
      <button onClick={() => setAnual(a => !a)} title="Se repite todos los años"
        className={cn('px-3 py-2 rounded-lg text-xs font-bold',
          anual ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500')}
      >Anual</button>
      <button onClick={guardar} disabled={!titulo.trim() || !fecha} title="Guardar"
        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white">
        <Check className="w-4 h-4" />
      </button>
      <button onClick={() => setEditando(false)} title="Cancelar"
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm">
      <span className="shrink-0">{tipoIcon(f.tipo)}</span>
      <span className="flex-1 truncate text-slate-700 dark:text-slate-300">{f.titulo}</span>
      {prox ? (
        <span className={cn('text-xs font-bold shrink-0',
          prox.dias <= 7 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400')}>
          {prox.dias === 0 ? '¡hoy!' : prox.dias === 1 ? 'mañana' : `en ${prox.dias} días`}
        </span>
      ) : (
        <span className="text-xs text-slate-400 shrink-0">{f.fecha}</span>
      )}
      {onChange && (
        <button onClick={abrirEdicion} title="Editar" className={cn(ICON_BTN, 'hover:text-blue-500')}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} title="Borrar" className={cn(ICON_BTN, 'hover:text-red-500')}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Fechas clave en la ficha. Sin `onChange` son chips de solo lectura; con
 * `onChange` cada una se puede editar y borrar ahí mismo.
 */
export function FechasClaveList({ fechas, onChange }: {
  fechas: FSFechaClave[];
  onChange?: (next: FSFechaClave[]) => void;
}) {
  if (fechas.length === 0) return null;

  if (onChange) return (
    <div className="space-y-1.5">
      {fechas.map(f => (
        <FechaFila key={f.id} f={f}
          onChange={next => onChange(fechas.map(x => x.id === f.id ? next : x))}
          onDelete={() => { if (window.confirm(`¿Borrar "${f.titulo}"?`)) onChange(fechas.filter(x => x.id !== f.id)); }}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {fechas.map(f => {
        const prox = proximaOcurrencia(f.fecha, f.anual);
        return (
          <span key={f.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
          >
            {tipoIcon(f.tipo)} {f.titulo}
            {prox && (
              <span className={cn(
                'font-bold',
                prox.dias <= 7 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
              )}>
                {prox.dias === 0 ? '¡hoy!' : prox.dias === 1 ? 'mañana' : `en ${prox.dias} días`}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** Editor del modo edición: agregar, editar y borrar fechas clave. */
export function FechasClaveEditor({ fechas, onChange }: {
  fechas:   FSFechaClave[];
  onChange: (next: FSFechaClave[]) => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [tipo,   setTipo]   = useState<TipoFechaClave>('cumple');
  const [fecha,  setFecha]  = useState('');
  const [anual,  setAnual]  = useState(true);

  function agregar() {
    if (!titulo.trim() || !fecha) return;
    onChange([...fechas, { id: crypto.randomUUID(), titulo: titulo.trim(), tipo, fecha, anual }]);
    setTitulo(''); setFecha('');
  }

  return (
    <div className="space-y-2">
      {fechas.length > 0 && (
        <div className="space-y-1.5">
          {fechas.map(f => (
            <FechaFila key={f.id} f={f}
              onChange={next => onChange(fechas.map(x => x.id === f.id ? next : x))}
              onDelete={() => onChange(fechas.filter(x => x.id !== f.id))}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <select
          className="px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={tipo}
          onChange={e => setTipo(e.target.value as TipoFechaClave)}
        >
          {TIPO_FECHA_META.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
        </select>
        <input
          className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          placeholder="ej: Cumple de Marce"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
        />
        <input
          type="date"
          className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
        />
        <button
          onClick={() => setAnual(a => !a)}
          title="Se repite todos los años"
          className={cn(
            'px-3 py-2 rounded-lg text-xs font-bold transition-colors',
            anual ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          )}
        >
          Anual
        </button>
        <button onClick={agregar} disabled={!titulo.trim() || !fecha}
          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
