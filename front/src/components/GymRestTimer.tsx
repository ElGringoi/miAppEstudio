export function GymRestTimer({ seconds, onAdd, onSkip }: {
  seconds: number;
  onAdd: () => void;
  onSkip: () => void;
}) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="rounded-lg bg-surface-container-high p-4 space-y-3">
      <p className="font-label text-xs font-semibold text-on-surface-variant uppercase">Timer de Descanso</p>
      <div className="text-center">
        <div className="text-5xl font-label font-bold text-secondary">{display}</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAdd}
          className="flex-1 px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high transition"
        >
          +50s
        </button>
        <button
          onClick={onSkip}
          className="flex-1 px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high transition"
        >
          Saltar
        </button>
      </div>
    </div>
  );
}
