import { cn } from '../lib/utils';

export function MisionCard({ title, progress, descripcion, epica }: {
  title:        string;
  progress:     number;
  descripcion?: string;
  epica?:       boolean;
}) {
  return (
    <div className={cn(
      'flex flex-col gap-3 p-3.5 rounded-lg bg-surface-container-high',
      epica && 'shadow-[0_0_16px_-4px_rgba(221,183,255,0.25)]'
    )}>
      <span className={cn(
        'self-start flex items-center gap-1.5 px-2 py-0.5 rounded-full font-label text-[10px] font-bold uppercase tracking-wider',
        epica ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-secondary'
      )}>
        {epica ? '⚔️ Misión épica' : '🛡️ Misión'}
      </span>
      <div className="flex flex-col min-w-0">
        <h4 className="text-base font-bold text-on-surface leading-snug">{title}</h4>
        {descripcion && <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{descripcion}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <div className="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden">
          <div className={cn('h-full rounded-full', epica ? 'bg-tertiary' : 'bg-secondary')} style={{ width: `${progress}%` }} />
        </div>
        <span className="font-label text-[10px] text-on-surface-variant tabular-nums">Progreso: {progress}%</span>
      </div>
    </div>
  );
}
