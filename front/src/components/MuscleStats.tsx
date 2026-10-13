import type { MuscleId, MuscleStatsData } from './BodyMap';

const MUSCLE_NAMES: Record<MuscleId, string> = {
  pecho: 'Pecho', hombro: 'Hombro', hombro_post: 'Hombro Post', bicep: 'Bíceps',
  tricep: 'Tríceps', forearm: 'Antebrazo', abs: 'Abdominales', oblicuo: 'Oblicuos',
  cuad: 'Cuádriceps', tibial: 'Tibia', trap: 'Trapecio', dorsal: 'Dorsal',
  espalda_baja: 'Espalda Baja', gluteo: 'Glúteos', femoral: 'Femorales', gemelo: 'Gemelos',
};

export function MuscleStats({ muscleStats, activeMuscles }: {
  muscleStats?: MuscleStatsData;
  activeMuscles: MuscleId[];
}) {
  const musclesWithData = activeMuscles
    .filter(m => muscleStats?.[m] != null)
    .slice(0, 8); // Mostrar máx 8 músculos

  if (musclesWithData.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg bg-surface-container p-3">
      <h4 className="font-label text-xs font-semibold text-on-surface-variant uppercase mb-3">
        Última sesión por músculo
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {musclesWithData.map(id => {
          const data = muscleStats?.[id];
          return (
            <div
              key={id}
              className="flex flex-col gap-1 p-2 rounded-lg bg-surface-container-high border border-outline/20"
            >
              <span className="font-label text-[10px] font-semibold text-secondary">
                {MUSCLE_NAMES[id]}
              </span>
              {data?.lastSession && (
                <span className="font-label text-[9px] text-on-surface-variant truncate">
                  {data.lastSession}
                </span>
              )}
              {data?.volume && (
                <span className="font-label text-[9px] text-on-surface tabular-nums font-bold">
                  {data.volume}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
