import { cn } from '../lib/utils';

export type MuscleId =
  | 'pecho' | 'hombro' | 'hombro_post' | 'bicep' | 'tricep' | 'forearm'
  | 'abs' | 'oblicuo' | 'cuad' | 'tibial' | 'trap' | 'dorsal'
  | 'espalda_baja' | 'gluteo' | 'femoral' | 'gemelo';

const RED    = '#ef4444';
const DIMMED = 'rgba(100,116,139,0.18)';
const BODY   = '#1e293b';
const BORDER = '#334155';

export function BodyMap({ activeMuscles, className }: {
  activeMuscles: MuscleId[];
  className?: string;
}) {
  const s = new Set(activeMuscles);
  const f = (id: MuscleId) => s.has(id) ? RED : DIMMED;
  const glow = (id: MuscleId): React.CSSProperties =>
    s.has(id) ? { filter: 'drop-shadow(0 0 5px rgba(239,68,68,0.9))' } : {};

  return (
    <svg
      viewBox="0 0 280 480"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-full select-none', className)}
      aria-label="Diagrama corporal con músculos activos"
    >
      {/* ─────────────── FRONT VIEW (x: 0 – 136, cx=68) ─────────────── */}
      <text x="68" y="11" textAnchor="middle" fontSize="8" fontWeight="800"
        fill="#475569" letterSpacing="2">FRENTE</text>

      {/* Head */}
      <circle cx="68" cy="29" r="21" fill={BODY} stroke={BORDER} strokeWidth="1" />
      <circle cx="61" cy="26" r="2"  fill={BORDER} />
      <circle cx="75" cy="26" r="2"  fill={BORDER} />
      <path d="M 62,34 Q 68,38 74,34" fill="none" stroke={BORDER} strokeWidth="1" strokeLinecap="round" />

      {/* Neck */}
      <rect x="62" y="48" width="12" height="18" rx="4" fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* Torso */}
      <path d="M 36,66 Q 18,76 16,95 L 18,183 Q 20,200 32,208 L 42,212 L 94,212 L 104,208 Q 116,200 118,183 L 120,95 Q 118,76 100,66 Z"
        fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* TRAPEZIUS front */}
      <path d="M 64,50 Q 46,60 28,70 L 68,64 L 108,70 Q 90,60 72,50 Z"
        fill={f('trap')} style={glow('trap')} />

      {/* DELTOIDS front */}
      <ellipse cx="20" cy="83" rx="13" ry="11" fill={f('hombro')} style={glow('hombro')} />
      <ellipse cx="116" cy="83" rx="13" ry="11" fill={f('hombro')} style={glow('hombro')} />

      {/* PECHO left + right */}
      <path d="M 36,76 Q 32,92 36,108 Q 42,122 60,124 Q 72,122 76,112 Q 78,100 72,82 Q 60,70 36,76 Z"
        fill={f('pecho')} style={glow('pecho')} />
      <path d="M 100,76 Q 104,92 100,108 Q 94,122 76,124 Q 64,122 60,112 Q 58,100 64,82 Q 76,70 100,76 Z"
        fill={f('pecho')} style={glow('pecho')} />

      {/* Upper arm background (skin) */}
      <rect x="8"   y="70" width="16" height="78" rx="6" fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <rect x="112" y="70" width="16" height="78" rx="6" fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* BICEP */}
      <ellipse cx="14" cy="116" rx="7"  ry="21" fill={f('bicep')} style={glow('bicep')} />
      <ellipse cx="122" cy="116" rx="7" ry="21" fill={f('bicep')} style={glow('bicep')} />

      {/* TRICEP (outer arm visible from front) */}
      <ellipse cx="9"   cy="118" rx="4" ry="18" fill={f('tricep')} style={glow('tricep')} />
      <ellipse cx="127" cy="118" rx="4" ry="18" fill={f('tricep')} style={glow('tricep')} />

      {/* Forearm background */}
      <rect x="7"   y="152" width="14" height="44" rx="5" fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <rect x="115" y="152" width="14" height="44" rx="5" fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* FOREARM */}
      <ellipse cx="13"  cy="165" rx="6" ry="18" fill={f('forearm')} style={glow('forearm')} />
      <ellipse cx="123" cy="165" rx="6" ry="18" fill={f('forearm')} style={glow('forearm')} />

      {/* ABS – 3 pairs */}
      {([138, 157, 176] as const).map(cy => (
        <g key={cy}>
          <ellipse cx="58" cy={cy} rx="9" ry="7"  fill={f('abs')} style={glow('abs')} />
          <ellipse cx="78" cy={cy} rx="9" ry="7"  fill={f('abs')} style={glow('abs')} />
        </g>
      ))}

      {/* OBLIQUES */}
      <path d="M 34,130 Q 28,150 32,176 Q 36,188 46,186 Q 54,178 52,154 Q 48,130 34,130 Z"
        fill={f('oblicuo')} style={glow('oblicuo')} />
      <path d="M 102,130 Q 108,150 104,176 Q 100,188 90,186 Q 82,178 84,154 Q 88,130 102,130 Z"
        fill={f('oblicuo')} style={glow('oblicuo')} />

      {/* Hip / crotch */}
      <path d="M 32,210 L 104,210 Q 100,222 94,226 L 68,228 L 42,226 Q 36,222 32,210 Z"
        fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* Leg backgrounds */}
      <rect x="30"  y="226" width="38" height="100" rx="12" fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <rect x="68"  y="226" width="38" height="100" rx="12" fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <rect x="30"  y="320" width="36" height="80"  rx="10" fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <rect x="70"  y="320" width="36" height="80"  rx="10" fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* QUADS */}
      <path d="M 34,228 Q 30,244 32,284 Q 34,308 42,318 Q 50,322 58,318 Q 65,310 65,284 Q 66,246 62,230 Z"
        fill={f('cuad')} style={glow('cuad')} />
      <path d="M 102,228 Q 106,244 104,284 Q 102,308 94,318 Q 86,322 78,318 Q 71,310 71,284 Q 70,246 74,230 Z"
        fill={f('cuad')} style={glow('cuad')} />

      {/* TIBIALS */}
      <ellipse cx="46" cy="368" rx="9"  ry="27" fill={f('tibial')} style={glow('tibial')} />
      <ellipse cx="90" cy="368" rx="9"  ry="27" fill={f('tibial')} style={glow('tibial')} />

      {/* Feet */}
      <ellipse cx="44" cy="424" rx="13" ry="8"  fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <ellipse cx="88" cy="424" rx="13" ry="8"  fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* ─────────────── BACK VIEW (x: 144 – 280, cx=212) ─────────────── */}
      <text x="212" y="11" textAnchor="middle" fontSize="8" fontWeight="800"
        fill="#475569" letterSpacing="2">DORSO</text>

      {/* Head back */}
      <circle cx="212" cy="29" r="21" fill={BODY} stroke={BORDER} strokeWidth="1" />
      <path d="M 200,25 Q 212,20 224,25" fill="none" stroke={BORDER} strokeWidth="1" />

      {/* Neck back */}
      <rect x="206" y="48" width="12" height="18" rx="4" fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* Torso back */}
      <path d="M 180,66 Q 162,76 160,95 L 162,183 Q 164,200 176,208 L 186,212 L 238,212 L 248,208 Q 260,200 262,183 L 264,95 Q 262,76 244,66 Z"
        fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* TRAPEZIUS back */}
      <path d="M 208,52 Q 184,62 166,74 Q 188,82 212,80 Q 236,82 258,74 Q 240,62 216,52 Z"
        fill={f('trap')} style={glow('trap')} />

      {/* POSTERIOR DELTOIDS */}
      <ellipse cx="163" cy="87" rx="13" ry="11" fill={f('hombro_post')} style={glow('hombro_post')} />
      <ellipse cx="261" cy="87" rx="13" ry="11" fill={f('hombro_post')} style={glow('hombro_post')} />

      {/* DORSALS (lats) */}
      <path d="M 165,92 Q 160,112 164,142 Q 168,168 180,178 Q 188,182 192,170 Q 196,154 192,130 Q 188,106 180,90 Q 172,82 165,92 Z"
        fill={f('dorsal')} style={glow('dorsal')} />
      <path d="M 259,92 Q 264,112 260,142 Q 256,168 244,178 Q 236,182 232,170 Q 228,154 232,130 Q 236,106 244,90 Q 252,82 259,92 Z"
        fill={f('dorsal')} style={glow('dorsal')} />

      {/* LOWER BACK */}
      <path d="M 200,168 Q 196,184 198,204 Q 204,216 212,216 Q 220,216 226,204 Q 228,184 224,168 Q 218,160 212,160 Q 206,160 200,168 Z"
        fill={f('espalda_baja')} style={glow('espalda_baja')} />

      {/* Upper arm back */}
      <rect x="152" y="70" width="16" height="78" rx="6" fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <rect x="256" y="70" width="16" height="78" rx="6" fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* TRICEP (very visible from back) */}
      <ellipse cx="157" cy="116" rx="8"  ry="21" fill={f('tricep')} style={glow('tricep')} />
      <ellipse cx="267" cy="116" rx="8"  ry="21" fill={f('tricep')} style={glow('tricep')} />

      {/* FOREARM back */}
      <rect x="151" y="152" width="14" height="44" rx="5" fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <rect x="259" y="152" width="14" height="44" rx="5" fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <ellipse cx="157" cy="165" rx="6"  ry="18" fill={f('forearm')} style={glow('forearm')} />
      <ellipse cx="267" cy="165" rx="6"  ry="18" fill={f('forearm')} style={glow('forearm')} />

      {/* Hip back */}
      <path d="M 176,210 L 248,210 Q 244,222 238,226 L 212,228 L 186,226 Q 180,222 176,210 Z"
        fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* GLUTES */}
      <path d="M 176,226 Q 172,242 176,260 Q 182,274 196,274 Q 210,274 212,264 Q 214,250 210,234 Q 204,220 190,220 Q 180,220 176,226 Z"
        fill={f('gluteo')} style={glow('gluteo')} />
      <path d="M 248,226 Q 252,242 248,260 Q 242,274 228,274 Q 214,274 212,264 Q 210,250 214,234 Q 220,220 234,220 Q 244,220 248,226 Z"
        fill={f('gluteo')} style={glow('gluteo')} />

      {/* Leg backgrounds (back) */}
      <rect x="174" y="272" width="38" height="78"  rx="12" fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <rect x="212" y="272" width="38" height="78"  rx="12" fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <rect x="174" y="344" width="36" height="72"  rx="10" fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <rect x="212" y="344" width="36" height="72"  rx="10" fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* HAMSTRINGS */}
      <path d="M 178,274 Q 174,296 178,330 Q 182,352 192,354 Q 202,354 204,342 Q 208,322 206,294 Q 204,272 194,270 Q 183,270 178,274 Z"
        fill={f('femoral')} style={glow('femoral')} />
      <path d="M 246,274 Q 250,296 246,330 Q 242,352 232,354 Q 222,354 220,342 Q 216,322 218,294 Q 220,272 230,270 Q 241,270 246,274 Z"
        fill={f('femoral')} style={glow('femoral')} />

      {/* CALVES (gemelos) */}
      <path d="M 184,356 Q 180,370 182,394 Q 186,414 194,416 Q 202,414 204,400 Q 206,378 204,360 Q 200,350 194,350 Q 187,350 184,356 Z"
        fill={f('gemelo')} style={glow('gemelo')} />
      <path d="M 240,356 Q 244,370 242,394 Q 238,414 230,416 Q 222,414 220,400 Q 218,378 220,360 Q 224,350 230,350 Q 237,350 240,356 Z"
        fill={f('gemelo')} style={glow('gemelo')} />

      {/* Feet back */}
      <ellipse cx="190" cy="428" rx="13" ry="8" fill={BODY} stroke={BORDER} strokeWidth="0.5" />
      <ellipse cx="234" cy="428" rx="13" ry="8" fill={BODY} stroke={BORDER} strokeWidth="0.5" />

      {/* Divider */}
      <line x1="140" y1="15" x2="140" y2="476" stroke="#0f172a" strokeWidth="3" />
    </svg>
  );
}
