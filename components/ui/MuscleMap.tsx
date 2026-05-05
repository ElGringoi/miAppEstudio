import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Ellipse, G, Circle } from 'react-native-svg';
import { QF } from '@/constants/questflow';

export type MuscleGroup =
  | 'pecho' | 'hombros' | 'biceps' | 'triceps' | 'antebrazo'
  | 'abdomen' | 'cuadriceps' | 'pantorrillas'
  | 'espalda' | 'gluteos' | 'isquiotibiales' | 'trapecio';

interface Props {
  active: MuscleGroup[];
  size?: number;
}

const ACTIVE = QF.colors.stats.fuerza.main;   // rojo
const BASE = '#293548';
const OUTLINE = '#475569';

export function MuscleMap({ active, size = 200 }: Props) {
  const s = size / 200; // scale factor
  const isActive = (m: MuscleGroup) => active.includes(m);
  const fill = (m: MuscleGroup) => (isActive(m) ? ACTIVE : BASE);
  const opacity = (m: MuscleGroup) => (isActive(m) ? 0.9 : 0.5);

  return (
    <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
      {/* Vista frontal */}
      <Svg width={90 * s} height={200 * s} viewBox="0 0 90 200">
        {/* Cabeza */}
        <Ellipse cx="45" cy="12" rx="11" ry="13" fill={BASE} stroke={OUTLINE} strokeWidth="1" />
        {/* Cuello */}
        <Path d="M39 24 Q45 28 51 24 L51 32 Q45 35 39 32 Z" fill={BASE} stroke={OUTLINE} strokeWidth="1" />
        {/* Hombros */}
        <Ellipse cx="22" cy="40" rx="12" ry="8" fill={fill('hombros')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('hombros')} />
        <Ellipse cx="68" cy="40" rx="12" ry="8" fill={fill('hombros')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('hombros')} />
        {/* Trapecio */}
        <Path d="M33 30 Q45 34 57 30 L60 44 Q45 48 30 44 Z" fill={fill('trapecio')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('trapecio')} />
        {/* Pecho */}
        <Path d="M31 44 Q38 42 45 44 L45 65 Q37 67 31 63 Z" fill={fill('pecho')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('pecho')} />
        <Path d="M45 44 Q52 42 59 44 L59 63 Q53 67 45 65 Z" fill={fill('pecho')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('pecho')} />
        {/* Biceps */}
        <Path d="M12 44 Q8 52 10 64 L18 62 Q17 52 20 46 Z" fill={fill('biceps')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('biceps')} />
        <Path d="M78 44 Q82 52 80 64 L72 62 Q73 52 70 46 Z" fill={fill('biceps')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('biceps')} />
        {/* Triceps (lado) */}
        {/* Antebrazo */}
        <Path d="M9 65 Q7 78 9 90 L17 89 Q16 76 17 63 Z" fill={fill('antebrazo')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('antebrazo')} />
        <Path d="M81 65 Q83 78 81 90 L73 89 Q74 76 73 63 Z" fill={fill('antebrazo')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('antebrazo')} />
        {/* Abdomen */}
        <Path d="M33 65 L57 65 L57 105 L33 105 Z" fill={fill('abdomen')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('abdomen')} />
        {/* Grilla abdomen */}
        {isActive('abdomen') && <>
          <Path d="M33 75 L57 75" stroke="#0f172a" strokeWidth="1" />
          <Path d="M33 85 L57 85" stroke="#0f172a" strokeWidth="1" />
          <Path d="M33 95 L57 95" stroke="#0f172a" strokeWidth="1" />
          <Path d="M45 65 L45 105" stroke="#0f172a" strokeWidth="1" />
        </>}
        {/* Cuadriceps */}
        <Path d="M33 108 Q30 130 32 152 L42 151 Q42 130 40 108 Z" fill={fill('cuadriceps')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('cuadriceps')} />
        <Path d="M57 108 Q60 130 58 152 L48 151 Q48 130 50 108 Z" fill={fill('cuadriceps')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('cuadriceps')} />
        {/* Pantorrillas */}
        <Path d="M31 155 Q29 170 32 184 L40 183 Q38 169 39 154 Z" fill={fill('pantorrillas')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('pantorrillas')} />
        <Path d="M59 155 Q61 170 58 184 L50 183 Q52 169 51 154 Z" fill={fill('pantorrillas')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('pantorrillas')} />
        {/* Pies */}
        <Ellipse cx="36" cy="190" rx="8" ry="5" fill={BASE} stroke={OUTLINE} strokeWidth="1" />
        <Ellipse cx="54" cy="190" rx="8" ry="5" fill={BASE} stroke={OUTLINE} strokeWidth="1" />
      </Svg>

      {/* Vista trasera */}
      <Svg width={90 * s} height={200 * s} viewBox="0 0 90 200">
        {/* Cabeza */}
        <Ellipse cx="45" cy="12" rx="11" ry="13" fill={BASE} stroke={OUTLINE} strokeWidth="1" />
        {/* Cuello */}
        <Path d="M39 24 Q45 28 51 24 L51 32 Q45 35 39 32 Z" fill={BASE} stroke={OUTLINE} strokeWidth="1" />
        {/* Trapecio posterior */}
        <Path d="M30 30 Q45 36 60 30 L64 50 Q45 55 26 50 Z" fill={fill('trapecio')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('trapecio')} />
        {/* Hombros */}
        <Ellipse cx="20" cy="42" rx="12" ry="8" fill={fill('hombros')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('hombros')} />
        <Ellipse cx="70" cy="42" rx="12" ry="8" fill={fill('hombros')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('hombros')} />
        {/* Espalda */}
        <Path d="M30 50 Q45 54 60 50 L60 90 Q45 94 30 90 Z" fill={fill('espalda')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('espalda')} />
        {/* Triceps */}
        <Path d="M12 46 Q8 58 11 68 L20 65 Q18 56 18 48 Z" fill={fill('triceps')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('triceps')} />
        <Path d="M78 46 Q82 58 79 68 L70 65 Q72 56 72 48 Z" fill={fill('triceps')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('triceps')} />
        {/* Antebrazo */}
        <Path d="M10 69 Q8 82 10 92 L18 90 Q17 79 19 67 Z" fill={fill('antebrazo')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('antebrazo')} />
        <Path d="M80 69 Q82 82 80 92 L72 90 Q73 79 71 67 Z" fill={fill('antebrazo')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('antebrazo')} />
        {/* Glúteos */}
        <Ellipse cx="37" cy="105" rx="11" ry="10" fill={fill('gluteos')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('gluteos')} />
        <Ellipse cx="53" cy="105" rx="11" ry="10" fill={fill('gluteos')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('gluteos')} />
        {/* Isquiotibiales */}
        <Path d="M30 115 Q28 138 31 155 L41 154 Q40 135 38 114 Z" fill={fill('isquiotibiales')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('isquiotibiales')} />
        <Path d="M60 115 Q62 138 59 155 L49 154 Q50 135 52 114 Z" fill={fill('isquiotibiales')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('isquiotibiales')} />
        {/* Pantorrillas */}
        <Path d="M30 157 Q28 172 31 184 L41 183 Q39 170 40 156 Z" fill={fill('pantorrillas')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('pantorrillas')} />
        <Path d="M60 157 Q62 172 59 184 L49 183 Q51 170 50 156 Z" fill={fill('pantorrillas')} stroke={OUTLINE} strokeWidth="1" opacity={opacity('pantorrillas')} />
        {/* Pies */}
        <Ellipse cx="36" cy="190" rx="8" ry="5" fill={BASE} stroke={OUTLINE} strokeWidth="1" />
        <Ellipse cx="54" cy="190" rx="8" ry="5" fill={BASE} stroke={OUTLINE} strokeWidth="1" />
      </Svg>
    </View>
  );
}
