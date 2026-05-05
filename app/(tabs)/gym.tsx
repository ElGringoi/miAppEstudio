import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { db } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';
import { QF } from '@/constants/questflow';
import { MuscleMap, MuscleGroup } from '@/components/ui/MuscleMap';

const { width } = Dimensions.get('window');

type Vista = 'hoy' | 'programa';
type Seccion = 'entrenamiento' | 'registrar' | 'historial' | 'timer';

type Ejercicio = {
  nombre: string;
  series: number;
  reps: string;
  musculos: MuscleGroup[];
  dias: number[]; // 0=lunes, 6=domingo
};

type Registro = {
  id: string;
  nombre: string;
  series: string;
  repeticiones: string;
  peso: string;
  fecha: string;
};

const PROGRAMA: Ejercicio[] = [
  { nombre: 'Press de Banca', series: 4, reps: '8-10', musculos: ['pecho', 'triceps', 'hombros'], dias: [0, 3] },
  { nombre: 'Press Inclinado', series: 3, reps: '10-12', musculos: ['pecho', 'hombros'], dias: [0, 3] },
  { nombre: 'Fondos en Paralelas', series: 3, reps: '10-15', musculos: ['triceps', 'pecho'], dias: [0, 3] },
  { nombre: 'Dominadas', series: 4, reps: '6-10', musculos: ['espalda', 'biceps'], dias: [1, 4] },
  { nombre: 'Remo con Barra', series: 4, reps: '8-10', musculos: ['espalda', 'trapecio'], dias: [1, 4] },
  { nombre: 'Curl de Bíceps', series: 3, reps: '12-15', musculos: ['biceps', 'antebrazo'], dias: [1, 4] },
  { nombre: 'Sentadilla', series: 4, reps: '6-8', musculos: ['cuadriceps', 'gluteos'], dias: [2, 5] },
  { nombre: 'Peso Muerto', series: 4, reps: '5-6', musculos: ['isquiotibiales', 'gluteos', 'espalda'], dias: [2, 5] },
  { nombre: 'Gemelos en Máquina', series: 4, reps: '15-20', musculos: ['pantorrillas'], dias: [2, 5] },
  { nombre: 'Press Militar', series: 4, reps: '8-10', musculos: ['hombros', 'trapecio'], dias: [6] },
  { nombre: 'Elevaciones Laterales', series: 3, reps: '12-15', musculos: ['hombros'], dias: [6] },
  { nombre: 'Plancha', series: 3, reps: '45s', musculos: ['abdomen'], dias: [0, 2, 4] },
  { nombre: 'Crunch', series: 3, reps: '15-20', musculos: ['abdomen'], dias: [1, 3, 5] },
];

const DIA_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function GymScreen() {
  const { usuario } = useUsuario();
  const [seccion, setSeccion] = useState<Seccion>('entrenamiento');
  const [vista, setVista] = useState<Vista>('hoy');
  const [selectedEj, setSelectedEj] = useState<Ejercicio | null>(null);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [nombre, setNombre] = useState('');
  const [series, setSeries] = useState('');
  const [reps, setReps] = useState('');
  const [peso, setPeso] = useState('');
  const [tiempoTotal, setTiempoTotal] = useState(60);
  const [tiempoRestante, setTiempoRestante] = useState(60);
  const [corriendo, setCorriendo] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const todayDow = (new Date().getDay() + 6) % 7; // 0=lunes
  const ejerciciosHoy = PROGRAMA.filter(e => e.dias.includes(todayDow));
  const musculosHoy = [...new Set(ejerciciosHoy.flatMap(e => e.musculos))];

  useEffect(() => {
    if (!usuario?.uid) return;
    return onSnapshot(
      query(collection(db, 'usuarios', usuario.uid, 'gym_historial'), orderBy('fecha', 'desc')),
      snap => setRegistros(snap.docs.map(d => ({ id: d.id, ...d.data() } as Registro)))
    );
  }, [usuario?.uid]);

  useEffect(() => {
    if (corriendo) {
      intervalRef.current = setInterval(() => {
        setTiempoRestante(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current!); setCorriendo(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [corriendo]);

  async function guardarRegistro() {
    if (!usuario?.uid || !nombre.trim()) return;
    await addDoc(collection(db, 'usuarios', usuario.uid, 'gym_historial'), {
      nombre: nombre.trim(), series, repeticiones: reps, peso,
      fecha: new Date().toISOString(),
    });
    setNombre(''); setSeries(''); setReps(''); setPeso('');
  }

  function setTimer(s: number) { setTiempoTotal(s); setTiempoRestante(s); setCorriendo(false); }
  const timerPct = tiempoRestante / tiempoTotal;
  const mm = String(Math.floor(tiempoRestante / 60)).padStart(2, '0');
  const ss = String(tiempoRestante % 60).padStart(2, '0');

  const secciones: { key: Seccion; label: string }[] = [
    { key: 'entrenamiento', label: 'Hoy' },
    { key: 'registrar', label: 'Log' },
    { key: 'historial', label: 'Historial' },
    { key: 'timer', label: 'Timer' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gym</Text>
        <View style={styles.tabs}>
          {secciones.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.tab, seccion === s.key && styles.tabActive]}
              onPress={() => setSeccion(s.key)}
            >
              <Text style={[styles.tabText, seccion === s.key && styles.tabTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>

        {/* ── ENTRENAMIENTO ── */}
        {seccion === 'entrenamiento' && (
          <>
            {/* Vista toggle */}
            <View style={styles.vistaToggle}>
              <TouchableOpacity
                style={[styles.vistaBtn, vista === 'hoy' && styles.vistaBtnActive]}
                onPress={() => setVista('hoy')}
              >
                <Text style={[styles.vistaBtnText, vista === 'hoy' && styles.vistaBtnTextActive]}>Hoy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.vistaBtn, vista === 'programa' && styles.vistaBtnActive]}
                onPress={() => setVista('programa')}
              >
                <Text style={[styles.vistaBtnText, vista === 'programa' && styles.vistaBtnTextActive]}>Programa</Text>
              </TouchableOpacity>
            </View>

            {vista === 'hoy' ? (
              <>
                <Text style={styles.sectionLabel}>MÚSCULOS DE HOY</Text>
                <View style={styles.card}>
                  <MuscleMap active={musculosHoy} size={200} />
                  <View style={styles.musculoChips}>
                    {musculosHoy.map(m => (
                      <View key={m} style={styles.musculoChip}>
                        <Text style={styles.musculoChipText}>{m}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Text style={styles.sectionLabel}>EJERCICIOS DE HOY</Text>
                {ejerciciosHoy.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>Día de descanso 🛌</Text>
                  </View>
                ) : ejerciciosHoy.map((ej, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.ejCard, selectedEj?.nombre === ej.nombre && styles.ejCardSelected]}
                    onPress={() => setSelectedEj(selectedEj?.nombre === ej.nombre ? null : ej)}
                  >
                    <View style={styles.ejHeader}>
                      <Text style={styles.ejNombre}>{ej.nombre}</Text>
                      <Text style={styles.ejMeta}>{ej.series}×{ej.reps}</Text>
                    </View>
                    {selectedEj?.nombre === ej.nombre && (
                      <View style={styles.ejDetail}>
                        <MuscleMap active={ej.musculos} size={150} />
                        <View style={styles.ejChips}>
                          {ej.musculos.map(m => (
                            <View key={m} style={[styles.musculoChip, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: QF.colors.stats.fuerza.main }]}>
                              <Text style={[styles.musculoChipText, { color: QF.colors.stats.fuerza.main }]}>{m}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <Text style={styles.sectionLabel}>PROGRAMA SEMANAL</Text>
                {DIA_NAMES.map((dia, dIdx) => {
                  const ejsDia = PROGRAMA.filter(e => e.dias.includes(dIdx));
                  const isToday = dIdx === todayDow;
                  return (
                    <View key={dIdx} style={[styles.diaCard, isToday && styles.diaCardHoy]}>
                      <Text style={[styles.diaNombre, isToday && { color: QF.colors.stats.fuerza.main }]}>
                        {dia}{isToday ? ' — HOY' : ''}
                      </Text>
                      {ejsDia.length === 0 ? (
                        <Text style={styles.descansoText}>Descanso</Text>
                      ) : ejsDia.map((ej, i) => (
                        <Text key={i} style={styles.diaEj}>• {ej.nombre} {ej.series}×{ej.reps}</Text>
                      ))}
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* ── LOG ── */}
        {seccion === 'registrar' && (
          <>
            <Text style={styles.sectionLabel}>REGISTRAR EJERCICIO</Text>
            <View style={styles.card}>
              {[
                { label: 'Ejercicio', value: nombre, set: setNombre, ph: 'ej. Press de Banca' },
                { label: 'Series', value: series, set: setSeries, ph: '4', kb: 'numeric' as const },
                { label: 'Reps', value: reps, set: setReps, ph: '10', kb: 'numeric' as const },
                { label: 'Peso (kg)', value: peso, set: setPeso, ph: '60', kb: 'numeric' as const },
              ].map(f => (
                <View key={f.label} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={f.value}
                    onChangeText={f.set}
                    placeholder={f.ph}
                    placeholderTextColor={QF.colors.textMuted}
                    keyboardType={f.kb}
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.btnPrimary} onPress={guardarRegistro}>
                <Text style={styles.btnPrimaryText}>Registrar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── HISTORIAL ── */}
        {seccion === 'historial' && (
          <>
            <Text style={styles.sectionLabel}>HISTORIAL</Text>
            {registros.length === 0 && (
              <View style={styles.emptyCard}><Text style={styles.emptyText}>Sin registros aún</Text></View>
            )}
            {registros.map(r => (
              <View key={r.id} style={styles.logCard}>
                <View style={styles.logLeft}>
                  <Text style={styles.logNombre}>{r.nombre}</Text>
                  <Text style={styles.logDate}>{new Date(r.fecha).toLocaleDateString('es-AR')}</Text>
                </View>
                <View style={styles.logRight}>
                  <Text style={styles.logStat}>{r.series}×{r.repeticiones}</Text>
                  {r.peso ? <Text style={styles.logPeso}>{r.peso}kg</Text> : null}
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── TIMER ── */}
        {seccion === 'timer' && (
          <>
            <Text style={styles.sectionLabel}>CRONÓMETRO DE DESCANSO</Text>
            <View style={styles.timerCard}>
              <View style={styles.timerRing}>
                <View style={[styles.timerFill, {
                  borderColor: timerPct > 0.5 ? QF.colors.stats.fuerza.main : timerPct > 0.25 ? QF.colors.stats.sabiduria.main : QF.colors.stats.agilidad.main,
                }]}>
                  <Text style={styles.timerText}>{mm}:{ss}</Text>
                </View>
              </View>
              <View style={styles.timerBtns}>
                {[30, 60, 90, 120].map(s => (
                  <TouchableOpacity key={s} style={styles.timerPreset} onPress={() => setTimer(s)}>
                    <Text style={styles.timerPresetText}>{s}s</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.btnPrimary, { marginTop: 0 }]}
                onPress={() => {
                  if (tiempoRestante === 0) { setTiempoRestante(tiempoTotal); setCorriendo(true); }
                  else setCorriendo(!corriendo);
                }}
              >
                <Text style={styles.btnPrimaryText}>{corriendo ? 'Pausar' : tiempoRestante === 0 ? 'Reiniciar' : 'Iniciar'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: QF.colors.bg },
  header: { paddingTop: QF.spacing.xl + 16, paddingHorizontal: QF.spacing.lg, paddingBottom: QF.spacing.sm },
  title: { fontSize: QF.font.xxl, fontWeight: '800', color: QF.colors.textPrimary, marginBottom: QF.spacing.md },
  tabs: { flexDirection: 'row', gap: QF.spacing.xs },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: QF.radius.lg,
    backgroundColor: QF.colors.surface, alignItems: 'center',
    borderWidth: 1, borderColor: QF.colors.cardBorder,
  },
  tabActive: { backgroundColor: QF.colors.stats.fuerza.dim, borderColor: QF.colors.stats.fuerza.main },
  tabText: { fontSize: QF.font.sm, fontWeight: '600', color: QF.colors.textMuted },
  tabTextActive: { color: QF.colors.stats.fuerza.main },

  body: { flex: 1 },
  bodyContent: { padding: QF.spacing.lg },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: QF.colors.textMuted,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: QF.spacing.sm, marginTop: QF.spacing.md,
  },
  card: {
    backgroundColor: QF.colors.surface, borderRadius: QF.radius.xxl,
    borderWidth: 1, borderColor: QF.colors.cardBorder, padding: QF.spacing.lg,
    alignItems: 'center', gap: QF.spacing.md,
  },
  emptyCard: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: QF.colors.textMuted, fontSize: QF.font.md },

  musculoChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  musculoChip: {
    backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: QF.radius.full,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', paddingHorizontal: 10, paddingVertical: 3,
  },
  musculoChipText: { fontSize: 11, fontWeight: '600', color: QF.colors.stats.fuerza.main },

  vistaToggle: { flexDirection: 'row', gap: QF.spacing.sm, marginBottom: QF.spacing.md },
  vistaBtn: {
    flex: 1, paddingVertical: 10, borderRadius: QF.radius.xl,
    backgroundColor: QF.colors.surface, alignItems: 'center',
    borderWidth: 1, borderColor: QF.colors.cardBorder,
  },
  vistaBtnActive: { backgroundColor: QF.colors.accentGlow, borderColor: QF.colors.accent },
  vistaBtnText: { fontSize: QF.font.sm, fontWeight: '700', color: QF.colors.textSecondary },
  vistaBtnTextActive: { color: QF.colors.accent },

  ejCard: {
    backgroundColor: QF.colors.surface, borderRadius: QF.radius.xl,
    borderWidth: 1, borderColor: QF.colors.cardBorder,
    padding: QF.spacing.md, marginBottom: QF.spacing.sm,
  },
  ejCardSelected: { borderColor: QF.colors.stats.fuerza.main, backgroundColor: QF.colors.elevated },
  ejHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ejNombre: { fontSize: QF.font.md, fontWeight: '700', color: QF.colors.textPrimary },
  ejMeta: { fontSize: QF.font.sm, fontWeight: '600', color: QF.colors.stats.fuerza.main },
  ejDetail: { marginTop: QF.spacing.md, alignItems: 'center', gap: QF.spacing.sm },
  ejChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },

  diaCard: {
    backgroundColor: QF.colors.surface, borderRadius: QF.radius.xl,
    borderWidth: 1, borderColor: QF.colors.cardBorder,
    padding: QF.spacing.md, marginBottom: QF.spacing.sm,
  },
  diaCardHoy: { borderColor: QF.colors.stats.fuerza.main, backgroundColor: QF.colors.elevated },
  diaNombre: { fontSize: QF.font.md, fontWeight: '800', color: QF.colors.textPrimary, marginBottom: 4 },
  descansoText: { fontSize: QF.font.sm, color: QF.colors.textMuted, fontStyle: 'italic' },
  diaEj: { fontSize: QF.font.sm, color: QF.colors.textSecondary, marginTop: 2 },

  fieldRow: { width: '100%', gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: QF.colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: {
    backgroundColor: QF.colors.bg, borderRadius: QF.radius.lg,
    borderWidth: 1, borderColor: QF.colors.cardBorder,
    padding: QF.spacing.md, color: QF.colors.textPrimary, fontSize: QF.font.md,
  },
  btnPrimary: {
    width: '100%', backgroundColor: QF.colors.stats.fuerza.main,
    borderRadius: QF.radius.xl, paddingVertical: 14, alignItems: 'center', marginTop: QF.spacing.sm,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: QF.font.md },

  logCard: {
    backgroundColor: QF.colors.surface, borderRadius: QF.radius.xl,
    borderWidth: 1, borderColor: QF.colors.cardBorder, borderLeftWidth: 3,
    borderLeftColor: QF.colors.stats.fuerza.main,
    padding: QF.spacing.md, marginBottom: QF.spacing.sm,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  logLeft: { flex: 1 },
  logRight: { alignItems: 'flex-end' },
  logNombre: { fontSize: QF.font.md, fontWeight: '700', color: QF.colors.textPrimary },
  logDate: { fontSize: 11, color: QF.colors.textMuted, marginTop: 2 },
  logStat: { fontSize: QF.font.sm, fontWeight: '700', color: QF.colors.stats.fuerza.main },
  logPeso: { fontSize: 11, color: QF.colors.textSecondary },

  timerCard: {
    backgroundColor: QF.colors.surface, borderRadius: QF.radius.xxl,
    borderWidth: 1, borderColor: QF.colors.cardBorder,
    padding: QF.spacing.xl, alignItems: 'center', gap: QF.spacing.lg,
  },
  timerRing: { alignItems: 'center', justifyContent: 'center' },
  timerFill: {
    width: 160, height: 160, borderRadius: 80, borderWidth: 6,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: QF.colors.elevated,
  },
  timerText: { fontSize: 40, fontWeight: '900', color: QF.colors.textPrimary, fontVariant: ['tabular-nums'] },
  timerBtns: { flexDirection: 'row', gap: QF.spacing.sm },
  timerPreset: {
    backgroundColor: QF.colors.bg, borderRadius: QF.radius.lg,
    borderWidth: 1, borderColor: QF.colors.cardBorder,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  timerPresetText: { fontSize: QF.font.sm, fontWeight: '700', color: QF.colors.textSecondary },
});
