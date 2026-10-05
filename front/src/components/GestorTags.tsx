import { useMemo, useState } from 'react';
import type { FSEntradaDiario, FSPersona, FSGrupo } from '../types';
import { Pencil, Trash2, Check, X, Tag } from 'lucide-react';
import { Modal, ModalHeader } from './Modal';

interface Props {
  open:        boolean;
  onClose:     () => void;
  entradas:    FSEntradaDiario[];
  personas:    FSPersona[];
  grupos:      FSGrupo[];
  /** `nuevo` = null borra el tag. Renombrar a uno existente los fusiona. */
  onRenombrar: (viejo: string, nuevo: string | null) => Promise<void>;
}

/**
 * Todos los tags del Cerebro (notas, personas y grupos) con cuántas veces se
 * usa cada uno, para renombrarlos o borrarlos en todos lados de una vez.
 * La comparación es exacta: `Laburo` y `laburo` son tags distintos, y este
 * panel es justamente donde se unifican.
 */
export function GestorTags({ open, onClose, entradas, personas, grupos, onRenombrar }: Props) {
  const [editando, setEditando] = useState<string | null>(null);
  const [valor,    setValor]    = useState('');
  const [ocupado,  setOcupado]  = useState(false);

  const tags = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const x of [...entradas, ...personas, ...grupos]) {
      for (const t of x.tags ?? []) cuenta.set(t, (cuenta.get(t) ?? 0) + 1);
    }
    return [...cuenta.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es', { sensitivity: 'base' }));
  }, [entradas, personas, grupos]);

  async function aplicar(viejo: string, nuevo: string | null) {
    setOcupado(true);
    try { await onRenombrar(viejo, nuevo); setEditando(null); }
    finally { setOcupado(false); }
  }

  function guardar(viejo: string) {
    const destino = valor.trim().replace(/^#/, '');
    if (!destino || destino === viejo) { setEditando(null); return; }
    const existe = tags.some(([t]) => t === destino);
    if (existe && !window.confirm(`#${destino} ya existe. ¿Fusionar #${viejo} dentro de #${destino}?`)) return;
    aplicar(viejo, destino);
  }

  function borrar(tag: string, n: number) {
    if (!window.confirm(`¿Borrar #${tag}? Se saca de ${n} lugar${n > 1 ? 'es' : ''}. Las notas no se borran.`)) return;
    aplicar(tag, null);
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg p-6">
      <ModalHeader title={<><Tag className="w-5 h-5 text-blue-500" /> Tags</>} onClose={onClose} />
      <p className="text-xs text-slate-400 -mt-3 mb-4">
        Renombrar o borrar un tag lo cambia en todas las notas, personas y grupos.
        Si lo renombrás a uno que ya existe, se fusionan.
      </p>

      {tags.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">Todavía no hay tags.</p>
      ) : (
        <div className="max-h-[55vh] overflow-y-auto -mx-2 px-2 space-y-1">
          {tags.map(([tag, n]) => editando === tag ? (
            <div key={tag} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-800">
              <span className="text-slate-400 pl-1">#</span>
              <input autoFocus value={valor} disabled={ocupado}
                onChange={e => setValor(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') guardar(tag); if (e.key === 'Escape') setEditando(null); }}
                className="flex-1 min-w-0 px-2 py-1.5 rounded-md bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={() => guardar(tag)} disabled={ocupado} title="Guardar"
                className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditando(null)} disabled={ocupado} title="Cancelar"
                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div key={tag} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-700 dark:text-slate-200">#{tag}</span>
              <span className="text-[10px] font-bold text-slate-400 shrink-0">{n} uso{n > 1 ? 's' : ''}</span>
              <button onClick={() => { setEditando(tag); setValor(tag); }} disabled={ocupado} title="Renombrar"
                className="p-1.5 rounded-md text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => borrar(tag, n)} disabled={ocupado} title="Borrar"
                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
