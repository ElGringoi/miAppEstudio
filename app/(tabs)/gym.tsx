import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { db } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';
import { colors, radius, spacing, font, shadow } from '@/constants/theme';

type Seccion = 'rutinas' | 'registrar' | 'historial' | 'cronometro';

type Rutina = {
  id: string;
  nombre: string;
  ejercicios: string;
};

type EjercicioRegistrado = {
  id: string;
  nombre: string;
  series: string;
  repeticiones: string;
  peso: string;
  fecha: string;
};

const SECCIONES: { key: Seccion; label: string }[] = [
  { key: 'rutinas',    label: 'Rutinas'   },
  { key: 'registrar',  label: 'Registrar' },
  { key: 'historial',  label: 'Historial' },
  { key: 'cronometro', label: 'Timer'     },
];

const GYM_RED = colors.error;

export default function GymScreen() {
  const { usuario } = useUsuario();
  const [seccion, setSeccion] = useState<Seccion>('rutinas');

  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [nombreRutina, setNombreRutina] = useState('');
  const [ejerciciosRutina, setEjerciciosRutina] = useState('');

  const [nombreEj, setNombreEj] = useState('');
  const [series, setSeries] = useState('');
  const [reps, setReps] = useState('');
  const [peso, setPeso] = useState('');

  const [historial, setHistorial] = useState<EjercicioRegistrado[]>([]);

  const [tiempoTotal, setTiempoTotal] = useState(60);
  const [tiempoRestante, setTiempoRestante] = useState(60);
  const [corriendo, setCorriendo] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!usuario) return;

    const cancelarRutinas = onSnapshot(
      query(collection(db, 'usuarios', usuario.uid, 'gym_rutinas'), orderBy('nombre')),
      (snap) => {
        setRutinas(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Rutina, 'id'>) })));
      }
    );

    const cancelarHistorial = onSnapshot(
      query(collection(db, 'usuarios', usuario.uid, 'gym_historial'), orderBy('fecha', 'desc')),
      (snap) => {
        setHistorial(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EjercicioRegistrado, 'id'>) }))
        );
      }
    );

    return () => {
      cancelarRutinas();
      cancelarHistorial();
    };
  }, [usuario]);

  useEffect(() => {
    if (corriendo) {
      intervaloRef.current = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(intervaloRef.current!);
            setCorriendo(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    }
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [corriendo]);

  const guardarRutina = async () => {
    if (!usuario || !nombreRutina.trim()) return;
    await addDoc(collection(db, 'usuarios', usuario.uid, 'gym_rutinas'), {
      nombre: nombreRutina.trim(),
      ejercicios: ejerciciosRutina.trim(),
    });
    setNombreRutina('');
    setEjerciciosRutina('');
  };

  const eliminarRutina = async (id: string) => {
    if (!usuario) return;
    await deleteDoc(doc(db, 'usuarios', usuario.uid, 'gym_rutinas', id));
  };

  const registrarEjercicio = async () => {
    if (!usuario || !nombreEj.trim()) return;
    await addDoc(collection(db, 'usuarios', usuario.uid, 'gym_historial'), {
      nombre: nombreEj.trim(),
      series: series.trim(),
      repeticiones: reps.trim(),
      peso: peso.trim(),
      fecha: new Date().toISOString(),
    });
    setNombreEj('');
    setSeries('');
    setReps('');
    setPeso('');
  };

  const iniciarPausar = () => setCorriendo((prev) => !prev);

  const resetear = () => {
    setCorriendo(false);
    setTiempoRestante(tiempoTotal);
  };

  const seleccionarTiempo = (segundos: number) => {
    setCorriendo(false);
    setTiempoTotal(segundos);
    setTiempoRestante(segundos);
  };

  const formatearTiempo = (seg: number) => {
    const m = Math.floor(seg / 60).toString().padStart(2, '0');
    const s = (seg % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const renderRutinas = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.hh }}>
      <Text style={styles.label}>NUEVA RUTINA</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre de la rutina"
        placeholderTextColor={colors.textMuted}
        value={nombreRutina}
        onChangeText={setNombreRutina}
      />
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="Ejercicios (ej: Sentadilla, Press banca...)"
        placeholderTextColor={colors.textMuted}
        value={ejerciciosRutina}
        onChangeText={setEjerciciosRutina}
        multiline
      />
      <TouchableOpacity style={styles.btnPrimario} onPress={guardarRutina}>
        <MaterialIcons name="save" size={18} color="#fff" />
        <Text style={styles.btnPrimarioTexto}>Guardar rutina</Text>
      </TouchableOpacity>

      {rutinas.length > 0 && (
        <>
          <Text style={[styles.label, { marginTop: spacing.xxl }]}>MIS RUTINAS</Text>
          {rutinas.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={styles.rutinaIconBadge}>
                <MaterialIcons name="fitness-center" size={18} color={GYM_RED} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitulo}>{r.nombre}</Text>
                {!!r.ejercicios && <Text style={styles.cardSubtexto}>{r.ejercicios}</Text>}
              </View>
              <TouchableOpacity onPress={() => eliminarRutina(r.id)} style={styles.btnEliminar}>
                <MaterialIcons name="delete-outline" size={20} color={GYM_RED} />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );

  const renderRegistrar = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.hh }}>
      <Text style={styles.label}>REGISTRAR EJERCICIO</Text>

      <Text style={styles.inputLabel}>Nombre del ejercicio</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Sentadilla, Press banca..."
        placeholderTextColor={colors.textMuted}
        value={nombreEj}
        onChangeText={setNombreEj}
      />

      <View style={styles.fila}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Series</Text>
          <TextInput
            style={styles.input}
            placeholder="4"
            placeholderTextColor={colors.textMuted}
            value={series}
            onChangeText={setSeries}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Repeticiones</Text>
          <TextInput
            style={styles.input}
            placeholder="10"
            placeholderTextColor={colors.textMuted}
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="60"
            placeholderTextColor={colors.textMuted}
            value={peso}
            onChangeText={setPeso}
            keyboardType="numeric"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.btnGuardar} onPress={registrarEjercicio}>
        <MaterialIcons name="check-circle" size={18} color="#fff" />
        <Text style={styles.btnGuardarTexto}>Guardar ejercicio</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderHistorial = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.hh }}>
      <Text style={styles.label}>HISTORIAL</Text>
      {historial.length === 0 ? (
        <View style={styles.vacioCentro}>
          <MaterialIcons name="history" size={40} color={colors.textMuted} />
          <Text style={styles.vacio}>No hay ejercicios registrados aún.</Text>
        </View>
      ) : (
        historial.map((e) => (
          <View key={e.id} style={styles.card}>
            <View style={styles.rutinaIconBadge}>
              <MaterialIcons name="fitness-center" size={18} color={GYM_RED} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitulo}>{e.nombre}</Text>
              <Text style={styles.cardSubtexto}>
                {[
                  e.series && `${e.series} series`,
                  e.repeticiones && `${e.repeticiones} reps`,
                  e.peso && `${e.peso} kg`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <Text style={styles.cardFecha}>
                {new Date(e.fecha).toLocaleDateString('es-AR')}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderCronometro = () => {
    const progreso = tiempoTotal > 0 ? tiempoRestante / tiempoTotal : 0;
    const barColor = progreso > 0.5 ? colors.success : progreso > 0.25 ? colors.stat.carisma : GYM_RED;
    return (
      <View style={styles.cronoCentro}>
        <Text style={[styles.cronometroTexto, { color: GYM_RED }]}>
          {formatearTiempo(tiempoRestante)}
        </Text>

        <View style={styles.barraContenedor}>
          <View style={[styles.barraRelleno, { width: `${progreso * 100}%` as `${number}%`, backgroundColor: barColor }]} />
        </View>

        <Text style={styles.label}>TIEMPO DE DESCANSO</Text>

        <View style={styles.presetsContainer}>
          {[30, 60, 90, 120].map((seg) => (
            <TouchableOpacity
              key={seg}
              style={[styles.presetBtn, tiempoTotal === seg && styles.presetBtnActivo]}
              onPress={() => seleccionarTiempo(seg)}
            >
              <Text style={[styles.presetTexto, tiempoTotal === seg && styles.presetTextoActivo]}>
                {seg}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.fila}>
          <TouchableOpacity style={[styles.btnCrono, { flex: 2 }]} onPress={iniciarPausar}>
            <MaterialIcons name={corriendo ? 'pause' : 'play-arrow'} size={22} color="#fff" />
            <Text style={styles.btnCronoTexto}>{corriendo ? 'Pausar' : 'Iniciar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnCronoGris, { flex: 1 }]} onPress={resetear}>
            <MaterialIcons name="refresh" size={20} color={colors.textSec} />
            <Text style={styles.btnCronoGrisTexto}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBadge}>
            <MaterialIcons name="fitness-center" size={22} color={GYM_RED} />
          </View>
          <Text style={styles.headerTitulo}>GYM</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {SECCIONES.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.tab, seccion === s.key && styles.tabActivo]}
            onPress={() => setSeccion(s.key)}
          >
            <Text style={[styles.tabTexto, seccion === s.key && styles.tabTextoActivo]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.contenido}>
        {seccion === 'rutinas'    && renderRutinas()}
        {seccion === 'registrar'  && renderRegistrar()}
        {seccion === 'historial'  && renderHistorial()}
        {seccion === 'cronometro' && renderCronometro()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadow.card,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: { fontSize: font.xl, fontWeight: '900', color: colors.text, letterSpacing: 1 },

  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActivo:      { backgroundColor: GYM_RED, borderColor: GYM_RED },
  tabTexto:       { color: colors.textSec, fontSize: font.sm, fontWeight: '700' },
  tabTextoActivo: { color: '#fff' },

  contenido: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.sm },

  label: { fontSize: font.xs, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8, marginBottom: spacing.sm },
  inputLabel: { fontSize: font.sm, fontWeight: '600', color: colors.textSec, marginBottom: spacing.xs },

  input: {
    backgroundColor: colors.card,
    color: colors.text,
    padding: spacing.md,
    borderRadius: radius.md,
    fontSize: font.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },

  fila: { flexDirection: 'row', gap: spacing.sm },

  btnPrimario: {
    backgroundColor: GYM_RED,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    shadowColor: GYM_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  btnPrimarioTexto: { color: '#fff', fontSize: font.base, fontWeight: '700' },

  btnGuardar: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    ...shadow.blue,
  },
  btnGuardarTexto: { color: '#fff', fontSize: font.base, fontWeight: '700' },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.card,
  },
  rutinaIconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitulo:   { fontSize: font.base, fontWeight: '700', color: colors.text },
  cardSubtexto: { fontSize: font.sm, color: colors.textSec, marginTop: 2 },
  cardFecha:    { fontSize: font.xs, color: colors.textMuted, marginTop: 2 },
  btnEliminar:  { padding: spacing.xs },

  vacioCentro: { alignItems: 'center', paddingTop: spacing.hh, gap: spacing.md },
  vacio: { color: colors.textMuted, fontSize: font.base, textAlign: 'center' },

  cronoCentro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  cronometroTexto: {
    fontSize: 88,
    fontWeight: '200',
    letterSpacing: 4,
  },

  barraContenedor: {
    width: '100%',
    height: 8,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  barraRelleno: { height: '100%', borderRadius: radius.full },

  presetsContainer: { flexDirection: 'row', gap: spacing.sm },
  presetBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetBtnActivo: { backgroundColor: GYM_RED, borderColor: GYM_RED },
  presetTexto:     { color: colors.textSec, fontSize: font.base, fontWeight: '700' },
  presetTextoActivo: { color: '#fff' },

  btnCrono: {
    backgroundColor: GYM_RED,
    padding: spacing.lg,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: GYM_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnCronoTexto: { color: '#fff', fontSize: font.lg, fontWeight: '700' },

  btnCronoGris: {
    backgroundColor: colors.cardAlt,
    padding: spacing.lg,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnCronoGrisTexto: { color: colors.textSec, fontSize: font.base, fontWeight: '700' },
});
