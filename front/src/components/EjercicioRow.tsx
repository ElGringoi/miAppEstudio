import React from 'react';
import { CheckCircle2, Trash2, Pencil, PlayCircle, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import type { FSEjercicio, SetLog } from '../types';
import { getToday } from '../utils/constants';
import { youtubeEmbedUrl, isImageUrl } from '../utils/helpers';

export const EjercicioRow = ({ ejercicio, onToggle, onDelete, onEdit, onUpdateSets, onSelect, isActive }: {
  ejercicio: FSEjercicio;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onUpdateSets?: (sets: SetLog[]) => void;
  onSelect?: () => void;
  isActive?: boolean;
}) => {
  const [showMedia, setShowMedia] = React.useState(false);
  const [showSets, setShowSets]   = React.useState(false);
  const done     = ejercicio.lastCompletedDate === getToday();
  const embedUrl = ejercicio.mediaUrl ? youtubeEmbedUrl(ejercicio.mediaUrl) : null;
  const isImg    = ejercicio.mediaUrl ? isImageUrl(ejercicio.mediaUrl) : false;

  const defaultSets = React.useMemo<SetLog[]>(() =>
    Array.from({ length: ejercicio.series ?? 3 }, () => ({
      peso: 0,
      reps: parseInt((ejercicio.reps ?? '10').split('-')[0]),
      done: false,
    })),
  [ejercicio.series, ejercicio.reps]);

  const [sets, setSets] = React.useState<SetLog[]>(() =>
    ejercicio.setsLog?.length ? ejercicio.setsLog : defaultSets
  );

  // Sync when setsLog changes externally (e.g. different day reset)
  const prevLogRef = React.useRef(ejercicio.setsLog);
  React.useEffect(() => {
    if (ejercicio.setsLog !== prevLogRef.current) {
      prevLogRef.current = ejercicio.setsLog;
      setSets(ejercicio.setsLog?.length ? ejercicio.setsLog : defaultSets);
    }
  }, [ejercicio.setsLog, defaultSets]);

  function updateSet(i: number, field: keyof SetLog, value: number | boolean) {
    const next = sets.map((s, j) => j === i ? { ...s, [field]: value } : s);
    setSets(next);
    onUpdateSets?.(next);
  }

  const doneSets  = sets.filter(s => s.done).length;
  const totalSets = sets.length;

  return (
    <div
      className={cn(
        'group rounded-2xl border-2 transition-all overflow-hidden',
        isActive
          ? 'border-red-400/60 dark:border-red-500/50 shadow-lg shadow-red-500/10'
          : done
            ? 'border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-900/10'
            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900',
      )}
      onMouseEnter={onSelect}
    >
      {/* ── Header row ── */}
      <div className="flex items-center gap-3 p-4">
        {/* Complete toggle */}
        <button
          onClick={onToggle}
          className={cn(
            'w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all',
            done
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'border-slate-200 dark:border-slate-700 hover:border-blue-400',
          )}
        >
          {done && <CheckCircle2 className="w-5 h-5" />}
        </button>

        {/* Name + meta — click to expand sets */}
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => setShowSets(v => !v)}
        >
          <p className={cn('font-bold text-sm', done && 'line-through text-slate-400')}>
            {ejercicio.nombre}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {(ejercicio.series || ejercicio.reps) && (
              <span className="text-[10px] font-bold text-slate-400">
                {ejercicio.series ? `${ejercicio.series} series` : ''}
                {ejercicio.series && ejercicio.reps ? ' × ' : ''}
                {ejercicio.reps ?? ''}
              </span>
            )}
            {totalSets > 0 && (
              <span className={cn(
                'text-[10px] font-black px-1.5 py-0.5 rounded-full',
                doneSets === totalSets
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                  : doneSets > 0
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400',
              )}>
                {doneSets}/{totalSets} ✓
              </span>
            )}
          </div>
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {ejercicio.mediaUrl && (
            <button
              onClick={e => { e.stopPropagation(); setShowMedia(v => !v); }}
              className={cn('p-2 rounded-xl transition-all',
                showMedia ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400')}
            >
              <PlayCircle className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSets(v => !v)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', showSets && 'rotate-180')} />
          </button>
        </div>
      </div>

      {ejercicio.notas && (
        <p className="px-4 pb-2 text-[11px] text-slate-400 italic">{ejercicio.notas}</p>
      )}

      {/* ── Sets table ── */}
      {showSets && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 pb-2 w-10">SET</th>
                <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 pb-2">KG</th>
                <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 pb-2">REPS</th>
                <th className="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 pb-2 w-10">✓</th>
              </tr>
            </thead>
            <tbody className="space-y-1">
              {sets.map((set, i) => (
                <tr key={i} className={cn('transition-colors', set.done && 'opacity-60')}>
                  <td className="py-1 pr-2">
                    <span className="text-[11px] font-black text-slate-500">{i + 1}</span>
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="number"
                      min={0}
                      step={2.5}
                      value={set.peso || ''}
                      placeholder="0"
                      onChange={e => updateSet(i, 'peso', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="number"
                      min={1}
                      value={set.reps || ''}
                      placeholder="0"
                      onChange={e => updateSet(i, 'reps', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </td>
                  <td className="py-1 text-center">
                    <button
                      onClick={() => updateSet(i, 'done', !set.done)}
                      className={cn(
                        'w-7 h-7 rounded-lg border-2 flex items-center justify-center mx-auto transition-all',
                        set.done
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400',
                      )}
                    >
                      {set.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add set button */}
          <button
            onClick={() => {
              const last = sets[sets.length - 1];
              const next = [...sets, { peso: last?.peso ?? 0, reps: last?.reps ?? 10, done: false }];
              setSets(next);
              onUpdateSets?.(next);
            }}
            className="mt-2 w-full py-1.5 text-[10px] font-black text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-400 hover:text-blue-500 transition-all"
          >
            + Serie
          </button>
        </div>
      )}

      {/* ── Media embed ── */}
      {showMedia && embedUrl && (
        <div className="px-4 pb-4">
          <iframe
            src={embedUrl}
            className="w-full aspect-video rounded-xl border border-slate-100 dark:border-slate-800"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {showMedia && isImg && ejercicio.mediaUrl && (
        <div className="px-4 pb-4">
          <img src={ejercicio.mediaUrl} alt={ejercicio.nombre} className="w-full max-h-72 object-cover rounded-xl" />
        </div>
      )}
    </div>
  );
};
