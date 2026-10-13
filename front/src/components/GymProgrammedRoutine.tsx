export function GymProgrammedRoutine({ stage, version }: {
  stage: string;
  version?: string;
}) {
  return (
    <div className="rounded-lg bg-surface-container-high p-4">
      <p className="font-label text-xs font-semibold text-on-surface-variant uppercase mb-2">Rutina Programada</p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-on-surface font-semibold">{stage}</span>
        {version && (
          <span className="font-label text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded">
            {version}
          </span>
        )}
      </div>
    </div>
  );
}
