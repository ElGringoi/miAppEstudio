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
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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

const HOY = new Date().toISOString().slice(0, 10);

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const STAT_COLOR: Record<string, string> = {
  fuerza:       colors.stat.fuerza,
  inteligencia: colors.stat.inteligencia,
  carisma:      colors.stat.carisma,
  agilidad:     colors.stat.agilidad,
  resistencia:  colors.stat.resistencia,
  sabiduria:    colors.stat.sabiduria,
};

const STAT_ICON: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  fuerza:       'fitness-center',
  inteligencia: 'psychology',
  carisma:      'people',
  agilidad:     'bolt',
  resistencia:  'favorite',
  sabiduria:    'menu-book',
};

export default function AgendaScreen() {
  const { usuario } = useUsuario();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [tituloEvento, setTituloEvento] = useState('');
  const [horaEvento, setHoraEvento] = useState('');
  const [lugarEvento, setLugarEvento] = useState('');

  const animVals = useRef<Record<string, Animated.Value>>({}).current;

  const getAnim = (id: string) => {
    if (!animVals[id]) animVals[id] = new Animated.Value(1);
    return animVals[id];
  };

  const toggleHabitoAnimado = (h: Habito) => {
    const anim = getAnim(h.id);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    toggleHabito(h);
  };

  const ahora = new Date();
  const fechaTexto = `${DIAS[ahora.getDay()]}, ${ahora.getDate()} de ${MESES[ahora.getMonth()]} de ${ahora.getFullYear()}`;
  const hora = ahora.getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  useEffect(() => {
    if (!usuario) return;
    const uid = usuario.uid;

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

  const completadosHoy = habitos.filter((h) => h.fechaCompletado === HOY).length;
  const porcentaje = habitos.length > 0 ? Math.round((completadosHoy / habitos.length) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.saludo}>{saludo} 👋</Text>
        <Text style={styles.titulo}>MI AGENDA</Text>
        <Text style={styles.fecha}>{fechaTexto}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={styles.seccionLabel}>AGENDA DEL DÍA</Text>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTituloFila}>
              <View style={styles.calIconBadge}>
                <MaterialIcons name="event" size={18} color={colors.accent} />
              </View>
              <Text style={styles.cardTitulo}>Agenda del día</Text>
            </View>
            <TouchableOpacity
              style={styles.btnAgregar}
              onPress={() => setFormularioAbierto((v) => !v)}
            >
              <MaterialIcons name="add" size={16} color={colors.accent} />
              <Text style={styles.btnAgregarTexto}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {formularioAbierto && (
            <View style={styles.formulario}>
              <TextInput
                style={styles.input}
                placeholder="Nombre del evento"
                placeholderTextColor={colors.textMuted}
                value={tituloEvento}
                onChangeText={setTituloEvento}
                autoFocus
              />
              <View style={styles.fila}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Hora (09:00)"
                  placeholderTextColor={colors.textMuted}
                  value={horaEvento}
                  onChangeText={setHoraEvento}
                />
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="Lugar (opcional)"
                  placeholderTextColor={colors.textMuted}
                  value={lugarEvento}
                  onChangeText={setLugarEvento}
                />
              </View>
              <View style={styles.fila}>
                <TouchableOpacity style={[styles.btnPrimario, { flex: 1 }]} onPress={agregarEvento}>
                  <Text style={styles.btnPrimarioTexto}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSecundario, { flex: 1 }]}
                  onPress={() => setFormularioAbierto(false)}
                >
                  <Text style={styles.btnSecundarioTexto}>Cancelar</Text>
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
                  {!!e.lugar && (
                    <View style={styles.eventoLugarFila}>
                      <MaterialIcons name="place" size={12} color={colors.textMuted} />
                      <Text style={styles.eventoLugar}>{e.lugar}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
          {eventos.length > 0 && (
            <Text style={styles.hint}>Mantené presionado para eliminar</Text>
          )}
        </View>

        <View style={styles.seccionHeaderFila}>
          <Text style={styles.seccionLabel}>HÁBITOS</Text>
          <View style={styles.porcentajeBadge}>
            <Text style={styles.porcentajeTexto}>{porcentaje}%</Text>
          </View>
        </View>

        {habitos.length > 0 && (
          <View style={styles.barraContenedor}>
            <View style={[styles.barraRelleno, { width: `${porcentaje}%` as `${number}%` }]} />
          </View>
        )}

        <View style={styles.card}>
          {habitos.length === 0 ? (
            <Text style={styles.vacio}>Agregá hábitos desde la pantalla RPG.</Text>
          ) : (
            habitos.map((h, idx) => {
              const completadoHoy = h.fechaCompletado === HOY;
              const color = STAT_COLOR[h.stat] ?? colors.accent;
              const icon = STAT_ICON[h.stat] ?? 'star';
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.habitoFila, idx < habitos.length - 1 && styles.habitoFilaBorde]}
                  onPress={() => toggleHabitoAnimado(h)}
                  activeOpacity={0.75}
                >
                  <Animated.View style={{ transform: [{ scale: getAnim(h.id) }] }}>
                    <View style={[styles.iconBadge, { backgroundColor: color + '20' }]}>
                      <MaterialIcons name={icon} size={16} color={color} />
                    </View>
                  </Animated.View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.habitoNombre, completadoHoy && styles.habitoTachado]}>
                      {h.nombre}
                    </Text>
                    <Text style={[styles.habitoStat, { color }]}>+20 XP</Text>
                  </View>
                  {completadoHoy && (
                    <View style={[styles.completadoBadge, { backgroundColor: color + '15', borderColor: color + '40' }]}>
                      <Text style={[styles.completadoTexto, { color }]}>Listo</Text>
                    </View>
                  )}
                  <View style={[styles.checkbox, completadoHoy && { backgroundColor: color, borderColor: color }]}>
                    {completadoHoy && <MaterialIcons name="check" size={13} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    backgroundColor: colors.card,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadow.card,
  },
  saludo: { fontSize: font.sm, color: colors.textSec, marginBottom: 2 },
  titulo: { fontSize: font.title, fontWeight: '900', color: colors.text, letterSpacing: 0.5 },
  fecha:  { fontSize: font.sm, color: colors.accent, marginTop: 2, fontWeight: '600' },

  scroll: { padding: spacing.xl, paddingBottom: spacing.hh, gap: spacing.sm },

  seccionHeaderFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seccionLabel: { fontSize: font.xs, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8, marginBottom: spacing.sm },

  porcentajeBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  porcentajeTexto: { fontSize: font.sm, fontWeight: '700', color: colors.accent },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTituloFila: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  calIconBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitulo: { fontSize: font.lg, fontWeight: '800', color: colors.text },

  btnAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  btnAgregarTexto: { color: colors.accent, fontWeight: '700', fontSize: font.sm },

  formulario: { gap: spacing.sm, marginBottom: spacing.md },
  fila: { flexDirection: 'row', gap: spacing.sm },
  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    padding: spacing.md,
    borderRadius: radius.md,
    fontSize: font.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  btnPrimario: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    ...shadow.blue,
  },
  btnPrimarioTexto: { color: '#fff', fontWeight: '700', fontSize: font.md },
  btnSecundario: {
    backgroundColor: colors.cardAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecundarioTexto: { color: colors.textSec, fontWeight: '600', fontSize: font.md },

  eventoFila: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md, gap: spacing.md },
  eventoHora: { color: colors.textSec, fontSize: font.sm, width: 44, paddingTop: 4, fontWeight: '600' },
  eventoLinea: { width: 3, borderRadius: 2, backgroundColor: colors.accent, height: 44, marginTop: 2 },
  eventoContenido: {
    flex: 1,
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentMid,
  },
  eventoTitulo: { color: colors.text, fontSize: font.base, fontWeight: '700' },
  eventoLugarFila: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  eventoLugar:  { color: colors.textMuted, fontSize: font.sm },
  hint: { color: colors.textMuted, fontSize: font.xs, textAlign: 'center', marginTop: spacing.xs },

  barraContenedor: {
    height: 6,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  barraRelleno: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.full },

  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitoFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  habitoFilaBorde: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  habitoNombre: { fontSize: font.base, color: colors.text, fontWeight: '500' },
  habitoTachado: { textDecorationLine: 'line-through', color: colors.textMuted },
  habitoStat: { fontSize: font.sm, marginTop: 1 },

  completadoBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  completadoTexto: { fontSize: font.xs, fontWeight: '700' },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vacio: { color: colors.textMuted, fontSize: font.md, textAlign: 'center', paddingVertical: spacing.xl },
});
