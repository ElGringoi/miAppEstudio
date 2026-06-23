import { useMemo, useState } from 'react';
import { cn } from '../lib/utils';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CELL  = 13;
const GAP   = 3;
const STEP  = CELL + GAP;

function colorClass(count: number): string {
  if (count === 0)  return 'bg-slate-800/80';
  if (count === 1)  return 'bg-violet-900';
  if (count === 2)  return 'bg-violet-700';
  if (count === 3)  return 'bg-violet-500';
  return 'bg-violet-300';
}

export function HabitHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    const countMap = new Map(data.map(d => [d.date, d.count]));

    const today = new Date();
    const days: { date: string; count: number; dow: number }[] = [];
    for (let i = 111; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().slice(0, 10);
      days.push({ date: str, count: countMap.get(str) ?? 0, dow: d.getDay() });
    }

    const pad = days[0].dow;
    const padded: (typeof days[0] | null)[] = [...Array(pad).fill(null), ...days];

    const weeks: (typeof days[0] | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

    const monthLabels: { col: number; label: string }[] = [];
    let last = -1;
    weeks.forEach((wk, col) => {
      const first = wk.find(Boolean);
      if (first) {
        const m = new Date(first.date).getMonth();
        if (m !== last) { monthLabels.push({ col, label: MESES[m] }); last = m; }
      }
    });

    return { weeks, monthLabels };
  }, [data]);

  return (
    <div className="overflow-x-auto select-none relative">
      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}
        >
          {tooltip.text}
        </div>
      )}

      <div className="inline-block" style={{ paddingLeft: 28, paddingTop: 20 }}>
        {/* Month labels */}
        <div className="relative h-4 mb-1">
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className="absolute text-[10px] font-bold text-slate-500"
              style={{ left: m.col * STEP }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex" style={{ gap: GAP }}>
          {/* Weekday labels */}
          <div className="absolute left-0 flex flex-col" style={{ gap: GAP, marginTop: 0 }}>
            {['', 'Lun', '', 'Mié', '', 'Vie', ''].map((label, i) => (
              <div
                key={i}
                className="text-[9px] font-bold text-slate-500 text-right"
                style={{ width: 24, height: CELL, lineHeight: `${CELL}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Columnas de semanas */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
              {week.map((day, di) =>
                day === null ? (
                  <div key={di} style={{ width: CELL, height: CELL }} />
                ) : (
                  <div
                    key={di}
                    style={{ width: CELL, height: CELL }}
                    className={cn(
                      'rounded-sm transition-colors cursor-default',
                      colorClass(day.count),
                      day.count > 0 && 'hover:ring-1 hover:ring-violet-300 hover:ring-offset-1 hover:ring-offset-slate-950',
                    )}
                    onMouseEnter={e => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      const label = day.count === 0
                        ? `Sin completados — ${day.date}`
                        : `${day.count} hábito${day.count > 1 ? 's' : ''} — ${day.date}`;
                      setTooltip({ text: label, x: rect.left, y: rect.top });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              )}
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[9px] text-slate-500 font-bold">Menos</span>
          {[0, 1, 2, 3, 4].map(n => (
            <div key={n} className={cn('rounded-sm', colorClass(n))} style={{ width: CELL, height: CELL }} />
          ))}
          <span className="text-[9px] text-slate-500 font-bold">Más</span>
        </div>
      </div>
    </div>
  );
}
