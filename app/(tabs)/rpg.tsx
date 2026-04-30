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
import { db } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

// ─── Constantes ───────────────────────────────────────────────────────────────

const HOY = new Date().toISOString().slice(0, 10);

const STATS_INFO: Record<StatKey, { label: string; color: string; descripcion: string }> = {
  fuerza:       { label: 'Fuerza',       color: '#ef4444', descripcion: 'Ejercicio y cuerpo'     },
  inteligencia: { label: 'Inteligencia', color: '#60a5fa', descripcion: 'Estudio y aprendizaje'  },
  carisma:      { label: 'Carisma',      color: '#fbbf24', descripcion: 'Conexiones sociales'     },
  agilidad:     { label: 'Agilidad',     color: '#34d399', descripcion: 'Orden y productividad'   },
  resistencia:  { label: 'Resistencia',  color: '#a78bfa', descripcion: 'Sueño e hidratación'     },
  sabiduria:    { label: 'Sabiduría',    color: '#22d3ee', descripcion: 'Mente y meditación'      },
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
  { key: 'stats',    label: 'Stats'    },
  { key: 'habitos',  label: 'Hábitos'  },
  { key: 'misiones', label: 'Misiones' },
];

// ─── Helpers de XP ────────────────────────────────────────────────────────────

const calcNivel   = (xp: number) => Math.floor(xp / 100) + 1;
const calcXpLocal = (xp: number) => xp % 100;
const calcProgreso= (xp: number) => (xp % 100) / 100;

// ─── Componente recursivo QuestNode ───────────────────────────────────────────

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

  return (
    <View style={{ marginLeft: nivel * 16 }}>
      {/* Fila de la misión */}
      <View style={styles.misionFila}>
        {/* Expand/colapsar si tiene hijos */}
        {hijos.length > 0 ? (
          <TouchableOpacity onPress={() => setExpandida((v) => !v)} style={styles.expandBtn}>
            <Text style={styles.expandIcon}>{expandida ? '▾' : '▸'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.expandBtn} />
        )}

        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => onToggle(mision.id, mision.completada)}
          style={[styles.checkbox, mision.completada && styles.checkboxCompleto]}
        >
          {mision.completada && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Título */}
        <Text
          style={[styles.misionTitulo, mision.completada && styles.misionTachada]}
          numberOfLines={2}
        >
          {mision.titulo}
        </Text>

        {/* Botón agregar submisión */}
        <TouchableOpacity
          onPress={() => setAgregarAbierto((v) => !v)}
          style={styles.btnSubNueva}
        >
          <Text style={styles.btnSubNuevaTexto}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Input inline para nueva submisión */}
      {agregarAbierto && (
        <View style={[styles.inputInlineFila, { marginLeft: 32 }]}>
          <TextInput
            style={styles.inputInline}
            placeholder="Nueva submisión..."
            placeholderTextColor="#666"
            value={nuevaSubmision}
            onChangeText={setNuevaSubmision}
            autoFocus
          />
          <TouchableOpacity onPress={confirmarAgregar} style={styles.btnInlineOk}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>OK</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hijos recursivos */}
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

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function RpgScreen() {
  const { usuario } = useUsuario();
  const [seccion, setSeccion] = useState<Seccion>('stats');

  // Stats
  const [stats, setStats] = useState<StatsDoc>(STATS_INICIALES);

  // Hábitos
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [nombreHabito, setNombreHabito] = useState('');
  const [statHabito, setStatHabito] = useState<StatKey>('fuerza');
  const [agregarHabitoAbierto, setAgregarHabitoAbierto] = useState(false);

  // Misiones
  const [misiones, setMisiones] = useState<Mision[]>([]);
  const [nuevaMision, setNuevaMision] = useState('');

  // ── Cargar datos desde Firestore ──────────────────────────────────────────

  useEffect(() => {
    if (!usuario) return;

    const uid = usuario.uid;

    // Inicializar stats si no existen
    const statsRef = doc(db, 'usuarios', uid, 'rpg_stats', 'datos');
    getDoc(statsRef).then((snap) => {
      if (!snap.exists()) {
        setDoc(statsRef, STATS_INICIALES);
      }
    });

    // Escuchar stats en tiempo real
    const cancelarStats = onSnapshot(statsRef, (snap) => {
      if (snap.exists()) setStats(snap.data() as StatsDoc);
    });

    // Escuchar hábitos
    const cancelarHabitos = onSnapshot(
      query(collection(db, 'usuarios', uid, 'rpg_habitos'), orderBy('nombre')),
      (snap) => {
        setHabitos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Habito, 'id'>) })));
      }
    );

    // Escuchar misiones
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

  // ── Hábitos ───────────────────────────────────────────────────────────────

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
      // Completar: +20 XP
      await updateDoc(habitoRef, { fechaCompletado: HOY });
      await updateDoc(statsRef, { [`${habito.stat}.xp`]: increment(20) });
    } else {
      // Descompletar: -20 XP (sin bajar de 0)
      const xpActual = stats[habito.stat]?.xp ?? 0;
      await updateDoc(habitoRef, { fechaCompletado: null });
      if (xpActual >= 20) {
        await updateDoc(statsRef, { [`${habito.stat}.xp`]: increment(-20) });
      }
    }
  };

  // ── Misiones ──────────────────────────────────────────────────────────────

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

  // ── Renders ───────────────────────────────────────────────────────────────

  const renderStats = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {STAT_KEYS.map((key) => {
        const info   = STATS_INFO[key];
        const xp     = stats[key]?.xp ?? 0;
        const nivel  = calcNivel(xp);
        const local  = calcXpLocal(xp);
        const progr  = calcProgreso(xp);
        return (
          <View key={key} style={styles.statCard}>
            <View style={styles.statEncabezado}>
              <View>
                <Text style={[styles.statNombre, { color: info.color }]}>{info.label}</Text>
                <Text style={styles.statDescripcion}>{info.descripcion}</Text>
              </View>
              <View style={[styles.nivelBadge, { backgroundColor: info.color + '22', borderColor: info.color }]}>
                <Text style={[styles.nivelTexto, { color: info.color }]}>Nv. {nivel}</Text>
              </View>
            </View>
            {/* Barra de progreso */}
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
    <ScrollView showsVerticalScrollIndicator={false}>
      {habitos.map((h) => {
        const completadoHoy = h.fechaCompletado === HOY;
        const color = STATS_INFO[h.stat].color;
        return (
          <TouchableOpacity key={h.id} style={styles.habitoFila} onPress={() => toggleHabito(h)}>
            <View style={[styles.habitoCirculo, completadoHoy && { backgroundColor: color, borderColor: color }]}>
              {completadoHoy && <Text style={styles.habitoCheck}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.habitoNombre, completadoHoy && styles.habitoTachado]}>
                {h.nombre}
              </Text>
              <Text style={[styles.habitoStat, { color }]}>{STATS_INFO[h.stat].label} +20 XP</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Formulario nuevo hábito */}
      {agregarHabitoAbierto ? (
        <View style={styles.formulario}>
          <TextInput
            style={styles.input}
            placeholder="Nombre del hábito"
            placeholderTextColor="#666"
            value={nombreHabito}
            onChangeText={setNombreHabito}
            autoFocus
          />
          <Text style={styles.subtitulo}>Atributo</Text>
          <View style={styles.statSelector}>
            {STAT_KEYS.map((k) => (
              <TouchableOpacity
                key={k}
                style={[
                  styles.statChip,
                  statHabito === k && { backgroundColor: STATS_INFO[k].color, borderColor: STATS_INFO[k].color },
                ]}
                onPress={() => setStatHabito(k)}
              >
                <Text
                  style={[styles.statChipTexto, statHabito === k && { color: '#000' }]}
                >
                  {STATS_INFO[k].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.filaAcciones}>
            <TouchableOpacity style={[styles.boton, { flex: 1 }]} onPress={guardarHabito}>
              <Text style={styles.textoBoton}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.boton, { flex: 1, backgroundColor: '#1a1a1a' }]}
              onPress={() => setAgregarHabitoAbierto(false)}
            >
              <Text style={styles.textoBoton}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={[styles.boton, { marginTop: 12 }]} onPress={() => setAgregarHabitoAbierto(true)}>
          <Text style={styles.textoBoton}>+ Nuevo hábito</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderMisiones = () => {
    const raices = misiones
      .filter((m) => m.parentId === null)
      .sort((a, b) => a.orden - b.orden);

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
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

        {/* Nueva misión épica */}
        <View style={[styles.formulario, { marginTop: 16 }]}>
          <TextInput
            style={styles.input}
            placeholder="Nueva misión épica..."
            placeholderTextColor="#666"
            value={nuevaMision}
            onChangeText={setNuevaMision}
          />
          <TouchableOpacity style={styles.boton} onPress={agregarMisionRaiz}>
            <Text style={styles.textoBoton}>+ Agregar misión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ── JSX raíz ─────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>RPG de Vida</Text>

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

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 60 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#fff', paddingHorizontal: 20, marginBottom: 16 },

  // Tabs
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 8 },
  tab:           { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1a1a1a', alignItems: 'center' },
  tabActivo:     { backgroundColor: '#fff' },
  tabTexto:      { color: '#888', fontSize: 12, fontWeight: '600' },
  tabTextoActivo:{ color: '#000' },
  contenido:     { flex: 1, paddingHorizontal: 20 },

  // Stats
  statCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  statEncabezado:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statNombre:      { fontSize: 17, fontWeight: '700' },
  statDescripcion: { fontSize: 12, color: '#666', marginTop: 2 },
  nivelBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  nivelTexto:      { fontSize: 13, fontWeight: '700' },
  barraContenedor: { height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  barraRelleno:    { height: '100%', borderRadius: 3 },
  xpTexto:         { color: '#555', fontSize: 11, textAlign: 'right' },

  // Hábitos
  habitoFila:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  habitoCirculo: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#444', justifyContent: 'center', alignItems: 'center' },
  habitoCheck:   { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  habitoNombre:  { color: '#fff', fontSize: 16 },
  habitoTachado: { textDecorationLine: 'line-through', color: '#444' },
  habitoStat:    { fontSize: 12, marginTop: 2 },

  // Formulario general
  formulario: { gap: 10 },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
  },
  subtitulo: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  statSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  statChipTexto: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  filaAcciones:  { flexDirection: 'row', gap: 8 },
  boton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBoton: { color: '#000', fontSize: 15, fontWeight: '600' },

  // Misiones
  misionFila:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  expandBtn:     { width: 20, alignItems: 'center' },
  expandIcon:    { color: '#555', fontSize: 14 },
  checkbox:      { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#444', justifyContent: 'center', alignItems: 'center' },
  checkboxCompleto: { backgroundColor: '#34d399', borderColor: '#34d399' },
  checkmark:     { color: '#000', fontSize: 12, fontWeight: 'bold' },
  misionTitulo:  { flex: 1, color: '#ddd', fontSize: 15 },
  misionTachada: { textDecorationLine: 'line-through', color: '#444' },
  btnSubNueva:   { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  btnSubNuevaTexto: { color: '#888', fontSize: 18, lineHeight: 22 },
  inputInlineFila:  { flexDirection: 'row', gap: 8, marginVertical: 4 },
  inputInline:   { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', padding: 8, borderRadius: 8, fontSize: 14 },
  btnInlineOk:   { backgroundColor: '#34d399', paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center' },
});
