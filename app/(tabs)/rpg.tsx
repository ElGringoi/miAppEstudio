import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { db } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';
import { colors, radius, spacing, font, shadow } from '@/constants/theme';

type StatKey = 'fuerza' | 'inteligencia' | 'carisma' | 'agilidad' | 'resistencia' | 'sabiduria';

type StatsDoc = Record<StatKey, { xp: number }>;

type Habito = {
  id: string;
  nombre: string;
  stat: StatKey;
  fechaCompletado: string | null;
};

type Mision = {
  id: string;
  titulo: string;
  completada: boolean;
  parentId: string | null;
  orden: number;
};

type Seccion = 'stats' | 'habitos' | 'misiones';

const HOY = new Date().toISOString().slice(0, 10);

const STATS_INFO: Record<StatKey, { label: string; color: string; descripcion: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  fuerza:       { label: 'Fuerza',       color: colors.stat.fuerza,       descripcion: 'Ejercicio y cuerpo',    icon: 'fitness-center' },
  inteligencia: { label: 'Inteligencia', color: colors.stat.inteligencia, descripcion: 'Estudio y aprendizaje', icon: 'psychology'     },
  carisma:      { label: 'Carisma',      color: colors.stat.carisma,      descripcion: 'Conexiones sociales',   icon: 'people'         },
  agilidad:     { label: 'Agilidad',     color: colors.stat.agilidad,     descripcion: 'Orden y productividad', icon: 'bolt'           },
  resistencia:  { label: 'Resistencia',  color: colors.stat.resistencia,  descripcion: 'Sueño e hidratación',   icon: 'favorite'       },
  sabiduria:    { label: 'Sabiduría',    color: colors.stat.sabiduria,    descripcion: 'Mente y meditación',    icon: 'menu-book'      },
};

const STAT_KEYS = Object.keys(STATS_INFO) as StatKey[];

const STATS_INICIALES: StatsDoc = {
  fuerza:       { xp: 0 },
  inteligencia: { xp: 0 },
  carisma:      { xp: 0 },
  agilidad:     { xp: 0 },
  resistencia:  { xp: 0 },
  sabiduria:    { xp: 0 },
};

const SECCIONES: { key: Seccion; label: string }[] = [
  { key: 'stats',    label: 'Atributos' },
  { key: 'habitos',  label: 'Quests'    },
  { key: 'misiones', label: 'Misiones'  },
];

const calcNivel    = (xp: number) => Math.floor(xp / 100) + 1;
const calcXpLocal  = (xp: number) => xp % 100;
const calcProgreso = (xp: number) => (xp % 100) / 100;

type QuestNodeProps = {
  mision: Mision;
  todas: Mision[];
  nivel: number;
  onToggle: (id: string, completada: boolean) => void;
  onAgregarHijo: (parentId: string, titulo: string) => void;
};

function QuestNode({ mision, todas, nivel, onToggle, onAgregarHijo }: QuestNodeProps) {
  const [expandida, setExpandida] = useState(true);
  const [agregarAbierto, setAgregarAbierto] = useState(false);
  const [nuevaSubmision, setNuevaSubmision] = useState('');

  const hijos = todas
    .filter((m) => m.parentId === mision.id)
    .sort((a, b) => a.orden - b.orden);

  const confirmarAgregar = () => {
    if (!nuevaSubmision.trim()) return;
    onAgregarHijo(mision.id, nuevaSubmision.trim());
    setNuevaSubmision('');
    setAgregarAbierto(false);
    setExpandida(true);
  };

  const isRaiz = nivel === 0;

  return (
    <View style={{ marginLeft: nivel * 16, marginBottom: spacing.sm }}>
      <View style={[styles.misionCard, isRaiz && styles.misionCardRaiz]}>
        <View style={styles.misionFila}>
          {hijos.length > 0 ? (
            <TouchableOpacity onPress={() => setExpandida((v) => !v)} style={styles.expandBtn}>
              <MaterialIcons
                name={expandida ? 'expand-more' : 'chevron-right'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.expandBtn} />
          )}

          <TouchableOpacity
            onPress={() => onToggle(mision.id, mision.completada)}
            style={[styles.checkbox, mision.completada && styles.checkboxCompleto]}
          >
            {mision.completada && (
              <MaterialIcons name="check" size={12} color="#fff" />
            )}
          </TouchableOpacity>

          <Text
            style={[styles.misionTitulo, mision.completada && styles.misionTachada]}
            numberOfLines={2}
          >
            {mision.titulo}
          </Text>

          <TouchableOpacity
            onPress={() => setAgregarAbierto((v) => !v)}
            style={styles.btnSubNueva}
          >
            <MaterialIcons name="add" size={16} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {agregarAbierto && (
          <View style={styles.inputInlineFila}>
            <TextInput
              style={styles.inputInline}
              placeholder="Nueva submisión..."
              placeholderTextColor={colors.textMuted}
              value={nuevaSubmision}
              onChangeText={setNuevaSubmision}
              autoFocus
            />
            <TouchableOpacity onPress={confirmarAgregar} style={styles.btnInlineOk}>
              <Text style={styles.btnInlineOkTexto}>OK</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {expandida &&
        hijos.map((h) => (
          <QuestNode
            key={h.id}
            mision={h}
            todas={todas}
            nivel={nivel + 1}
            onToggle={onToggle}
            onAgregarHijo={onAgregarHijo}
          />
        ))}
    </View>
  );
}

export default function RpgScreen() {
  const { usuario } = useUsuario();
  const [seccion, setSeccion] = useState<Seccion>('stats');

  const [stats, setStats] = useState<StatsDoc>(STATS_INICIALES);
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [nombreHabito, setNombreHabito] = useState('');
  const [statHabito, setStatHabito] = useState<StatKey>('fuerza');
  const [agregarHabitoAbierto, setAgregarHabitoAbierto] = useState(false);
  const [misiones, setMisiones] = useState<Mision[]>([]);
  const [nuevaMision, setNuevaMision] = useState('');

  useEffect(() => {
    if (!usuario) return;

    const uid = usuario.uid;

    const statsRef = doc(db, 'usuarios', uid, 'rpg_stats', 'datos');
    getDoc(statsRef).then((snap) => {
      if (!snap.exists()) {
        setDoc(statsRef, STATS_INICIALES);
      }
    });

    const cancelarStats = onSnapshot(statsRef, (snap) => {
      if (snap.exists()) setStats(snap.data() as StatsDoc);
    });

    const cancelarHabitos = onSnapshot(
      query(collection(db, 'usuarios', uid, 'rpg_habitos'), orderBy('nombre')),
      (snap) => {
        setHabitos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Habito, 'id'>) })));
      }
    );

    const cancelarMisiones = onSnapshot(
      query(collection(db, 'usuarios', uid, 'rpg_misiones'), orderBy('orden')),
      (snap) => {
        setMisiones(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Mision, 'id'>) })));
      }
    );

    return () => {
      cancelarStats();
      cancelarHabitos();
      cancelarMisiones();
    };
  }, [usuario]);

  const guardarHabito = async () => {
    if (!usuario || !nombreHabito.trim()) return;
    await addDoc(collection(db, 'usuarios', usuario.uid, 'rpg_habitos'), {
      nombre: nombreHabito.trim(),
      stat: statHabito,
      fechaCompletado: null,
    });
    setNombreHabito('');
    setAgregarHabitoAbierto(false);
  };

  const toggleHabito = async (habito: Habito) => {
    if (!usuario) return;

    const yaCompletadoHoy = habito.fechaCompletado === HOY;
    const habitoRef = doc(db, 'usuarios', usuario.uid, 'rpg_habitos', habito.id);
    const statsRef  = doc(db, 'usuarios', usuario.uid, 'rpg_stats', 'datos');

    if (!yaCompletadoHoy) {
      await updateDoc(habitoRef, { fechaCompletado: HOY });
      await updateDoc(statsRef, { [`${habito.stat}.xp`]: increment(20) });
    } else {
      const xpActual = stats[habito.stat]?.xp ?? 0;
      await updateDoc(habitoRef, { fechaCompletado: null });
      if (xpActual >= 20) {
        await updateDoc(statsRef, { [`${habito.stat}.xp`]: increment(-20) });
      }
    }
  };

  const agregarMisionRaiz = async () => {
    if (!usuario || !nuevaMision.trim()) return;
    await addDoc(collection(db, 'usuarios', usuario.uid, 'rpg_misiones'), {
      titulo: nuevaMision.trim(),
      completada: false,
      parentId: null,
      orden: misiones.length,
    });
    setNuevaMision('');
  };

  const agregarSubmision = async (parentId: string, titulo: string) => {
    if (!usuario) return;
    const hermanos = misiones.filter((m) => m.parentId === parentId);
    await addDoc(collection(db, 'usuarios', usuario.uid, 'rpg_misiones'), {
      titulo,
      completada: false,
      parentId,
      orden: hermanos.length,
    });
  };

  const toggleMision = async (id: string, completada: boolean) => {
    if (!usuario) return;
    await updateDoc(doc(db, 'usuarios', usuario.uid, 'rpg_misiones', id), {
      completada: !completada,
    });
  };

  const nivelTotal = STAT_KEYS.reduce((acc, k) => acc + calcNivel(stats[k]?.xp ?? 0), 0);

  const completadosHoy = habitos.filter((h) => h.fechaCompletado === HOY).length;
  const porcentajeHabitos = habitos.length > 0 ? Math.round((completadosHoy / habitos.length) * 100) : 0;

  const renderStats = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.hh }}>
      {STAT_KEYS.map((key) => {
        const info   = STATS_INFO[key];
        const xp     = stats[key]?.xp ?? 0;
        const nivel  = calcNivel(xp);
        const local  = calcXpLocal(xp);
        const progr  = calcProgreso(xp);
        return (
          <View key={key} style={styles.statCard}>
            <View style={styles.statEncabezado}>
              <View style={styles.statLeft}>
                <View style={[styles.iconBadge, { backgroundColor: info.color + '20' }]}>
                  <MaterialIcons name={info.icon} size={20} color={info.color} />
                </View>
                <View>
                  <Text style={styles.statNombre}>{info.label}</Text>
                  <Text style={styles.statDescripcion}>{info.descripcion}</Text>
                </View>
              </View>
              <View style={[styles.nivelPill, { backgroundColor: info.color + '15', borderColor: info.color + '40' }]}>
                <Text style={[styles.nivelTexto, { color: info.color }]}>Nv. {nivel}</Text>
              </View>
            </View>
            <View style={styles.barraContenedor}>
              <View style={[styles.barraRelleno, { width: `${progr * 100}%` as `${number}%`, backgroundColor: info.color }]} />
            </View>
            <Text style={styles.xpTexto}>{local} / 100 XP</Text>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderHabitos = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.hh }}>
      <View style={styles.seccionHeader}>
        <Text style={styles.seccionLabel}>PROGRESO</Text>
        <View style={styles.porcentajeBadge}>
          <Text style={styles.porcentajeTexto}>{porcentajeHabitos}%</Text>
        </View>
      </View>
      <View style={styles.barraContenedor}>
        <View style={[styles.barraRelleno, { width: `${porcentajeHabitos}%` as `${number}%`, backgroundColor: colors.accent }]} />
      </View>

      <View style={styles.card}>
        {habitos.map((h, idx) => {
          const completadoHoy = h.fechaCompletado === HOY;
          const color = STATS_INFO[h.stat].color;
          return (
            <TouchableOpacity
              key={h.id}
              style={[styles.habitoFila, idx < habitos.length - 1 && styles.habitoFilaBorde]}
              onPress={() => toggleHabito(h)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBadge, { backgroundColor: color + '20' }]}>
                <MaterialIcons name={STATS_INFO[h.stat].icon} size={16} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.habitoNombre, completadoHoy && styles.habitoTachado]}>
                  {h.nombre}
                </Text>
                <Text style={[styles.habitoStatLabel, { color }]}>{STATS_INFO[h.stat].label}</Text>
              </View>
              <View style={[styles.checkboxHabito, completadoHoy && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                {completadoHoy && <MaterialIcons name="check" size={13} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {agregarHabitoAbierto ? (
        <View style={[styles.card, { marginTop: spacing.md, gap: spacing.md }]}>
          <TextInput
            style={styles.input}
            placeholder="Nombre del hábito"
            placeholderTextColor={colors.textMuted}
            value={nombreHabito}
            onChangeText={setNombreHabito}
            autoFocus
          />
          <Text style={styles.label}>ATRIBUTO</Text>
          <View style={styles.statSelector}>
            {STAT_KEYS.map((k) => {
              const activo = statHabito === k;
              const col = STATS_INFO[k].color;
              return (
                <TouchableOpacity
                  key={k}
                  style={[styles.statChip, activo && { backgroundColor: col, borderColor: col }]}
                  onPress={() => setStatHabito(k)}
                >
                  <Text style={[styles.statChipTexto, activo && { color: '#fff' }]}>
                    {STATS_INFO[k].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.filaAcciones}>
            <TouchableOpacity style={[styles.btnPrimario, { flex: 1 }]} onPress={guardarHabito}>
              <Text style={styles.btnPrimarioTexto}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSecundario, { flex: 1 }]}
              onPress={() => setAgregarHabitoAbierto(false)}
            >
              <Text style={styles.btnSecundarioTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.btnPrimario, { marginTop: spacing.md }]}
          onPress={() => setAgregarHabitoAbierto(true)}
        >
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.btnPrimarioTexto}>Nuevo hábito</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderMisiones = () => {
    const raices = misiones
      .filter((m) => m.parentId === null)
      .sort((a, b) => a.orden - b.orden);

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.hh }}>
        {raices.map((m) => (
          <QuestNode
            key={m.id}
            mision={m}
            todas={misiones}
            nivel={0}
            onToggle={toggleMision}
            onAgregarHijo={agregarSubmision}
          />
        ))}

        <View style={[styles.card, { marginTop: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }]}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Nueva misión épica..."
            placeholderTextColor={colors.textMuted}
            value={nuevaMision}
            onChangeText={setNuevaMision}
          />
          <TouchableOpacity style={styles.btnIcono} onPress={agregarMisionRaiz}>
            <MaterialIcons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBadge}>
            <MaterialIcons name="auto-awesome" size={22} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.headerTitulo}>QUESTFLOW</Text>
            <Text style={styles.headerSub}>Nivel total {nivelTotal}</Text>
          </View>
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
        {seccion === 'stats'    && renderStats()}
        {seccion === 'habitos'  && renderHabitos()}
        {seccion === 'misiones' && renderMisiones()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: { fontSize: font.xl, fontWeight: '900', color: colors.text, letterSpacing: 1 },
  headerSub:    { fontSize: font.sm, color: colors.textSec, marginTop: 1 },

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
  tabActivo:      { backgroundColor: colors.accent, borderColor: colors.accent },
  tabTexto:       { color: colors.textSec, fontSize: font.sm, fontWeight: '700' },
  tabTextoActivo: { color: '#fff' },

  contenido: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.sm },

  seccionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  seccionLabel:  { fontSize: font.xs, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8 },
  porcentajeBadge: { backgroundColor: colors.accentLight, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  porcentajeTexto: { fontSize: font.sm, fontWeight: '700', color: colors.accent },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadow.card,
  },

  statCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  statEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  statLeft:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statNombre:     { fontSize: font.base, fontWeight: '800', color: colors.text },
  statDescripcion:{ fontSize: font.sm, color: colors.textSec, marginTop: 1 },
  nivelPill:      { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1 },
  nivelTexto:     { fontSize: font.sm, fontWeight: '700' },

  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  barraContenedor: {
    height: 6,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  barraRelleno: { height: '100%', borderRadius: radius.full },
  xpTexto:      { color: colors.textMuted, fontSize: font.xs, textAlign: 'right' },

  habitoFila:     { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  habitoFilaBorde:{ borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  habitoNombre:   { fontSize: font.base, color: colors.text, fontWeight: '500' },
  habitoTachado:  { textDecorationLine: 'line-through', color: colors.textMuted },
  habitoStatLabel:{ fontSize: font.sm, marginTop: 1 },
  checkboxHabito: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label:        { fontSize: font.xs, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8 },
  statSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  statChipTexto: { fontSize: font.sm, fontWeight: '600', color: colors.textSec },

  input: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    padding: spacing.md,
    borderRadius: radius.md,
    fontSize: font.base,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },

  filaAcciones: { flexDirection: 'row', gap: spacing.sm },

  btnPrimario: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    ...shadow.blue,
  },
  btnPrimarioTexto: { color: '#fff', fontSize: font.base, fontWeight: '700' },

  btnSecundario: {
    backgroundColor: colors.cardAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecundarioTexto: { color: colors.textSec, fontSize: font.base, fontWeight: '600' },

  btnIcono: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.blue,
  },

  misionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  misionCardRaiz: { borderColor: colors.accent, borderWidth: 1.5 },
  misionFila:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  expandBtn:     { width: 20, alignItems: 'center' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleto: { backgroundColor: colors.success, borderColor: colors.success },
  misionTitulo:  { flex: 1, color: colors.text, fontSize: font.md, fontWeight: '500' },
  misionTachada: { textDecorationLine: 'line-through', color: colors.textMuted },
  btnSubNueva:   {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputInlineFila: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  inputInline: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    color: colors.text,
    padding: spacing.sm,
    borderRadius: radius.sm,
    fontSize: font.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnInlineOk: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
  btnInlineOkTexto: { color: '#fff', fontWeight: '700', fontSize: font.sm },
});
