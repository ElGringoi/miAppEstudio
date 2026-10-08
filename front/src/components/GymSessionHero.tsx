export function GymSessionHero({ rutina, musclesActive, exercisesTotal, exercisesCompleted, xpGain }: {
  rutina?: { nombre: string; semana?: number; progresoDias?: number; descripcion?: string } | null;
  musclesActive?: string[];
  exercisesTotal: number;
  exercisesCompleted: number;
  xpGain?: number;
}) {
  if (!rutina) {
    return (
      <div className="rounded-lg bg-surface-container-high p-4 text-center">
        <p className="text-on-surface-variant">Descansa hoy o crea una rutina para hoy</p>
      </div>
    );
  }

  const today = new Date();
  const daysOfWeek = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  const dayName = daysOfWeek[today.getDay()];
  const progressPercent = exercisesTotal > 0 ? Math.round((exercisesCompleted / exercisesTotal) * 100) : 0;

  return (
    <div className="rounded-lg bg-surface-container-high p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-label text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded">
          HOY - {dayName}
        </span>
        {xpGain && (
          <span className="font-label text-xs font-bold text-secondary">
            +{xpGain} XP Fuerza 💪
          </span>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-on-surface">{rutina.nombre}</h2>
        {rutina.semana && (
          <p className="text-xs text-on-surface-variant mt-0.5">
            Semana {rutina.semana} · {rutina.progresoDias || 0}/8 días
          </p>
        )}
      </div>

      {rutina.descripcion && (
        <p className="text-sm text-on-surface-variant leading-snug">{rutina.descripcion}</p>
      )}

      {musclesActive && musclesActive.length > 0 && (
        <div className="text-xs">
          <p className="font-label font-semibold text-on-surface-variant uppercase mb-1">Músculos Activos</p>
          <p className="text-on-surface-variant">{musclesActive.join(', ')} <button className="ml-2 text-secondary hover:underline">Mapa →</button></p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <p className="font-label font-semibold text-on-surface-variant">Progreso de la sesión</p>
          <p className="text-on-surface">{exercisesCompleted} de {exercisesTotal} ejercicio ({progressPercent}%)</p>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden">
          <div
            className="h-full rounded-full bg-secondary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
