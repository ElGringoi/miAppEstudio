import type { FSRutina } from '../types';
import { useState } from 'react';

const DIAS_LETRA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export function GymWeeklyRoutines({ rutinas, stage = '2da Etapa' }: {
  rutinas: FSRutina[];
  stage?: string;
}) {
  const [scrollIndex, setScrollIndex] = useState(0);

  const visibleCount = 3;
  const totalRutinas = rutinas.length;
  const canScrollLeft = scrollIndex > 0;
  const canScrollRight = scrollIndex + visibleCount < totalRutinas;

  const handleScroll = (direction: 'left' | 'right') => {
    if (direction === 'left' && canScrollLeft) {
      setScrollIndex(scrollIndex - 1);
    } else if (direction === 'right' && canScrollRight) {
      setScrollIndex(scrollIndex + 1);
    }
  };

  const visibleRutinas = rutinas.slice(scrollIndex, scrollIndex + visibleCount);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-on-surface">Rutinas Semanales</h3>
        <span className="font-label text-xs text-on-surface-variant">{stage}</span>
      </div>

      <div className="relative">
        {/* Carousel */}
        <div className="flex gap-2 overflow-hidden">
          {visibleRutinas.map((rutina) => {
            const diasActivos = rutina.diasSemana.map(d => DIAS_LETRA[d]);
            const diaActualEsHoy = rutina.diasSemana.includes(new Date().getDay());

            return (
              <div
                key={rutina.id}
                className="flex-shrink-0 w-32 rounded-lg bg-surface-container-high p-3 space-y-2"
              >
                <p className="font-label text-xs font-bold text-secondary">
                  {diaActualEsHoy ? 'HOY' : ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'][rutina.diasSemana[0]]}
                </p>
                <h4 className="font-bold text-sm text-on-surface line-clamp-2">{rutina.nombre}</h4>
                <p className="text-xs text-on-surface-variant">{rutina.ejercicios?.length || 0} ejercicios</p>
                <div className="flex gap-1 flex-wrap">
                  {diasActivos.map((dia, i) => (
                    <span
                      key={i}
                      className="font-label text-xs bg-secondary/10 text-secondary px-1.5 py-0.5 rounded"
                    >
                      {dia}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation arrows */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-8 h-8 flex items-center justify-center bg-surface-container-high rounded-full text-on-surface hover:bg-surface-container-highest transition"
          >
            ←
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-8 h-8 flex items-center justify-center bg-surface-container-high rounded-full text-on-surface hover:bg-surface-container-highest transition"
          >
            →
          </button>
        )}
      </div>

      {/* Page indicators */}
      {totalRutinas > visibleCount && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: Math.ceil(totalRutinas / visibleCount) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setScrollIndex(i)}
              className={`w-2 h-2 rounded-full transition ${
                i === Math.floor(scrollIndex / visibleCount)
                  ? 'bg-secondary'
                  : 'bg-outline/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
