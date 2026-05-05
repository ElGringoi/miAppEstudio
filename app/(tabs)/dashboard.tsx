import {
  collection, doc, increment, onSnapshot, setDoc, updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { db } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';
import { QF, StatKey, xpToLevel } from '@/constants/questflow';
import { RadarChart } from '@/components/ui/RadarChart';

const { width } = Dimensions.get('window');
const HOY = new Date().toISOString().slice(0, 10);
const STAT_ORDER: StatKey[] = ['fuerza', 'inteligencia', 'carisma', 'agilidad', 'resistencia', 'sabiduria'];

const HERO_CLASS: Record<StatKey, string> = {
  fuerza: 'Warrior', inteligencia: 'Mage', carisma: 'Bard',
  agilidad: 'Rogue', resistencia: 'Paladin', sabiduria: 'Cleric',
};

type StatsDoc = Record<StatKey, { xp: number }>;
type Evento   = { id: string; titulo: string; hora?: string; color?: string };
type Habito   = { id: string; nombre: string; stat: StatKey; fechaCompletado: string | null };
type Mision   = { id: string; titulo: string; completada: boolean; parentId: string | null; orden: number };

// ── Stat Card ────────────────────────────────────────────────────────
function StatCard({ statKey, xp }: { statKey: StatKey; xp: number }) {
  const info = QF.statLabels[statKey];
  const col  = QF.colors.stats[statKey];
  const { level, progress } = xpToLevel(xp);
  return (
    <View style={[s.statCard, { borderColor: col.dim }]}>
      <View style={[s.statBadge, { backgroundColor: col.dim }]}>
        <Text style={[s.statBadgeText, { color: col.main }]}>{info.label}</Text>
      </View>
      <Text style={s.statIcon}>{info.icon}</Text>
      <Text style={s.statFull}>{info.full}</Text>
      <Text style={[s.statLevel, { color: col.main }]}>LVL {level}</Text>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: col.main }]} />
      </View>
      <Text style={s.statXp}>{xp % 100}/100 XP</Text>
    </View>
  );
}

// ── Quest Row ────────────────────────────────────────────────────────
function QuestRow({ habito, onToggle }: { habito: Habito; onToggle: (h: Habito) => void }) {
  const done = habito.fechaCompletado === HOY;
  const col  = QF.colors.stats[habito.stat];
  const info = QF.statLabels[habito.stat];
  return (
    <TouchableOpacity
      style={[s.questCard, { borderLeftColor: col.main, opacity: done ? 0.6 : 1 }]}
      onPress={() => onToggle(habito)}
    >
      <View style={[s.questCheck, { borderColor: col.main, backgroundColor: done ? col.main : 'transparent' }]}>
        {done && <Text style={s.checkMark}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.questNombre, done && s.questDone]}>{habito.nombre}</Text>
        <Text style={[s.questStat, { color: col.main }]}>{info.icon} {info.label}</Text>
      </View>
      {done && <Text style={[s.xpBadge, { color: col.main }]}>+20 XP</Text>}
    </TouchableOpacity>
  );
}

// ── Agenda Timeline ──────────────────────────────────────────────────
function AgendaTimeline({ eventos, habitos }: { eventos: Evento[]; habitos: Habito[] }) {
  const completadas = habitos.filter(h => h.fechaCompletado === HOY);
  const items = [
    ...eventos.map(e => ({ label: e.titulo, hora: e.hora || '', color: e.color || QF.colors.accent, tipo: 'evento' })),
    ...completadas.map(h => ({ label: h.nombre, hora: '', color: QF.colors.stats[h.stat].main, tipo: 'quest' })),
  ].sort((a, b) => (a.hora || 'zzz').localeCompare(b.hora || 'zzz'));

  if (items.length === 0) {
    return <Text style={s.emptyText}>Sin actividad registrada hoy</Text>;
  }
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={s.timelineRow}>
          <View style={s.timelineLeft}>
            <Text style={s.timelineHora}>{item.hora || '—'}</Text>
            <View style={[s.timelineDot, { backgroundColor: item.color }]} />
            {i < items.length - 1 && <View style={s.timelineLine} />}
          </View>
          <View style={[s.timelineCard, { borderLeftColor: item.color }]}>
            <Text style={s.timelineLabel}>{item.label}</Text>
            <Text style={[s.timelineTipo, { color: item.color }]}>
              {item.tipo === 'quest' ? '⚡ quest completada' : '📌 evento'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Mission Overview ─────────────────────────────────────────────────
function MisionOverview({ misiones }: { misiones: Mision[] }) {
  const roots = misiones.filter(m => m.parentId === null).sort((a, b) => a.orden - b.orden).slice(0, 4);
  if (roots.length === 0) {
    return <Text style={s.emptyText}>Sin misiones activas. Agregalas en la pantalla RPG.</Text>;
  }
  return (
    <View style={{ gap: 8 }}>
      {roots.map(m => {
        const hijos = misiones.filter(x => x.parentId === m.id);
        const doneHijos = hijos.filter(x => x.completada).length;
        const progress = hijos.length > 0 ? doneHijos / hijos.length : (m.completada ? 1 : 0);
        const accentCol = m.completada ? QF.colors.stats.agilidad.main : QF.colors.accent;
        return (
          <View key={m.id} style={[s.misionCard, { borderLeftColor: accentCol }]}>
            <View style={s.misionRow}>
              <View style={[s.misionDot, { borderColor: accentCol, backgroundColor: m.completada ? accentCol : 'transparent' }]}>
                {m.completada && <Text style={s.checkMark}>✓</Text>}
              </View>
              <Text style={[s.misionTitulo, m.completada && s.misionDone]} numberOfLines={1}>{m.titulo}</Text>
              {hijos.length > 0 && (
                <Text style={[s.misionCount, { color: accentCol }]}>{doneHijos}/{hijos.length}</Text>
              )}
            </View>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: accentCol }]} />
            </View>
            {hijos.length > 0 && (
              <View style={s.misionSubList}>
                {hijos.slice(0, 3).map(t => (
                  <View key={t.id} style={s.misionSubRow}>
                    <View style={[s.misionSubDot, { backgroundColor: t.completada ? accentCol : QF.colors.cardBorder }]} />
                    <Text style={[s.misionSubText, t.completada && s.questDone]} numberOfLines={1}>{t.titulo}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { usuario } = useUsuario();
  const [stats,   setStats]   = useState<StatsDoc | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [habitos, setHabitos] = useState<Habito[]>([]);
  const [misiones, setMisiones] = useState<Mision[]>([]);

  useEffect(() => {
    if (!usuario?.uid) return;
    const uid = usuario.uid;
    const u1 = onSnapshot(doc(db, 'usuarios', uid, 'stats', 'main'), snap => {
      if (snap.exists()) setStats(snap.data() as StatsDoc);
    });
    const u2 = onSnapshot(collection(db, 'usuarios', uid, 'eventos'), snap => {
      setEventos(snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Evento & { fecha?: string }))
        .filter((e): e is Evento => e.fecha === HOY || !e.fecha)
      );
    });
    const u3 = onSnapshot(collection(db, 'usuarios', uid, 'habitos'), snap => {
      setHabitos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Habito)));
    });
    const u4 = onSnapshot(collection(db, 'usuarios', uid, 'misiones'), snap => {
      setMisiones(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mision)));
    });
    return () => { u1(); u2(); u3(); u4(); };
  }, [usuario?.uid]);

  async function completarHabito(h: Habito) {
    if (!usuario?.uid) return;
    const yaHecho = h.fechaCompletado === HOY;
    await updateDoc(doc(db, 'usuarios', usuario.uid, 'habitos', h.id), {
      fechaCompletado: yaHecho ? null : HOY,
    });
    await setDoc(
      doc(db, 'usuarios', usuario.uid, 'stats', 'main'),
      { [h.stat]: { xp: increment(yaHecho ? -20 : 20) } },
      { merge: true }
    );
  }

  // Derived
  const totalXp  = stats ? STAT_ORDER.reduce((acc, k) => acc + (stats[k]?.xp || 0), 0) : 0;
  const heroLevel = Math.floor(totalXp / 600) + 1;
  const xpInLevel = totalXp % 600;

  const heroClass = stats
    ? HERO_CLASS[STAT_ORDER.reduce<StatKey>(
        (best, k) => (stats[k]?.xp || 0) > (stats[best]?.xp || 0) ? k : best,
        STAT_ORDER[0]
      )]
    : 'Hero';

  const initials = (usuario?.name ?? '')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const radarData = STAT_ORDER.map(key => ({
    label: QF.statLabels[key].label,
    value: stats ? Math.min((stats[key]?.xp || 0) / 500, 1) : 0,
    color: QF.colors.stats[key].main,
  }));

  const habitosDone = habitos.filter(h => h.fechaCompletado === HOY).length;

  const today   = new Date();
  const dayName = today.toLocaleDateString('es-AR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {/* ── Hero Banner ── */}
      <View style={s.heroBanner}>
        {/* Top row */}
        <View style={s.heroTopRow}>
          <View>
            <Text style={s.heroDate}>{dayName}, {dateStr}</Text>
            <Text style={s.heroTitle}>Battle Station</Text>
          </View>
          <View style={s.levelBadge}>
            <Text style={s.levelBadgeLabel}>NIVEL</Text>
            <Text style={s.levelBadgeNum}>{heroLevel}</Text>
          </View>
        </View>

        {/* Profile row */}
        <View style={s.heroProfile}>
          <View style={s.heroAvatar}>
            <Text style={s.heroInitials}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroName}>{usuario?.name || 'Héroe'}</Text>
            <Text style={s.heroClass}>{heroClass}</Text>
            <View style={s.heroXpRow}>
              <View style={s.heroXpBg}>
                <View style={[s.heroXpFill, { width: `${Math.round((xpInLevel / 600) * 100)}%` as any }]} />
              </View>
              <Text style={s.heroXpText}>{xpInLevel}/600 XP</Text>
            </View>
          </View>
        </View>

        {/* Stat pills */}
        <View style={s.statPills}>
          {STAT_ORDER.map(k => (
            <View key={k} style={[s.statPill, { borderColor: QF.colors.stats[k].dim, backgroundColor: QF.colors.stats[k].dim + '60' }]}>
              <Text style={s.pillIcon}>{QF.statLabels[k].icon}</Text>
              <Text style={[s.pillLabel, { color: QF.colors.stats[k].main }]}>{QF.statLabels[k].label}</Text>
              <Text style={s.pillValue}>Lv{xpToLevel(stats?.[k]?.xp || 0).level}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Daily Quests ── */}
      <Text style={s.sectionTitle}>⚡ Daily Quests</Text>
      <View style={s.card}>
        <View style={s.questHeader}>
          <Text style={s.questProgressText}>
            {habitosDone}/{habitos.length} completadas hoy
          </Text>
          <Text style={s.questXpText}>+{habitosDone * 20} XP</Text>
        </View>
        <View style={s.barBg}>
          <View style={[s.barFill, {
            width: habitos.length > 0 ? `${Math.round((habitosDone / habitos.length) * 100)}%` as any : '0%',
            backgroundColor: QF.colors.accent,
          }]} />
        </View>
        <View style={{ marginTop: 12 }}>
          {habitos.length === 0
            ? <Text style={s.emptyText}>Sin quests. Agregalas desde la pantalla RPG.</Text>
            : habitos.map(h => <QuestRow key={h.id} habito={h} onToggle={completarHabito} />)
          }
        </View>
      </View>

      {/* ── Hero Attributes ── */}
      <Text style={s.sectionTitle}>🏆 Hero Attributes</Text>
      <View style={s.statsGrid}>
        {STAT_ORDER.map(key => (
          <StatCard key={key} statKey={key} xp={stats?.[key]?.xp || 0} />
        ))}
      </View>

      {/* ── Radar ── */}
      <Text style={s.sectionTitle}>📡 Performance Radar</Text>
      <View style={[s.card, { alignItems: 'center' }]}>
        <RadarChart data={radarData} size={Math.min(width - 64, 280)} />
      </View>

      {/* ── Daily Agenda ── */}
      <Text style={s.sectionTitle}>📅 Daily Agenda</Text>
      <View style={s.card}>
        <AgendaTimeline eventos={eventos} habitos={habitos} />
      </View>

      {/* ── Active Missions ── */}
      <Text style={s.sectionTitle}>🎯 Active Missions</Text>
      <View style={s.card}>
        <MisionOverview misiones={misiones} />
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const CARD_W = (width - QF.spacing.lg * 2 - QF.spacing.sm) / 2 - 1;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: QF.colors.bg },
  content:   { padding: QF.spacing.lg },

  // Hero Banner
  heroBanner: {
    backgroundColor: QF.colors.surface,
    borderRadius: QF.radius.xxl,
    borderWidth: 1,
    borderColor: QF.colors.accent + '40',
    padding: QF.spacing.lg,
    marginBottom: QF.spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: QF.spacing.lg,
  },
  heroDate:  { fontSize: QF.font.xs, color: QF.colors.textMuted, textTransform: 'capitalize' },
  heroTitle: { fontSize: QF.font.xxl, fontWeight: '900', color: QF.colors.textPrimary },
  levelBadge: {
    backgroundColor: QF.colors.accentGlow,
    borderWidth: 1, borderColor: QF.colors.accent,
    borderRadius: QF.radius.xl,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
  },
  levelBadgeLabel: { fontSize: 9, fontWeight: '700', color: QF.colors.accent, letterSpacing: 1.5 },
  levelBadgeNum:   { fontSize: QF.font.xxl, fontWeight: '900', color: QF.colors.textPrimary },

  heroProfile: {
    flexDirection: 'row', alignItems: 'center',
    gap: QF.spacing.md, marginBottom: QF.spacing.md,
  },
  heroAvatar: {
    width: 56, height: 56, borderRadius: QF.radius.xl,
    backgroundColor: QF.colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: QF.colors.accent + '80',
  },
  heroInitials: { fontSize: QF.font.xl, fontWeight: '900', color: '#fff' },
  heroName:     { fontSize: QF.font.lg, fontWeight: '800', color: QF.colors.textPrimary },
  heroClass:    { fontSize: QF.font.xs, color: QF.colors.accent, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  heroXpRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroXpBg:     { flex: 1, height: 6, backgroundColor: QF.colors.cardBorder, borderRadius: QF.radius.full, overflow: 'hidden' },
  heroXpFill:   { height: '100%', backgroundColor: QF.colors.accent, borderRadius: QF.radius.full },
  heroXpText:   { fontSize: 10, color: QF.colors.textMuted },

  statPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: QF.radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  pillIcon:  { fontSize: 12 },
  pillLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  pillValue: { fontSize: 10, fontWeight: '600', color: QF.colors.textMuted },

  // Section title
  sectionTitle: {
    fontSize: QF.font.sm, fontWeight: '700', color: QF.colors.textMuted,
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginTop: QF.spacing.lg, marginBottom: QF.spacing.md,
  },

  // Card wrapper
  card: {
    backgroundColor: QF.colors.surface,
    borderRadius: QF.radius.xxl,
    borderWidth: 1, borderColor: QF.colors.cardBorder,
    padding: QF.spacing.lg,
  },

  // Quest
  questHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  questProgressText: { fontSize: QF.font.sm, fontWeight: '700', color: QF.colors.textSecondary },
  questXpText:       { fontSize: QF.font.sm, fontWeight: '800', color: QF.colors.accent },
  questCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: QF.colors.elevated,
    borderRadius: QF.radius.xl,
    borderWidth: 1, borderColor: QF.colors.cardBorder, borderLeftWidth: 3,
    padding: QF.spacing.md, marginBottom: 6, gap: QF.spacing.md,
  },
  questCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkMark:  { color: '#fff', fontSize: 12, fontWeight: '900' },
  questNombre: { fontSize: QF.font.md, fontWeight: '600', color: QF.colors.textPrimary },
  questDone:   { textDecorationLine: 'line-through', color: QF.colors.textMuted },
  questStat:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  xpBadge:     { fontSize: 11, fontWeight: '800' },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: QF.spacing.sm },
  statCard: {
    width: CARD_W,
    backgroundColor: QF.colors.surface,
    borderRadius: QF.radius.xl,
    borderWidth: 1,
    padding: QF.spacing.md, alignItems: 'center',
  },
  statBadge:     { borderRadius: QF.radius.full, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  statBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statIcon:      { fontSize: 22, marginBottom: 2 },
  statFull:      { fontSize: QF.font.xs, color: QF.colors.textSecondary, marginBottom: 4 },
  statLevel:     { fontSize: QF.font.base, fontWeight: '800', marginBottom: 6 },
  statXp:        { fontSize: 10, color: QF.colors.textMuted, marginTop: 4 },

  // Shared bar
  barBg:   { height: 5, backgroundColor: QF.colors.cardBorder, borderRadius: QF.radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: QF.radius.full },

  // Agenda
  emptyText: { color: QF.colors.textMuted, fontSize: QF.font.sm, textAlign: 'center', paddingVertical: 16 },
  timelineRow:  { flexDirection: 'row', gap: QF.spacing.md, marginBottom: QF.spacing.sm },
  timelineLeft: { alignItems: 'center', width: 44 },
  timelineHora: { fontSize: 10, color: QF.colors.textMuted, marginBottom: 4 },
  timelineDot:  { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { width: 2, flex: 1, backgroundColor: QF.colors.cardBorder, marginTop: 2 },
  timelineCard: {
    flex: 1, backgroundColor: QF.colors.elevated,
    borderRadius: QF.radius.lg, borderLeftWidth: 3,
    padding: QF.spacing.md, marginBottom: 4,
  },
  timelineLabel: { fontSize: QF.font.md, fontWeight: '600', color: QF.colors.textPrimary },
  timelineTipo:  { fontSize: 10, fontWeight: '600', marginTop: 2 },

  // Missions
  misionCard: {
    backgroundColor: QF.colors.elevated,
    borderRadius: QF.radius.xl,
    borderWidth: 1, borderColor: QF.colors.cardBorder, borderLeftWidth: 3,
    padding: QF.spacing.md, gap: 6,
  },
  misionRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  misionDot:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  misionTitulo: { flex: 1, fontSize: QF.font.md, fontWeight: '700', color: QF.colors.textPrimary },
  misionDone:   { textDecorationLine: 'line-through', color: QF.colors.textMuted },
  misionCount:  { fontSize: 11, fontWeight: '800' },
  misionSubList: { marginTop: 4, gap: 4 },
  misionSubRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  misionSubDot:  { width: 6, height: 6, borderRadius: 3 },
  misionSubText: { flex: 1, fontSize: 11, color: QF.colors.textSecondary },
});
