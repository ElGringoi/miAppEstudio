import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
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

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Evento = {
  id: string;
  titulo: string;
  hora: string;
  lugar: string;
  fecha: string;
};

type Habito = {
  id: string;
  nombre: string;
  stat: string;
  fechaCompletado: string | null;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const HOY = new Date().toISOString().slice(0, 10);

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const STAT_COLOR: Record<string, string> = {
  fuerza: '#ef4444',
  inteligencia: '#60a5fa',
  carisma: '#fbbf24',
  agilidad: '#34d399',
  resistencia: '#a78bfa',
  sabiduria: '#22d3ee',
};

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function AgendaScreen() {
  const { usuario } = useUsuario();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [tituloEvento, setTituloEvento] = useState('');
  const [horaEvento, setHoraEvento] = useState('');
  const [lugarEvento, setLugarEvento] = useState('');

  const ahora = new Date();
  const fechaTexto = `${DIAS[ahora.getDay()]}, ${ahora.getDate()} de ${MESES[ahora.getMonth()]} de ${ahora.getFullYear()}`;
  const hora = ahora.getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  useEffect(() => {
    if (!usuario) return;
    const uid = usuario.uid;

    // Eventos ordenados por hora — filtrado en cliente para evitar índice compuesto
    const cancelarEventos = onSnapshot(
      query(collection(db, 'usuarios', uid, 'agenda_eventos'), orderBy('hora')),
      (snap) => {
        const todos = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Evento, 'id'>) }));
        setEventos(todos.filter((e) => e.fecha === HOY));
      }
    );

    const cancelarHabitos = onSnapshot(
      query(collection(db, 'usuarios', uid, 'rpg_habitos'), orderBy('nombre')),
      (snap) => {
        setHabitos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Habito, 'id'>) })));
      }
    );

    return () => {
      cancelarEventos();
      cancelarHabitos();
    };
  }, [usuario]);

  // ── Eventos ───────────────────────────────────────────────────────────────

  const agregarEvento = async () => {
    if (!usuario || !tituloEvento.trim() || !horaEvento.trim()) return;
    await addDoc(collection(db, 'usuarios', usuario.uid, 'agenda_eventos'), {
      titulo: tituloEvento.trim(),
      hora: horaEvento.trim(),
      lugar: lugarEvento.trim(),
      fecha: HOY,
    });
    setTituloEvento('');
    setHoraEvento('');
    setLugarEvento('');
    setFormularioAbierto(false);
  };

  const eliminarEvento = async (id: string) => {
    if (!usuario) return;
    await deleteDoc(doc(db, 'usuarios', usuario.uid, 'agenda_eventos', id));
  };

  // ── Hábitos ───────────────────────────────────────────────────────────────

  const toggleHabito = async (habito: Habito) => {
    if (!usuario) return;
    const completadoHoy = habito.fechaCompletado === HOY;
    const habitoRef = doc(db, 'usuarios', usuario.uid, 'rpg_habitos', habito.id);
    const statsRef = doc(db, 'usuarios', usuario.uid, 'rpg_stats', 'datos');

    if (!completadoHoy) {
      await updateDoc(habitoRef, { fechaCompletado: HOY });
      await updateDoc(statsRef, { [`${habito.stat}.xp`]: increment(20) });
    } else {
      await updateDoc(habitoRef, { fechaCompletado: null });
      await updateDoc(statsRef, { [`${habito.stat}.xp`]: increment(-20) });
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const completadosHoy = habitos.filter((h) => h.fechaCompletado === HOY).length;
  const porcentaje = habitos.length > 0 ? Math.round((completadosHoy / habitos.length) * 100) : 0;

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.saludo}>{saludo} 👋</Text>
        <Text style={styles.titulo}>Mi Agenda</Text>
        <Text style={styles.fecha}>{fechaTexto}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Agenda del día ───────────────────────────────────────── */}
        <View style={styles.tarjeta}>
          <View style={styles.tarjetaHeader}>
            <View style={styles.tarjetaTituloFila}>
              <Text style={styles.tarjetaIcono}>📅</Text>
              <Text style={styles.tarjetaTitulo}>Agenda del día</Text>
            </View>
            <TouchableOpacity
              style={styles.btnAzul}
              onPress={() => setFormularioAbierto((v) => !v)}
            >
              <Text style={styles.btnAzulTexto}>+ Agregar</Text>
            </TouchableOpacity>
          </View>

          {/* Formulario inline */}
          {formularioAbierto && (
            <View style={styles.formulario}>
              <TextInput
                style={styles.input}
                placeholder="Nombre del evento"
                placeholderTextColor="#555"
                value={tituloEvento}
                onChangeText={setTituloEvento}
                autoFocus
              />
              <View style={styles.fila}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Hora (09:00)"
                  placeholderTextColor="#555"
                  value={horaEvento}
                  onChangeText={setHoraEvento}
                />
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Lugar (opcional)"
                  placeholderTextColor="#555"
                  value={lugarEvento}
                  onChangeText={setLugarEvento}
                />
              </View>
              <View style={styles.fila}>
                <TouchableOpacity style={[styles.btnAzul, { flex: 1, paddingVertical: 10 }]} onPress={agregarEvento}>
                  <Text style={styles.btnAzulTexto}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGris, { flex: 1, paddingVertical: 10 }]}
                  onPress={() => setFormularioAbierto(false)}
                >
                  <Text style={styles.btnGrisTexto}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {eventos.length === 0 ? (
            <Text style={styles.vacio}>No hay eventos hoy. ¡Agregá uno!</Text>
          ) : (
            eventos.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={styles.eventoFila}
                onLongPress={() => eliminarEvento(e.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.eventoHora}>{e.hora}</Text>
                <View style={styles.eventoLinea} />
                <View style={styles.eventoContenido}>
                  <Text style={styles.eventoTitulo}>{e.titulo}</Text>
                  {!!e.lugar && <Text style={styles.eventoLugar}>📍 {e.lugar}</Text>}
                </View>
              </TouchableOpacity>
            ))
          )}
          {eventos.length > 0 && (
            <Text style={styles.hint}>Mantené presionado para eliminar un evento</Text>
          )}
        </View>

        {/* ── Habit Tracker ─────────────────────────────────────────── */}
        <View style={styles.tarjeta}>
          <View style={styles.tarjetaHeader}>
            <View style={styles.tarjetaTituloFila}>
              <Text style={styles.tarjetaIcono}>✨</Text>
              <Text style={styles.tarjetaTitulo}>Hábitos</Text>
            </View>
            <Text style={styles.porcentajeTexto}>{porcentaje}% Hecho</Text>
          </View>

          {/* Barra de progreso total */}
          {habitos.length > 0 && (
            <View style={styles.barraContenedor}>
              <View style={[styles.barraRelleno, { width: `${porcentaje}%` as `${number}%` }]} />
            </View>
          )}

          {habitos.length === 0 ? (
            <Text style={styles.vacio}>Agregá hábitos desde la pantalla RPG.</Text>
          ) : (
            habitos.map((h) => {
              const completadoHoy = h.fechaCompletado === HOY;
              const color = STAT_COLOR[h.stat] ?? '#60a5fa';
              return (
                <TouchableOpacity
                  key={h.id}
                  style={styles.habitoFila}
                  onPress={() => toggleHabito(h)}
                  activeOpacity={0.75}
                >
                  <View style={[
                    styles.habitoCirculo,
                    completadoHoy && { backgroundColor: color, borderColor: color },
                  ]}>
                    {completadoHoy && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.habitoNombre, completadoHoy && styles.habitoTachado]}>
                      {h.nombre}
                    </Text>
                    <Text style={[styles.habitoStat, { color }]}>+20 XP</Text>
                  </View>
                  {completadoHoy && (
                    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
                      <Text style={[styles.badgeTexto, { color }]}>Completado</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const AZUL = '#137fec';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  saludo: { color: '#666', fontSize: 14, marginBottom: 2 },
  titulo: { fontSize: 30, fontWeight: '800', color: '#fff' },
  fecha: { color: AZUL, fontSize: 13, marginTop: 4, fontWeight: '500' },

  scroll: { padding: 20, paddingBottom: 48, gap: 16 },

  // Tarjeta
  tarjeta: {
    backgroundColor: '#0e0e0e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  tarjetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tarjetaTituloFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tarjetaIcono: { fontSize: 18 },
  tarjetaTitulo: { fontSize: 17, fontWeight: '700', color: '#fff' },

  // Botones
  btnAzul: {
    backgroundColor: AZUL,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnAzulTexto: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnGris: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnGrisTexto: { color: '#aaa', fontWeight: '600', fontSize: 13 },

  // Formulario
  formulario: { gap: 10, marginBottom: 16 },
  fila: { flexDirection: 'row', gap: 8 },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
  },

  // Eventos
  eventoFila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  eventoHora: { color: '#555', fontSize: 12, width: 48, paddingTop: 4, fontWeight: '500' },
  eventoLinea: { width: 3, borderRadius: 2, backgroundColor: AZUL, height: 44, marginTop: 2 },
  eventoContenido: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 12,
  },
  eventoTitulo: { color: '#fff', fontSize: 15, fontWeight: '600' },
  eventoLugar: { color: '#555', fontSize: 12, marginTop: 4 },
  hint: { color: '#333', fontSize: 11, textAlign: 'center', marginTop: 4 },

  // Progreso hábitos
  barraContenedor: {
    height: 5,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  barraRelleno: { height: '100%', backgroundColor: AZUL, borderRadius: 3 },
  porcentajeTexto: { color: AZUL, fontSize: 13, fontWeight: '600' },

  // Hábitos
  habitoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#151515',
  },
  habitoCirculo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  habitoNombre: { color: '#ddd', fontSize: 15 },
  habitoTachado: { textDecorationLine: 'line-through', color: '#444' },
  habitoStat: { fontSize: 11, marginTop: 2 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeTexto: { fontSize: 11, fontWeight: '600' },

  vacio: { color: '#333', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});
