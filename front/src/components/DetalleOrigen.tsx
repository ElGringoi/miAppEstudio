import { ChevronDown, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// Botón chevron para expandir/colapsar el detalle de una tarea o evento
export function ExpandToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button onClick={e => { e.stopPropagation(); onToggle(); }}
      aria-label={open ? 'Ocultar detalle' : 'Ver detalle'} aria-expanded={open}
      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
      <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', open && 'rotate-180')} />
    </button>
  );
}

// Panel desplegable con el detalle (qué es) y el origen (de dónde vino)
export function DetalleOrigenPanel({ open, detalle, origen }: { open: boolean; detalle?: string; origen?: string }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 cursor-default">
            {detalle && <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{detalle}</p>}
            {origen && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-violet-500">
                <Info className="w-3 h-3" /> Origen: <span className="normal-case tracking-normal">{origen}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
