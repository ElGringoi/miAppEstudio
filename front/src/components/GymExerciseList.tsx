import type { FSEjercicio, SetLog } from '../types';
import { cn } from '../lib/utils';

export function GymExerciseList({
  ejercicios,
  onUpdateSets,
  onAddSet,
  xpPerSet = 16,
}: {
  ejercicios: FSEjercicio[];
  onUpdateSets?: (ejId: string, sets: SetLog[]) => void;
  onAddSet?: (ejId: string) => void;
  xpPerSet?: number;
}) {
  if (!ejercicios.length) {
    return (
      <div className="rounded-lg bg-surface-container-high p-4 text-center">
        <p className="text-on-surface-variant text-sm">No hay ejercicios en esta rutina</p>
      </div>
    );
  }

  const getCompletedSets = (ej: FSEjercicio) =>
    ej.setsLog?.filter(s => s.done).length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold text-on-surface">Ejercicios de la Rutina</h3>
        <span className="font-label text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded">
          En Vivo
        </span>
      </div>

      {ejercicios.map((ej, idx) => {
        const completedSets = getCompletedSets(ej);
        const totalSets = ej.series || 4;
        const isMain = idx === 0;
        const isCompleted = completedSets === totalSets && totalSets > 0;

        return (
          <div
            key={ej.id}
            className={cn(
              'rounded-lg bg-surface-container-high overflow-hidden',
              isMain && 'ring-2 ring-secondary/30'
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-outline/20">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {isMain && (
                    <p className="font-label text-xs font-semibold text-secondary uppercase mb-1">
                      Ejercicio Principal
                    </p>
                  )}
                  <h4 className="font-bold text-on-surface">{ej.nombre}</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {ej.series} series • {ej.reps} • {completedSets}/{totalSets} completadas
                  </p>
                </div>
                {isCompleted && (
                  <span className="text-lg">✅</span>
                )}
              </div>

              {ej.notas && (
                <p className="text-xs text-on-surface-variant mt-2 italic">
                  Nota: {ej.notas}
                </p>
              )}
            </div>

            {/* Sets Table (only show for main exercise or expanded) */}
            {isMain && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-outline/20 bg-surface-container-low">
                      <th className="px-4 py-2 text-left font-label font-semibold text-on-surface-variant">SET</th>
                      <th className="px-4 py-2 text-left font-label font-semibold text-on-surface-variant">PESO</th>
                      <th className="px-4 py-2 text-left font-label font-semibold text-on-surface-variant">REPS</th>
                      <th className="px-4 py-2 text-left font-label font-semibold text-on-surface-variant">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ej.setsLog && ej.setsLog.map((set, setIdx) => (
                      <tr key={setIdx} className="border-b border-outline/20 hover:bg-surface-container-low">
                        <td className="px-4 py-2 font-label text-on-surface">{setIdx + 1}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={set.peso}
                            onChange={(e) => {
                              const newSets = [...ej.setsLog!];
                              newSets[setIdx].peso = Number(e.target.value);
                              onUpdateSets?.(ej.id, newSets);
                            }}
                            className="w-16 px-2 py-1 rounded bg-surface-container text-on-surface text-xs"
                            placeholder="0"
                          />
                          <span className="ml-1 text-on-surface-variant">kg</span>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => {
                              const newSets = [...ej.setsLog!];
                              newSets[setIdx].reps = Number(e.target.value);
                              onUpdateSets?.(ej.id, newSets);
                            }}
                            className="w-16 px-2 py-1 rounded bg-surface-container text-on-surface text-xs"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => {
                              const newSets = [...ej.setsLog!];
                              newSets[setIdx].done = !newSets[setIdx].done;
                              onUpdateSets?.(ej.id, newSets);
                            }}
                            className={cn(
                              'w-6 h-6 rounded flex items-center justify-center text-xs font-bold',
                              set.done
                                ? 'bg-secondary text-on-secondary'
                                : 'bg-surface-container text-outline'
                            )}
                          >
                            {set.done ? '✓' : '○'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Actions */}
            <div className="p-3 bg-surface-container-low space-y-2">
              {isMain && (
                <>
                  <button
                    onClick={() => onAddSet?.(ej.id)}
                    className="w-full px-3 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-container transition"
                  >
                    + Agregar serie
                  </button>
                  <p className="text-xs text-secondary font-label">+{xpPerSet} XP / serie</p>
                </>
              )}
            </div>
          </div>
        );
      })}

      <button className="w-full px-4 py-3 text-sm font-semibold text-on-surface-variant border border-outline/30 rounded-lg hover:bg-surface-container transition">
        + Agregar ejercicio a la sesión
      </button>
    </div>
  );
}
