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
import { db } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';

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
  { key: 'rutinas', label: 'Rutinas' },
  { key: 'registrar', label: 'Registrar' },
  { key: 'historial', label: 'Historial' },
  { key: 'cronometro', label: 'Timer' },
];

export default function GymScreen() {
  const { usuario } = useUsuario();
  const [seccion, setSeccion] = useState<Seccion>('rutinas');

  // --- Rutinas ---
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [nombreRutina, setNombreRutina] = useState('');
  const [ejerciciosRutina, setEjerciciosRutina] = useState('');

  // --- Registrar ---
  const [nombreEj, setNombreEj] = useState('');
  const [series, setSeries] = useState('');
  const [reps, setReps] = useState('');
  const [peso, setPeso] = useState('');

  // --- Historial ---
  const [historial, setHistorial] = useState<EjercicioRegistrado[]>([]);

  // --- Cronómetro ---
  const [tiempoTotal, setTiempoTotal] = useState(60);
  const [tiempoRestante, setTiempoRestante] = useState(60);
  const [corriendo, setCorriendo] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Escucha en tiempo real de Firestore
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

  // Cronómetro
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

  // Rutinas
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

  // Registrar ejercicio
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

  // Cronómetro
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

  // --- Renders ---

  const renderRutinas = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.subtitulo}>Nueva rutina</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre de la rutina"
        placeholderTextColor="#aaa"
        value={nombreRutina}
        onChangeText={setNombreRutina}
      />
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="Ejercicios (ej: Sentadilla, Press banca...)"
        placeholderTextColor="#aaa"
        value={ejerciciosRutina}
        onChangeText={setEjerciciosRutina}
        multiline
      />
      <TouchableOpacity style={styles.boton} onPress={guardarRutina}>
        <Text style={styles.textoBoton}>Guardar rutina</Text>
      </TouchableOpacity>

      {rutinas.length > 0 && (
        <>
          <Text style={[styles.subtitulo, { marginTop: 28 }]}>Mis rutinas</Text>
          {rutinas.map((r) => (
            <View key={r.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitulo}>{r.nombre}</Text>
                {r.ejercicios ? (
                  <Text style={styles.cardSubtexto}>{r.ejercicios}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => eliminarRutina(r.id)}>
                <Text style={styles.eliminar}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );

  const renderRegistrar = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.subtitulo}>Registrar ejercicio</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del ejercicio"
        placeholderTextColor="#aaa"
        value={nombreEj}
        onChangeText={setNombreEj}
      />
      <View style={styles.fila}>
        <TextInput
          style={[styles.input, styles.inputFila]}
          placeholder="Series"
          placeholderTextColor="#aaa"
          value={series}
          onChangeText={setSeries}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.inputFila]}
          placeholder="Reps"
          placeholderTextColor="#aaa"
          value={reps}
          onChangeText={setReps}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.inputFila]}
          placeholder="Peso kg"
          placeholderTextColor="#aaa"
          value={peso}
          onChangeText={setPeso}
          keyboardType="numeric"
        />
      </View>
      <TouchableOpacity style={styles.boton} onPress={registrarEjercicio}>
        <Text style={styles.textoBoton}>Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderHistorial = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.subtitulo}>Historial</Text>
      {historial.length === 0 ? (
        <Text style={styles.vacio}>No hay ejercicios registrados aún.</Text>
      ) : (
        historial.map((e) => (
          <View key={e.id} style={styles.card}>
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
        ))
      )}
    </ScrollView>
  );

  const renderCronometro = () => {
    const progreso = tiempoTotal > 0 ? tiempoRestante / tiempoTotal : 0;
    const color = progreso > 0.5 ? 'lightgreen' : progreso > 0.25 ? '#f0c040' : 'tomato';
    return (
      <View style={styles.centrado}>
        <Text style={[styles.cronometroTexto, { color }]}>
          {formatearTiempo(tiempoRestante)}
        </Text>
        <Text style={styles.subtitulo}>Descanso</Text>
        <View style={styles.fila}>
          {[30, 60, 90, 120].map((seg) => (
            <TouchableOpacity
              key={seg}
              style={[styles.botonTiempo, tiempoTotal === seg && styles.botonTiempoActivo]}
              onPress={() => seleccionarTiempo(seg)}
            >
              <Text style={styles.textoBoton}>{seg}s</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.fila, { marginTop: 24, gap: 12 }]}>
          <TouchableOpacity style={[styles.boton, { flex: 1 }]} onPress={iniciarPausar}>
            <Text style={styles.textoBoton}>{corriendo ? 'Pausar' : 'Iniciar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.boton, { flex: 1, backgroundColor: '#333' }]}
            onPress={resetear}
          >
            <Text style={styles.textoBoton}>Reiniciar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Gym</Text>

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
        {seccion === 'rutinas' && renderRutinas()}
        {seccion === 'registrar' && renderRegistrar()}
        {seccion === 'historial' && renderHistorial()}
        {seccion === 'cronometro' && renderCronometro()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#fff', paddingHorizontal: 20, marginBottom: 16 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1a1a1a', alignItems: 'center' },
  tabActivo: { backgroundColor: '#fff' },
  tabTexto: { color: '#888', fontSize: 12, fontWeight: '600' },
  tabTextoActivo: { color: '#000' },
  contenido: { flex: 1, paddingHorizontal: 20 },
  subtitulo: { fontSize: 16, fontWeight: '600', color: '#aaa', marginBottom: 12 },
  input: { backgroundColor: '#1e1e1e', color: '#fff', padding: 14, borderRadius: 10, fontSize: 16, marginBottom: 12 },
  fila: { flexDirection: 'row', gap: 8 },
  inputFila: { flex: 1, marginBottom: 12 },
  boton: { backgroundColor: '#fff', padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
  textoBoton: { color: '#000', fontSize: 15, fontWeight: '600' },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  cardTitulo: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cardSubtexto: { color: '#aaa', fontSize: 13, marginTop: 4 },
  cardFecha: { color: '#555', fontSize: 12, marginTop: 4 },
  eliminar: { color: 'tomato', fontSize: 20, paddingLeft: 12 },
  vacio: { color: '#555', fontSize: 15, textAlign: 'center', marginTop: 40 },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cronometroTexto: { fontSize: 80, fontWeight: '200', letterSpacing: 4, marginBottom: 8 },
  botonTiempo: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#1a1a1a', alignItems: 'center' },
  botonTiempoActivo: { backgroundColor: '#333', borderWidth: 1, borderColor: '#fff' },
});
