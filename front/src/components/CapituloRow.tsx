import React from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { FSCapitulo } from '../types';

export const CapituloRow = ({ cap, onToggle, onSave }: {
  cap: FSCapitulo; onToggle: () => void; onSave: (notas: string) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [notas, setNotas] = React.useState(cap.notas ?? '');
  return (
    <div className={cn('rounded-xl border transition-all', cap.leido ? 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900')}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div onClick={onToggle} className={cn('w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all',
          cap.leido ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400')}>
          {cap.leido && <CheckCircle2 className="w-3.5 h-3.5" />}
        </div>
        <p className={cn('flex-1 text-sm font-medium', cap.leido && 'line-through text-slate-400')}>
          Cap. {cap.numero}{cap.titulo ? ` — ${cap.titulo}` : ''}
        </p>
        {cap.notas && <span className="text-[10px] text-slate-400 italic">con nota</span>}
        <button onClick={() => setOpen(v => !v)} className="text-slate-400 hover:text-blue-500 transition-colors p-1">
          <ChevronRight className={cn('w-4 h-4 transition-transform', open && 'rotate-90')} />
        </button>
      </div>
      {open && (
        <div className="px-4 pb-3">
          <textarea value={notas} onChange={e => setNotas(e.target.value)}
            onBlur={() => onSave(notas)} placeholder="Anotaciones del capítulo..."
            className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none min-h-[80px]" />
        </div>
      )}
    </div>
  );
};
