import { useState } from 'react';
import type { FSPendiente, FSFechaClave, TipoFechaClave, Moneda } from '../types';
import { cn } from '../lib/utils';
import { Plus, Trash2, Check } from 'lucide-react';
import { MONEDA_META, TIPO_FECHA_META } from '../utils/constants';
import { proximaOcurrencia, saldoPendientes } from '../utils/helpers';

const MONEDAS: Moneda[] = ['ARS', 'USD', 'EUR', 'BRL', 'CLP', 'UYU'];

const tipoIcon = (t: TipoFechaClave) => TIPO_FECHA_META.find(x => x.id === t)?.icon ?? '📅';

function fmtMonto(monto: number, moneda?: string) {
  const sym = MONEDA_META[moneda ?? 'ARS']?.symbol ?? '$';
  return `${sym} ${monto.toLocaleString('es-AR')}`;
}

// ─── Pendientes ───────────────────────────────────────────────────────────────

/** Vista de solo lectura: se usa en la ficha de una persona o grupo. */
export function PendientesList({ pendientes, onToggle }: {
  pendientes: FSPendiente[];
  onToggle?:  (id: string) => void;
}) {
  if (pendientes.length === 0) return null;
  const saldo = saldoPendientes(pendientes);
  const activos = pendientes.filter(p => !p.saldado);
  const saldados = pendientes.filter(p => p.saldado);

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
        {[...activos, ...saldados].map(p => (
          <div key={p.id} className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            p.saldado ? 'bg-slate-50 dark:bg-slate-800/50 opacity-50' : 'bg-slate-100 dark:bg-slate-800'
          )}>
            {onToggle && (
              <button onClick={() => onToggle(p.id)}
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
              p.direccion === 'me_debe'
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white'
            )}>
              {p.direccion === 'me_debe' ? 'ME DEBE' : 'LE DEBO'}
            </span>
            <span className={cn('flex-1 text-slate-700 dark:text-slate-300', p.saldado && 'line-through')}>
              {p.descripcion}
            </span>
            {Number.isFinite(p.monto) && (
              <span className="font-bold text-slate-600 dark:text-slate-400 shrink-0">
                {fmtMonto(p.monto!, p.moneda)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Editor: agregar, tildar y borrar pendientes. */
export function PendientesEditor({ pendientes, onChange }: {
  pendientes: FSPendiente[];
  onChange:   (next: FSPendiente[]) => void;
}) {
  const [desc,      setDesc]      = useState('');
  const [direccion, setDireccion] = useState<'le_debo' | 'me_debe'>('me_debe');
  const [monto,     setMonto]     = useState('');
  const [moneda,    setMoneda]    = useState<Moneda>('ARS');

  function agregar() {
    if (!desc.trim()) return;
    const montoNum = parseFloat(monto);
    // El conditional spread va ADENTRO del objeto: Firestore rechaza undefined
    // a cualquier profundidad, así que `monto: undefined` rompería el guardado.
    const nuevo: FSPendiente = {
      id: crypto.randomUUID(),
      descripcion: desc.trim(),
      direccion,
      saldado: false,
      ...(Number.isFinite(montoNum) && montoNum > 0 ? { monto: montoNum, moneda } : {}),
    };
    onChange([...pendientes, nuevo]);
    setDesc(''); setMonto('');
  }

  function toggle(id: string) {
    onChange(pendientes.map(p => {
      if (p.id !== id) return p;
      const next: FSPendiente = { ...p, saldado: !p.saldado };
      // delete, no `= undefined`: Firestore rechaza undefined a cualquier nivel.
      if (next.saldado) next.saldadoEn = new Date().toISOString().slice(0, 10);
      else delete next.saldadoEn;
      return next;
    }));
  }

  return (
    <div className="space-y-2">
      {pendientes.length > 0 && (
        <div className="space-y-1.5">
          {pendientes.map(p => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm">
              <button onClick={() => toggle(p.id)}
                className={cn(
                  'w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors',
                  p.saldado ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                )}
              >
                {p.saldado && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0',
                p.direccion === 'me_debe' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              )}>
                {p.direccion === 'me_debe' ? 'ME DEBE' : 'LE DEBO'}
              </span>
              <span className={cn('flex-1 truncate text-slate-700 dark:text-slate-300', p.saldado && 'line-through opacity-60')}>
                {p.descripcion}
              </span>
              {Number.isFinite(p.monto) && (
                <span className="font-bold text-slate-600 dark:text-slate-400 shrink-0 text-xs">
                  {fmtMonto(p.monto!, p.moneda)}
                </span>
              )}
              <button onClick={() => onChange(pendientes.filter(x => x.id !== p.id))}
                className="text-slate-400 hover:text-red-500 shrink-0 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
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

export function FechasClaveList({ fechas }: { fechas: FSFechaClave[] }) {
  if (fechas.length === 0) return null;
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
            <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm">
              <span className="shrink-0">{tipoIcon(f.tipo)}</span>
              <span className="flex-1 truncate text-slate-700 dark:text-slate-300">{f.titulo}</span>
              <span className="text-xs text-slate-400 shrink-0">
                {f.fecha}{f.anual ? ' · anual' : ''}
              </span>
              <button onClick={() => onChange(fechas.filter(x => x.id !== f.id))}
                className="text-slate-400 hover:text-red-500 shrink-0 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
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
