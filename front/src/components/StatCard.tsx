import { cn } from '../lib/utils';
import type { Stat } from '../types';
import { ProgressBar } from './ProgressBar';

export const StatCard = ({ stat }: { stat: Stat }) => (
  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2">
        <div className={cn('p-1.5 rounded-lg text-white', stat.color)}>{stat.icon}</div>
        <div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">{stat.name}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Lv.{stat.level}</span>
        </div>
      </div>
      <span className="text-xs font-mono font-bold text-slate-500">{stat.value}/{stat.max} xp</span>
    </div>
    <ProgressBar value={stat.value} max={stat.max} color={stat.color} />
    <p className="text-[10px] text-slate-400 mt-2 leading-tight">{stat.description}</p>
  </div>
);
