import {
  addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Dimensions, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { db } from '@/lib/firebase';
import { useUsuario } from '@/context/UsuarioContext';
import { QF } from '@/constants/questflow';

const { width } = Dimensions.get('window');
const DAY_CELL = Math.floor((width - QF.spacing.lg * 2 - QF.spacing.sm * 6) / 7);

type Recurrence = 'once' | 'daily' | 'weekly';

type Tarea = {
  id: string;
  titulo: string;
  hora?: string;
  recurrence: Recurrence;
  weekday?: number; // 0=domingo
  date?: string;   // YYYY-MM-DD para 'once'
  color: string;
  completedDates: string[];
};

const COLORS = [
  QF.colors.accent,
  QF.colors.stats.fuerza.main,
  QF.colors.stats.inteligencia.main,
  QF.colors.stats.carisma.main,
  QF.colors.stats.agilidad.main,
  QF.colors.stats.resistencia.main,
  QF.colors.stats.sabiduria.main,
];

const WEEKDAY_NAMES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const WEEKDAY_FULL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getMondayOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDays(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function tareaOcurreEn(t: Tarea, date: Date): boolean {
  const iso = toISO(date);
  if (t.recurrence === 'daily') return true;
  if (t.recurrence === 'weekly') return date.getDay() === t.weekday;
  if (t.recurrence === 'once') return t.date === iso;
  return false;
}

export default function CalendarScreen() {
  const { usuario } = useUsuario();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [formTitulo, setFormTitulo] = useState('');
  const [formHora, setFormHora] = useState('');
  const [formRecurrence, setFormRecurrence] = useState<Recurrence>('once');
  const [formWeekday, setFormWeekday] = useState(1);
  const [formColor, setFormColor] = useState<string>(QF.colors.accent);

  useEffect(() => {
    if (!usuario?.uid) return;
    return onSnapshot(collection(db, 'usuarios', usuario.uid, 'tareas'), snap => {
      const items: Tarea[] = [];
      snap.forEach(d => {
        const data = d.data();
        items.push({
          id: d.id,
          titulo: data.titulo,
          hora: data.hora,
          recurrence: data.recurrence || 'once',
          weekday: data.weekday,
          date: data.date,
          color: data.color || QF.colors.accent,
          completedDates: data.completedDates || [],
        });
      });
      setTareas(items);
    });
  }, [usuario?.uid]);

  const weekDays = getWeekDays(weekStart);
  const today = toISO(new Date());
  const selectedISO = toISO(selected);

  const tareasDelDia = tareas.filter(t => tareaOcurreEn(t, selected));

  function openNew() {
    setEditId(null);
    setFormTitulo('');
    setFormHora('');
    setFormRecurrence('once');
    setFormWeekday(selected.getDay() === 0 ? 0 : selected.getDay());
    setFormColor(QF.colors.accent);
    setModalVisible(true);
  }

  function openEdit(t: Tarea) {
    setEditId(t.id);
    setFormTitulo(t.titulo);
    setFormHora(t.hora || '');
    setFormRecurrence(t.recurrence);
    setFormWeekday(t.weekday ?? 1);
    setFormColor(t.color);
    setModalVisible(true);
  }

  async function guardar() {
    if (!usuario?.uid || !formTitulo.trim()) return;
    const data = {
      titulo: formTitulo.trim(),
      hora: formHora.trim() || null,
      recurrence: formRecurrence,
      weekday: formRecurrence === 'weekly' ? formWeekday : null,
      date: formRecurrence === 'once' ? selectedISO : null,
      color: formColor,
      completedDates: [],
    };
    if (editId) {
      await updateDoc(doc(db, 'usuarios', usuario.uid, 'tareas', editId), data);
    } else {
      await addDoc(collection(db, 'usuarios', usuario.uid, 'tareas'), data);
    }
    setModalVisible(false);
  }

  async function eliminar() {
    if (!usuario?.uid || !editId) return;
    await deleteDoc(doc(db, 'usuarios', usuario.uid, 'tareas', editId));
    setModalVisible(false);
  }

  async function toggleComplete(t: Tarea) {
    if (!usuario?.uid) return;
    const done = t.completedDates.includes(selectedISO);
    const next = done
      ? t.completedDates.filter(d => d !== selectedISO)
      : [...t.completedDates, selectedISO];
    await updateDoc(doc(db, 'usuarios', usuario.uid, 'tareas', t.id), { completedDates: next });
  }

  const monthLabel = selected.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Battle Log</Text>
        <Text style={styles.headerSub}>{monthLabel}</Text>
      </View>

      {/* Week Nav */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}
        >
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.weekRow}>
          {weekDays.map((day, i) => {
            const iso = toISO(day);
            const isToday = iso === today;
            const isSel = iso === selectedISO;
            const hasTasks = tareas.some(t => tareaOcurreEn(t, day));
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayCell, isSel && styles.dayCellSelected, isToday && !isSel && styles.dayCellToday]}
                onPress={() => setSelected(new Date(day))}
              >
                <Text style={[styles.dayName, isSel && styles.dayNameSel]}>{WEEKDAY_NAMES[day.getDay()]}</Text>
                <Text style={[styles.dayNum, isSel && styles.dayNumSel, isToday && !isSel && { color: QF.colors.accent }]}>
                  {day.getDate()}
                </Text>
                {hasTasks && <View style={[styles.dayDot, isSel && { backgroundColor: '#fff' }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}
        >
          <Text style={styles.navBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day label */}
      <View style={styles.dayHeader}>
        <Text style={styles.dayHeaderText}>
          {WEEKDAY_FULL[selected.getDay()]} {selected.getDate()}
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={openNew}>
          <Text style={styles.addBtnText}>+ Quest</Text>
        </TouchableOpacity>
      </View>

      {/* Tasks */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {tareasDelDia.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Sin quests para este día</Text>
          </View>
        )}
        {tareasDelDia
          .sort((a, b) => (a.hora || 'zzz').localeCompare(b.hora || 'zzz'))
          .map(t => {
            const done = t.completedDates.includes(selectedISO);
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.taskCard, { borderLeftColor: t.color, opacity: done ? 0.55 : 1 }]}
                onLongPress={() => openEdit(t)}
                onPress={() => toggleComplete(t)}
                activeOpacity={0.75}
              >
                <View style={[styles.taskCheck, { borderColor: t.color, backgroundColor: done ? t.color : 'transparent' }]}>
                  {done && <Text style={styles.taskCheckMark}>✓</Text>}
                </View>
                <View style={styles.taskBody}>
                  <Text style={[styles.taskTitle, done && styles.taskDone]}>{t.titulo}</Text>
                  <Text style={[styles.taskMeta, { color: t.color }]}>
                    {t.hora ? `🕐 ${t.hora}  ` : ''}
                    {t.recurrence === 'daily' ? '🔁 diaria' : t.recurrence === 'weekly' ? `🔁 ${WEEKDAY_FULL[t.weekday ?? 0]}` : '📌 única'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editId ? 'Editar Quest' : 'Nueva Quest'}</Text>

            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              value={formTitulo}
              onChangeText={setFormTitulo}
              placeholder="Nombre de la quest…"
              placeholderTextColor={QF.colors.textMuted}
            />

            <Text style={styles.label}>Hora (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={formHora}
              onChangeText={setFormHora}
              placeholder="09:00"
              placeholderTextColor={QF.colors.textMuted}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.label}>Recurrencia</Text>
            <View style={styles.segmented}>
              {(['once', 'daily', 'weekly'] as Recurrence[]).map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.segBtn, formRecurrence === r && styles.segBtnActive]}
                  onPress={() => setFormRecurrence(r)}
                >
                  <Text style={[styles.segBtnText, formRecurrence === r && styles.segBtnTextActive]}>
                    {r === 'once' ? 'Única' : r === 'daily' ? 'Diaria' : 'Semanal'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {formRecurrence === 'weekly' && (
              <>
                <Text style={styles.label}>Día</Text>
                <View style={styles.segmented}>
                  {WEEKDAY_FULL.map((d, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.segBtnSm, formWeekday === i && styles.segBtnActive]}
                      onPress={() => setFormWeekday(i)}
                    >
                      <Text style={[styles.segBtnText, { fontSize: 10 }, formWeekday === i && styles.segBtnTextActive]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorSwatch, { backgroundColor: c }, formColor === c && styles.colorSwatchActive]}
                  onPress={() => setFormColor(c)}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              {editId && (
                <TouchableOpacity style={styles.btnDanger} onPress={eliminar}>
                  <Text style={styles.btnDangerText}>Eliminar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={guardar}>
                <Text style={styles.btnPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: QF.colors.bg },
  header: { paddingTop: QF.spacing.xl + 16, paddingHorizontal: QF.spacing.lg, paddingBottom: QF.spacing.md },
  headerTitle: { fontSize: QF.font.xxl, fontWeight: '800', color: QF.colors.textPrimary },
  headerSub: { fontSize: QF.font.sm, color: QF.colors.textSecondary, textTransform: 'capitalize', marginTop: 2 },

  weekNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: QF.spacing.sm, marginBottom: QF.spacing.sm },
  navBtn: { width: 32, alignItems: 'center' },
  navBtnText: { fontSize: 24, color: QF.colors.textSecondary, lineHeight: 28 },
  weekRow: { flex: 1, flexDirection: 'row', gap: 4 },
  dayCell: {
    flex: 1, alignItems: 'center', paddingVertical: 8,
    borderRadius: QF.radius.lg, backgroundColor: QF.colors.surface,
  },
  dayCellSelected: { backgroundColor: QF.colors.accent },
  dayCellToday: { borderWidth: 1, borderColor: QF.colors.accent },
  dayName: { fontSize: 9, fontWeight: '700', color: QF.colors.textMuted, letterSpacing: 0.5 },
  dayNameSel: { color: '#fff' },
  dayNum: { fontSize: QF.font.md, fontWeight: '700', color: QF.colors.textPrimary },
  dayNumSel: { color: '#fff' },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: QF.colors.accent, marginTop: 3 },

  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: QF.spacing.lg, paddingVertical: QF.spacing.md,
  },
  dayHeaderText: { fontSize: QF.font.lg, fontWeight: '700', color: QF.colors.textPrimary },
  addBtn: {
    backgroundColor: QF.colors.accentGlow, borderRadius: QF.radius.full,
    borderWidth: 1, borderColor: QF.colors.accent, paddingHorizontal: 14, paddingVertical: 6,
  },
  addBtnText: { fontSize: QF.font.sm, fontWeight: '700', color: QF.colors.accent },

  list: { flex: 1 },
  listContent: { paddingHorizontal: QF.spacing.lg, paddingTop: QF.spacing.xs },
  emptyBox: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: QF.colors.textMuted, fontSize: QF.font.sm },

  taskCard: {
    backgroundColor: QF.colors.surface, borderRadius: QF.radius.xl,
    borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center',
    padding: QF.spacing.md, marginBottom: QF.spacing.sm, gap: QF.spacing.md,
  },
  taskCheck: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  taskCheckMark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: QF.font.md, fontWeight: '600', color: QF.colors.textPrimary },
  taskDone: { textDecorationLine: 'line-through', color: QF.colors.textMuted },
  taskMeta: { fontSize: 11, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: QF.colors.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: QF.colors.surface, borderTopLeftRadius: QF.radius.xxxl,
    borderTopRightRadius: QF.radius.xxxl, padding: QF.spacing.xxl,
  },
  modalTitle: { fontSize: QF.font.xl, fontWeight: '800', color: QF.colors.textPrimary, marginBottom: QF.spacing.lg },
  label: { fontSize: QF.font.xs, fontWeight: '700', color: QF.colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, marginTop: QF.spacing.sm },
  input: {
    backgroundColor: QF.colors.bg, borderRadius: QF.radius.lg, borderWidth: 1,
    borderColor: QF.colors.cardBorder, padding: QF.spacing.md,
    color: QF.colors.textPrimary, fontSize: QF.font.md,
  },
  segmented: { flexDirection: 'row', gap: QF.spacing.xs },
  segBtn: {
    flex: 1, paddingVertical: 8, borderRadius: QF.radius.md,
    backgroundColor: QF.colors.bg, borderWidth: 1, borderColor: QF.colors.cardBorder, alignItems: 'center',
  },
  segBtnSm: {
    flex: 1, paddingVertical: 6, borderRadius: QF.radius.sm,
    backgroundColor: QF.colors.bg, borderWidth: 1, borderColor: QF.colors.cardBorder, alignItems: 'center',
  },
  segBtnActive: { backgroundColor: QF.colors.accentGlow, borderColor: QF.colors.accent },
  segBtnText: { fontSize: QF.font.sm, fontWeight: '600', color: QF.colors.textSecondary },
  segBtnTextActive: { color: QF.colors.accent },
  colorRow: { flexDirection: 'row', gap: QF.spacing.sm, flexWrap: 'wrap', marginTop: 4 },
  colorSwatch: { width: 28, height: 28, borderRadius: 14 },
  colorSwatchActive: { borderWidth: 3, borderColor: '#fff' },
  modalActions: { flexDirection: 'row', gap: QF.spacing.sm, marginTop: QF.spacing.xl },
  btnDanger: { flex: 1, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: QF.radius.xl, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: QF.colors.danger },
  btnDangerText: { color: QF.colors.danger, fontWeight: '700', fontSize: QF.font.md },
  btnCancel: { flex: 1, backgroundColor: QF.colors.bg, borderRadius: QF.radius.xl, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: QF.colors.cardBorder },
  btnCancelText: { color: QF.colors.textSecondary, fontWeight: '700', fontSize: QF.font.md },
  btnPrimary: { flex: 1, backgroundColor: QF.colors.accent, borderRadius: QF.radius.xl, paddingVertical: 14, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: QF.font.md },
});
