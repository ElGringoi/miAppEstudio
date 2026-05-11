import React from 'react';
import { CheckCircle2, Trash2, Pencil, PlayCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { FSEjercicio } from '../types';
import { HOY } from '../utils/constants';
import { youtubeEmbedUrl, isImageUrl } from '../utils/helpers';

export const EjercicioRow = ({ ejercicio, onToggle, onDelete, onEdit }: {
  ejercicio: FSEjercicio; onToggle: () => void; onDelete: () => void; onEdit: () => void;
}) => {
  const [showMedia, setShowMedia] = React.useState(false);
  const done     = ejercicio.lastCompletedDate === HOY;
  const embedUrl = ejercicio.mediaUrl ? youtubeEmbedUrl(ejercicio.mediaUrl) : null;
  const isImg    = ejercicio.mediaUrl ? isImageUrl(ejercicio.mediaUrl) : false;
  return (
    <div className={cn('group rounded-2xl border-2 transition-all overflow-hidden',
      done ? 'border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-900/10'
           : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900')}>
      <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={onToggle}>
        <div className={cn('w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all',
          done ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' : 'border-slate-200 dark:border-slate-700')}>
          {done && <CheckCircle2 className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-bold text-sm', done && 'line-through text-slate-400')}>{ejercicio.nombre}</p>
          {(ejercicio.series || ejercicio.reps) && (
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              {ejercicio.series ? `${ejercicio.series} series` : ''}
              {ejercicio.series && ejercicio.reps ? ' × ' : ''}
              {ejercicio.reps ?? ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {ejercicio.mediaUrl && (
            <button onClick={e => { e.stopPropagation(); setShowMedia(v => !v); }}
              className={cn('p-2 rounded-xl transition-all', showMedia ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400')}>
              <PlayCircle className="w-4 h-4" />
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onEdit(); }}
            className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {ejercicio.notas && <p className="px-4 pb-3 text-[11px] text-slate-400 italic">{ejercicio.notas}</p>}
      {showMedia && embedUrl && (
        <div className="px-4 pb-4">
          <iframe src={embedUrl} className="w-full aspect-video rounded-xl border border-slate-100 dark:border-slate-800"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
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
