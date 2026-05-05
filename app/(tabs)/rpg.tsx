import {
  addDoc, collection, doc, increment, onSnapshot, setDoc, updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { db } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';
import { QF, StatKey, xpToLevel } from '@/constants/questflow';

const { width } = Dimensions.get('window');

type StatsDoc = Record<StatKey, { xp: number }>;
type Habito = { id: string; nombre: string; stat: StatKey; fechaCompletado: string | null };
type Mision = { id: string; titulo: string; completada: boolean; parentId: string | null; orden: number };
type Seccion = 'stats' | 'quests' | 'misiones';

const HOY = new Date().toISOString().slice(0, 10);
const STAT_KEYS: StatKey[] = ['fuerza', 'inteligencia', 'carisma', 'agilidad', 'resistencia', 'sabiduria'];

// ── Mission Tree Node ──────────────────────────────────────────────
function MisionNode({
  mision, todas, nivel, onToggle, onAddChild,
}: {
  mision: Mision;
  todas: Mision[];
  nivel: number;
  onToggle: (id: string, v: boolean) => void;
  onAddChild: (parentId: string, titulo: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const children = todas.filter(m => m.parentId === mision.id).sort((a, b) => a.orden - b.orden);
  const isRoot = nivel === 0;
  const col = isRoot ? QF.colors.accent : nivel === 1 ? QF.colors.stats.inteligencia.main : QF.colors.textSecondary;

  function confirm() {
    if (!newTitle.trim()) return;
    onAddChild(mision.id, newTitle.trim());
    setNewTitle(''); setAddOpen(false); setExpanded(true);
  }

  return (
    <View style={{ marginLeft: nivel * 20, marginBottom: 6 }}>
      <View style={[styles.misionCard, isRoot && styles.misionCardRoot, { borderLeftColor: col }]}>
        <TouchableOpacity style={styles.misionRow} onPress={() => onToggle(mision.id, !mision.completada)}>
          <View style={[styles.misionCheck, {
            borderColor: col,
            backgroundColor: mision.completada ? col : 'transparent',
          }]}>
            {mision.completada && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={[styles.misionTitulo, mision.completada && styles.misionDone, { color: mision.completada ? QF.colors.textMuted : QF.colors.textPrimary }]}>
            {mision.titulo}
          </Text>
          {children.length > 0 && (
            <TouchableOpacity onPress={() => setExpanded(v => !v)} style={styles.expandBtn}>
              <Text style={{ color: QF.colors.textMuted, fontSize: 16 }}>{expanded ? '▾' : '▸'}</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <View style={styles.misionActions}>
          <TouchableOpacity onPress={() => setAddOpen(v => !v)}>
            <Text style={[styles.misionActionText, { color: col }]}>+ sub-misión</Text>
          </TouchableOpacity>
        </View>

        {addOpen && (
          <View style={styles.addChildRow}>
            <TextInput
              style={styles.addChildInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Nueva sub-misión…"
              placeholderTextColor={QF.colors.textMuted}
            />
            <TouchableOpacity style={[styles.addChildBtn, { backgroundColor: col }]} onPress={confirm}>
              <Text style={styles.addChildBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {expanded && children.map(child => (
        <MisionNode
          key={child.id}
          mision={child}
          todas={todas}
          nivel={nivel + 1}
          onToggle={onToggle}
          onAddChild={onAddChild}
        />
      ))}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────
export default function RPGScreen() {
  const { usuario } = useUsuario();
  const [seccion, setSeccion] = useState<Seccion>('stats');
  const [stats, setStats] = useState<StatsDoc | null>(null);
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [misiones, setMisiones] = useState<Mision[]>([]);
  const [nuevaQuest, setNuevaQuest] = useState('');
  const [questStat, setQuestStat] = useState<StatKey>('fuerza');
  const [nuevaMision, setNuevaMision] = useState('');

  useEffect(() => {
    if (!usuario?.uid) return;
    const uid = usuario.uid;
    const s1 = onSnapshot(doc(db, 'usuarios', uid, 'stats', 'main'), snap => {
      if (snap.exists()) setStats(snap.data() as StatsDoc);
    });
    const s2 = onSnapshot(collection(db, 'usuarios', uid, 'habitos'), snap => {
      setHabitos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Habito)));
    });
    const s3 = onSnapshot(collection(db, 'usuarios', uid, 'misiones'), snap => {
      setMisiones(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mision)));
    });
    return () => { s1(); s2(); s3(); };
  }, [usuario?.uid]);

  async function completarHabito(h: Habito) {
    if (!usuario?.uid) return;
    const yaHecho = h.fechaCompletado === HOY;
    const xpDelta = yaHecho ? -20 : 20;
    await updateDoc(doc(db, 'usuarios', usuario.uid, 'habitos', h.id), {
      fechaCompletado: yaHecho ? null : HOY,
    });
    await setDoc(
      doc(db, 'usuarios', usuario.uid, 'stats', 'main'),
      { [h.stat]: { xp: increment(xpDelta) } },
      { merge: true }
    );
  }

  async function agregarQuest() {
    if (!usuario?.uid || !nuevaQuest.trim()) return;
    await addDoc(collection(db, 'usuarios', usuario.uid, 'habitos'), {
      nombre: nuevaQuest.trim(), stat: questStat, fechaCompletado: null,
    });
    setNuevaQuest('');
  }

  async function agregarMision() {
    if (!usuario?.uid || !nuevaMision.trim()) return;
    await addDoc(collection(db, 'usuarios', usuario.uid, 'misiones'), {
      titulo: nuevaMision.trim(), completada: false, parentId: null, orden: misiones.length,
    });
    setNuevaMision('');
  }

  async function toggleMision(id: string, completada: boolean) {
    if (!usuario?.uid) return;
    await updateDoc(doc(db, 'usuarios', usuario.uid, 'misiones', id), { completada });
  }

  async function addChildMision(parentId: string, titulo: string) {
    if (!usuario?.uid) return;
    await addDoc(collection(db, 'usuarios', usuario.uid, 'misiones'), {
      titulo, completada: false, parentId, orden: misiones.filter(m => m.parentId === parentId).length,
    });
  }

  const rootMisiones = misiones.filter(m => m.parentId === null).sort((a, b) => a.orden - b.orden);

  const secciones: { key: Seccion; label: string }[] = [
    { key: 'stats', label: 'Atributos' },
    { key: 'quests', label: 'Quests' },
    { key: 'misiones', label: 'Mission Tree' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>RPG</Text>
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

        {/* ── STATS ── */}
        {seccion === 'stats' && STAT_KEYS.map(key => {
          const xp = stats?.[key]?.xp || 0;
          const { level, progress, xpInLevel } = xpToLevel(xp);
          const col = QF.colors.stats[key];
          const info = QF.statLabels[key];
          const questsDeEsta = habitos.filter(h => h.stat === key);
          const completadas = questsDeEsta.filter(h => h.fechaCompletado === HOY).length;
          return (
            <View key={key} style={[styles.statRow, { borderLeftColor: col.main }]}>
              <View style={styles.statRowTop}>
                <View style={styles.statLeft}>
                  <Text style={styles.statIcon}>{info.icon}</Text>
                  <View>
                    <Text style={[styles.statName, { color: col.main }]}>{info.full}</Text>
                    <Text style={styles.statBadge}>{info.label} · LVL {level}</Text>
                  </View>
                </View>
                <Text style={[styles.statXP, { color: col.main }]}>{xpInLevel}/100 XP</Text>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: col.main }]} />
              </View>
              {questsDeEsta.length > 0 && (
                <Text style={styles.statQuestInfo}>{completadas}/{questsDeEsta.length} quests completadas hoy</Text>
              )}
            </View>
          );
        })}

        {/* ── QUESTS ── */}
        {seccion === 'quests' && (
          <>
            {/* Add Quest */}
            <View style={styles.addCard}>
              <Text style={styles.sectionLabel}>NUEVA QUEST DIARIA</Text>
              <TextInput
                style={styles.input}
                value={nuevaQuest}
                onChangeText={setNuevaQuest}
                placeholder="Nombre de la quest…"
                placeholderTextColor={QF.colors.textMuted}
              />
              <Text style={styles.sectionLabel}>ATRIBUTO</Text>
              <View style={styles.statPicker}>
                {STAT_KEYS.map(k => {
                  const col = QF.colors.stats[k];
                  const sel = questStat === k;
                  return (
                    <TouchableOpacity
                      key={k}
                      style={[styles.statPickerBtn, { borderColor: col.main, backgroundColor: sel ? col.dim : 'transparent' }]}
                      onPress={() => setQuestStat(k)}
                    >
                      <Text style={{ fontSize: 16 }}>{QF.statLabels[k].icon}</Text>
                      <Text style={[styles.statPickerLabel, { color: sel ? col.main : QF.colors.textMuted }]}>
                        {QF.statLabels[k].label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity style={styles.btnAdd} onPress={agregarQuest}>
                <Text style={styles.btnAddText}>Agregar Quest</Text>
              </TouchableOpacity>
            </View>

            {/* Quests grouped by stat */}
            {STAT_KEYS.map(key => {
              const group = habitos.filter(h => h.stat === key);
              if (group.length === 0) return null;
              const col = QF.colors.stats[key];
              return (
                <View key={key} style={styles.questGroup}>
                  <View style={styles.questGroupHeader}>
                    <Text style={styles.questGroupIcon}>{QF.statLabels[key].icon}</Text>
                    <Text style={[styles.questGroupName, { color: col.main }]}>{QF.statLabels[key].full}</Text>
                  </View>
                  {group.map(h => {
                    const done = h.fechaCompletado === HOY;
                    return (
                      <TouchableOpacity
                        key={h.id}
                        style={[styles.questCard, { borderLeftColor: col.main, opacity: done ? 0.6 : 1 }]}
                        onPress={() => completarHabito(h)}
                      >
                        <View style={[styles.questCheck, { borderColor: col.main, backgroundColor: done ? col.main : 'transparent' }]}>
                          {done && <Text style={styles.checkMark}>✓</Text>}
                        </View>
                        <Text style={[styles.questNombre, done && styles.questDone]}>{h.nombre}</Text>
                        {done && <Text style={[styles.xpBadge, { color: col.main }]}>+20 XP</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </>
        )}

        {/* ── MISSION TREE ── */}
        {seccion === 'misiones' && (
          <>
            <View style={styles.addCard}>
              <Text style={styles.sectionLabel}>NUEVA MISIÓN ÉPICA</Text>
              <View style={styles.addRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={nuevaMision}
                  onChangeText={setNuevaMision}
                  placeholder="Nombre de la misión…"
                  placeholderTextColor={QF.colors.textMuted}
                />
                <TouchableOpacity style={styles.btnAddInline} onPress={agregarMision}>
                  <Text style={styles.btnAddInlineText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {rootMisiones.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Sin misiones aún. ¡Crea tu primera misión épica!</Text>
              </View>
            )}

            {rootMisiones.map(m => (
              <MisionNode
                key={m.id}
                mision={m}
                todas={misiones}
                nivel={0}
                onToggle={toggleMision}
                onAddChild={addChildMision}
              />
            ))}
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
  tabActive: { backgroundColor: QF.colors.accentGlow, borderColor: QF.colors.accent },
  tabText: { fontSize: QF.font.xs, fontWeight: '600', color: QF.colors.textMuted },
  tabTextActive: { color: QF.colors.accent },
  body: { flex: 1 },
  bodyContent: { padding: QF.spacing.lg },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: QF.colors.textMuted,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: QF.spacing.sm,
  },

  // Stats
  statRow: {
    backgroundColor: QF.colors.surface, borderRadius: QF.radius.xl,
    borderWidth: 1, borderColor: QF.colors.cardBorder, borderLeftWidth: 3,
    padding: QF.spacing.md, marginBottom: QF.spacing.sm, gap: 8,
  },
  statRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLeft: { flexDirection: 'row', alignItems: 'center', gap: QF.spacing.md },
  statIcon: { fontSize: 22 },
  statName: { fontSize: QF.font.md, fontWeight: '800' },
  statBadge: { fontSize: 10, color: QF.colors.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  statXP: { fontSize: QF.font.sm, fontWeight: '700' },
  barBg: { height: 5, backgroundColor: QF.colors.cardBorder, borderRadius: QF.radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: QF.radius.full },
  statQuestInfo: { fontSize: 10, color: QF.colors.textMuted },

  // Quests
  addCard: {
    backgroundColor: QF.colors.surface, borderRadius: QF.radius.xxl,
    borderWidth: 1, borderColor: QF.colors.cardBorder, padding: QF.spacing.lg, marginBottom: QF.spacing.lg,
  },
  input: {
    backgroundColor: QF.colors.bg, borderRadius: QF.radius.lg,
    borderWidth: 1, borderColor: QF.colors.cardBorder,
    padding: QF.spacing.md, color: QF.colors.textPrimary, fontSize: QF.font.md,
    marginBottom: QF.spacing.sm,
  },
  statPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: QF.spacing.sm },
  statPickerBtn: {
    borderRadius: QF.radius.lg, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center', gap: 2, minWidth: 48,
  },
  statPickerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  btnAdd: {
    backgroundColor: QF.colors.accent, borderRadius: QF.radius.xl,
    paddingVertical: 12, alignItems: 'center',
  },
  btnAddText: { color: '#fff', fontWeight: '800', fontSize: QF.font.md },

  questGroup: { marginBottom: QF.spacing.lg },
  questGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  questGroupIcon: { fontSize: 18 },
  questGroupName: { fontSize: QF.font.md, fontWeight: '800' },
  questCard: {
    backgroundColor: QF.colors.surface, borderRadius: QF.radius.xl,
    borderWidth: 1, borderColor: QF.colors.cardBorder, borderLeftWidth: 3,
    padding: QF.spacing.md, marginBottom: 6,
    flexDirection: 'row', alignItems: 'center', gap: QF.spacing.md,
  },
  questCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontSize: 11, fontWeight: '800' },
  questNombre: { flex: 1, fontSize: QF.font.md, fontWeight: '600', color: QF.colors.textPrimary },
  questDone: { textDecorationLine: 'line-through', color: QF.colors.textMuted },
  xpBadge: { fontSize: 11, fontWeight: '800' },

  // Mission Tree
  misionCard: {
    backgroundColor: QF.colors.surface, borderRadius: QF.radius.xl,
    borderWidth: 1, borderColor: QF.colors.cardBorder, borderLeftWidth: 3,
    padding: QF.spacing.md,
  },
  misionCardRoot: {
    backgroundColor: QF.colors.elevated,
    borderColor: QF.colors.accent,
  },
  misionRow: { flexDirection: 'row', alignItems: 'center', gap: QF.spacing.md },
  misionCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  misionTitulo: { flex: 1, fontSize: QF.font.md, fontWeight: '600' },
  misionDone: { textDecorationLine: 'line-through' },
  expandBtn: { padding: 4 },
  misionActions: { marginTop: 6 },
  misionActionText: { fontSize: 11, fontWeight: '700' },
  addChildRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addChildInput: {
    flex: 1, backgroundColor: QF.colors.bg, borderRadius: QF.radius.md,
    borderWidth: 1, borderColor: QF.colors.cardBorder,
    paddingHorizontal: QF.spacing.md, paddingVertical: 8,
    color: QF.colors.textPrimary, fontSize: QF.font.sm,
  },
  addChildBtn: { borderRadius: QF.radius.md, width: 36, alignItems: 'center', justifyContent: 'center' },
  addChildBtnText: { color: '#fff', fontWeight: '900', fontSize: 18 },

  addRow: { flexDirection: 'row', gap: 8 },
  btnAddInline: {
    backgroundColor: QF.colors.accent, borderRadius: QF.radius.lg,
    width: 44, alignItems: 'center', justifyContent: 'center',
  },
  btnAddInlineText: { color: '#fff', fontWeight: '900', fontSize: 22 },

  emptyBox: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: QF.colors.textMuted, fontSize: QF.font.sm, textAlign: 'center', paddingHorizontal: 20 },
});
