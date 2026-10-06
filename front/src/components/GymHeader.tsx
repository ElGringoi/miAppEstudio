export function GymHeader({ userXp, nextLevelXp, badge }: {
  userXp: number;
  nextLevelXp: number;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-outline/20">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Gym & Fuerza</h1>
        <p className="text-xs text-on-surface-variant font-label">
          Tomás • {userXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
        </p>
      </div>
      <div className="flex items-center gap-3">
        {badge && (
          <span className="font-label text-sm font-bold text-secondary bg-secondary/10 px-2 py-1 rounded">
            {badge}
          </span>
        )}
        <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
          👤
        </button>
      </div>
    </div>
  );
}
