import type { MuscleId } from '../components/BodyMap';

export const EXERCISE_MUSCLES: Record<string, MuscleId[]> = {
  // PECHO
  'Press plano con barra':          ['pecho', 'tricep', 'hombro'],
  'Press inclinado con mancuernas': ['pecho', 'tricep', 'hombro'],
  'Press declinado barra máquina':  ['pecho', 'tricep'],
  'Cruces en polea baja':           ['pecho'],
  'Press en máquina convergente':   ['pecho', 'tricep'],
  // ESPALDA
  'Peso muerto convencional':          ['espalda_baja', 'gluteo', 'femoral', 'trap'],
  'Dominadas agarre neutro':           ['dorsal', 'bicep', 'trap'],
  'Remo mancuerna pesado':             ['dorsal', 'bicep', 'trap'],
  'Jalón agarre abierto':              ['dorsal', 'bicep'],
  'Remo polea baja agarre cerrado':    ['dorsal', 'bicep', 'espalda_baja'],
  'Pullover mancuerna polea':          ['dorsal', 'tricep'],
  // PIERNA
  'Sentadilla frontal':             ['cuad', 'gluteo', 'femoral'],
  'Prensa horizontal':              ['cuad', 'gluteo'],
  'Peso muerto rumano':             ['femoral', 'gluteo', 'espalda_baja'],
  'Extensión de cuádriceps':        ['cuad'],
  'Curl femoral sentado':           ['femoral'],
  'Elevación de gemelos en prensa': ['gemelo'],
  // HOMBROS / TRAPECIO
  'Press militar con mancuernas':   ['hombro', 'tricep', 'trap'],
  'Elevaciones laterales pesadas':  ['hombro'],
  'Elevaciones laterales':          ['hombro'],
  'Remo al mentón con barra':       ['hombro', 'trap', 'bicep'],
  'Pájaros con manc. máquina':      ['hombro_post'],
  'Encogimientos con barra':        ['trap'],
  // BRAZOS
  'Curl barra recta':               ['bicep', 'forearm'],
  'Curl mancuernas alternado':      ['bicep', 'forearm'],
  'Curl Scott barra':               ['bicep'],
  'Curl polea alta cuerda':         ['bicep'],
  'Curl invertido':                 ['bicep', 'forearm'],
  'Jalón cuerda':                   ['tricep'],
  'Extensión polea barra recta':    ['tricep'],
  'Press francés con mancuernas':   ['tricep'],
  'Fondos en banca paralelas':      ['tricep', 'pecho'],
};

export function getMuscles(nombre: string): MuscleId[] {
  const key = Object.keys(EXERCISE_MUSCLES).find(k =>
    nombre.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(nombre.toLowerCase())
  );
  return key ? EXERCISE_MUSCLES[key] : EXERCISE_MUSCLES[nombre] ?? [];
}
