import { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import type { FSRoca } from '../types';

interface RocasWidgetProps {
  rocas: FSRoca[];
  onAgregar: (titulo: string) => Promise<void>;
  onActualizarProgreso: (id: string, progreso: number) => Promise<void>;
  onEliminar: (id: string) => Promise<void>;
}

export function RocasWidget({ rocas, onAgregar, onActualizarProgreso, onEliminar }: RocasWidgetProps) {
  const [nuevaRoca, setNuevaRoca] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoProgreso, setEditandoProgreso] = useState(0);

  async function agregar() {
    if (!nuevaRoca.trim() || rocas.length >= 3) return;
    setAgregando(true);
    try {
      await onAgregar(nuevaRoca);
      setNuevaRoca('');
    } finally {
      setAgregando(false);
    }
  }

  async function actualizarProgreso() {
    if (!editandoId) return;
    await onActualizarProgreso(editandoId, editandoProgreso);
    setEditandoId(null);
  }

  const puedeAgregar = rocas.length < 3;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white">
          🪨 Rocas de la semana
        </h3>
        <span className="text-xs text-slate-400">
          {rocas.length}/3
        </span>
      </div>

      <div className="space-y-2 mb-3">
        {rocas.map(roca => (
          <div key={roca.id} className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
            {editandoId === roca.id ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editandoProgreso}
                    onChange={e => setEditandoProgreso(parseInt(e.target.value) || 0)}
                    className="flex-1 px-2 py-1 rounded bg-white dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={actualizarProgreso} className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                    ✓
                  </button>
                  <button onClick={() => setEditandoId(null)} className="px-2 py-1 rounded bg-slate-400 hover:bg-slate-500 text-white text-xs font-bold">
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{roca.titulo}</p>
                    {roca.descripcion && <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{roca.descripcion}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditandoId(roca.id); setEditandoProgreso(roca.progreso); }}
                      className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEliminar(roca.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                      style={{ width: `${roca.progreso}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-8 text-right">
                    {roca.progreso}%
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {puedeAgregar && (
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="Nueva roca…"
            value={nuevaRoca}
            onChange={e => setNuevaRoca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregar()}
            disabled={agregando}
            className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            onClick={agregar}
            disabled={!nuevaRoca.trim() || agregando}
            className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
