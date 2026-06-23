import { useEffect, useState, useMemo, type ReactNode } from 'react';
import {
  LayoutDashboard, Calendar as CalendarIcon, Zap, Settings,
  CheckCircle2, Plus, Target, Sword, Flame, Dumbbell,
  ChevronRight, Bell, Search, Trophy, Menu, Pencil,
  Repeat, CalendarDays, LogOut, Trash2, X, Utensils,
  Wallet, TrendingUp, TrendingDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis,
  BarChart, Bar, Tooltip, Cell,
} from 'recharts';
import {
  format, addDays, startOfWeek, eachDayOfInterval,
  isSameDay, isToday, getDay,
} from 'date-fns';
import {
  onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider,
  reauthenticateWithPopup,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  collection, doc, increment, onSnapshot,
  updateDoc, addDoc, deleteDoc, writeBatch,
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import type {
  FSStatKey, FSStatsDoc, FSHabito, FSEvento, FSMision, FSTarea,
  GCalEvent, FSEjercicio, FSRutina, EstadoLibro, FSCapitulo, FSLibro,
  TipoMaterial, FSMaterial, FSTareaFac, FSExamen, FSMateria,
  FSEntradaDiario, FSObjetivoCHA, FSTransaccion, Habit, Task, HabitRecurrence, TabId, Moneda,
} from './types';
import confetti from 'canvas-confetti';
import { HOY, FS_KEYS, STAT_META, DIAS_CORTO, DIAS_LETRA, ESTADO_LIBRO_META, MATERIAL_ICON, CATEGORIAS_GASTO, CATEGORIAS_INGRESO, CLASS_META, RANK_META, MONEDA_META } from './utils/constants';
import { xpLevel, statsFromDoc, buildTree, youtubeEmbedUrl, isHabitActiveToday, isHabitDoneToday, isDateInCurrentWeek, habitRecurrenceLabel, calcStreak, calcMainLevel, rankFromLevel, assignClass, calcXpPerDay } from './utils/helpers';
import { ProgressBar } from './components/ProgressBar';
import { StatCard } from './components/StatCard';
import { CapituloRow } from './components/CapituloRow';
import { EjercicioRow } from './components/EjercicioRow';
import { MissionNodeComp } from './components/MissionNodeComp';
import { LoginScreen } from './components/LoginScreen';

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser]           = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataReady,   setDataReady]   = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Firestore raw state
  const [fsStats,    setFsStats]    = useState<FSStatsDoc | null>(null);
  const [fsHabitos,  setFsHabitos]  = useState<FSHabito[]>([]);
  const [fsEventos,  setFsEventos]  = useState<FSEvento[]>([]);
  const [fsMisiones, setFsMisiones] = useState<FSMision[]>([]);
  const [fsTareas,   setFsTareas]   = useState<FSTarea[]>([]);

  // UI state
  const [tab,         setTab]         = useState<TabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selDate,     setSelDate]     = useState(new Date());

  const [attrStat, setAttrStat] = useState<FSStatKey>('fuerza');

  // Google Calendar state
  const [gcalToken,  setGcalToken]  = useState<string | null>(null);
  const [gcalEvents, setGcalEvents] = useState<GCalEvent[]>([]);

  // Rutinas state
  const [fsRutinas,      setFsRutinas]      = useState<FSRutina[]>([]);
  const [gymInnerTab,    setGymInnerTab]    = useState<'entreno' | 'comida'>('entreno');
  const [targetRutinaId,    setTargetRutinaId]    = useState<string | null>(null);
  const [targetEjercicioId, setTargetEjercicioId] = useState<string | null>(null);

  const [editingHabitXp, setEditingHabitXp] = useState<string | null>(null);

  // Inteligencia — Biblioteca
  const [fsLibros,      setFsLibros]      = useState<FSLibro[]>([]);
  const [expandedLibro, setExpandedLibro] = useState<string | null>(null);
  const [intTab,        setIntTab]        = useState<'biblioteca' | 'facultad'>('biblioteca');

  // Inteligencia — Facultad
  const [fsMaterias,      setFsMaterias]      = useState<FSMateria[]>([]);
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
  const [matSubTab,       setMatSubTab]       = useState<'materiales' | 'tareas' | 'examenes'>('materiales');
  const [targetMateriaId, setTargetMateriaId] = useState<string | null>(null);

  // Transacciones
  const [fsTransacciones,  setFsTransacciones]  = useState<FSTransaccion[]>([]);
  const [showTxModal,      setShowTxModal]      = useState(false);
  const [editingTxId,      setEditingTxId]      = useState<string | null>(null);
  const [txMesFilter,      setTxMesFilter]      = useState(HOY.slice(0, 7));
  const [txForm,           setTxForm]           = useState({ descripcion: '', monto: '', tipo: 'gasto' as 'ingreso' | 'gasto', categoria: '', fecha: HOY, moneda: 'ARS' as Moneda });

  // Carisma — Diario + Objetivos (pendiente de implementar UI)
  const [_fsDiario,         setFsDiario]          = useState<FSEntradaDiario[]>([]);
  const [_fsObjetivosCHA,   setFsObjetivosCHA]    = useState<FSObjetivoCHA[]>([]);
  const [_expandedEntrada,  _setExpandedEntrada]  = useState<string | null>(null);
  const [_nuevaObjetivoTxt, _setNuevaObjetivoTxt] = useState('');

  // Modal state
  const [modal, setModal] = useState<'habit' | 'task' | 'evento' | 'rutina' | 'ejercicio' | 'libro' | 'materia' | 'material' | 'tareaFac' | 'examen' | 'entrada_diario' | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [habitForm,      setHabitForm]      = useState({ nombre: '', stat: 'fuerza' as FSStatKey, recurrence: 'daily' as HabitRecurrence, diasSemana: [] as number[] });
  const [taskForm,     setTaskForm]     = useState({ titulo: '', hora: '', recurrence: 'once' as FSTarea['recurrence'], weekday: 1, date: HOY, color: '#3b82f6' });
  const [eventoForm,   setEventoForm]   = useState({ titulo: '', hora: '', fecha: HOY });
  const [rutinaForm,   setRutinaForm]   = useState({ nombre: '', diasSemana: [] as number[] });
  const [ejercicioForm, setEjercicioForm] = useState({ nombre: '', series: 3, reps: '8-12', notas: '', mediaUrl: '' });
  const [libroForm,     setLibroForm]     = useState({ titulo: '', autor: '', estado: 'pendiente' as EstadoLibro, totalCapitulos: 10, xpPorCapitulo: 5 });
  const [materiaForm,   setMateriaForm]   = useState({ nombre: '', color: '#6366f1' });
  const [materialForm,  setMaterialForm]  = useState({ tipo: 'nota' as TipoMaterial, titulo: '', contenido: '', url: '' });
  const [tareaFacForm,  setTareaFacForm]  = useState({ titulo: '', fecha: '' });
  const [examenForm,        setExamenForm]        = useState({ titulo: '', fecha: '', nota: '', notaMax: '10' });
  const [_entradaDiarioForm, _setEntradaDiarioForm] = useState({ titulo: '', contenido: '' });
  const [modalError,    setModalError]    = useState<string | null>(null);

  function showToast(msg: string, ok = false) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // Clear modal error when modal type changes
  useEffect(() => { setModalError(null); }, [modal]);

  // Auth listener
  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); }), []);

  // Persistir dark mode en localStorage
  useEffect(() => {
    const saved = localStorage.getItem('questflow_dark');
    if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Load GCal token from localStorage
  useEffect(() => {
    const token = localStorage.getItem('gcal_token');
    const exp   = parseInt(localStorage.getItem('gcal_token_exp') || '0');
    if (token && exp > Date.now()) setGcalToken(token);
  }, []);

  // Fetch GCal events when token available
  useEffect(() => {
    if (!gcalToken) return;
    const start = addDays(new Date(), -7);
    const end   = addDays(new Date(), 60);
    const params = new URLSearchParams({
      timeMin: start.toISOString(), timeMax: end.toISOString(),
      singleEvents: 'true', orderBy: 'startTime', maxResults: '500',
    });
    fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${gcalToken}` },
    }).then(r => {
      if (r.status === 401) {
        setGcalToken(null);
        localStorage.removeItem('gcal_token');
        localStorage.removeItem('gcal_token_exp');
        return null;
      }
      return r.json();
    }).then(data => { if (data?.items) setGcalEvents(data.items); });
  }, [gcalToken]);

  // Firestore listeners
  useEffect(() => {
    if (!user?.uid) return;
    setDataReady(false);
    const uid = user.uid;
    let loaded = 0;
    const markLoaded = () => { if (++loaded === 11) setDataReady(true); };
    let prevStatsDoc: FSStatsDoc | null = null;
    const unsubStats = onSnapshot(doc(db, 'usuarios', uid, 'stats', 'main'), snap => {
      const newStats = snap.data() as FSStatsDoc ?? null;
      if (prevStatsDoc && newStats) {
        const leveledUp = FS_KEYS.some(k =>
          xpLevel(newStats[k]?.xp ?? 0).level > xpLevel(prevStatsDoc![k]?.xp ?? 0).level
        );
        if (leveledUp) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'] });
          showToast('¡Subiste de nivel! 🎉', true);
        }
      }
      prevStatsDoc = newStats;
      setFsStats(newStats);
      markLoaded();
    });
    const u2  = onSnapshot(collection(db, 'usuarios', uid, 'habitos'),       s => { setFsHabitos(s.docs.map(d => ({ id: d.id, ...d.data() } as FSHabito))); markLoaded(); });
    const u3  = onSnapshot(collection(db, 'usuarios', uid, 'eventos'),       s => { setFsEventos(s.docs.map(d => ({ id: d.id, ...d.data() } as FSEvento))); markLoaded(); });
    const u4  = onSnapshot(collection(db, 'usuarios', uid, 'misiones'),      s => { setFsMisiones(s.docs.map(d => ({ id: d.id, ...d.data() } as FSMision))); markLoaded(); });
    const u5  = onSnapshot(collection(db, 'usuarios', uid, 'tareas'),        s => { setFsTareas(s.docs.map(d => ({ id: d.id, ...d.data() } as FSTarea))); markLoaded(); });
    const u6  = onSnapshot(collection(db, 'usuarios', uid, 'rutinas'),       s => { setFsRutinas(s.docs.map(d => ({ id: d.id, ...d.data() } as FSRutina))); markLoaded(); });
    const u7  = onSnapshot(collection(db, 'usuarios', uid, 'libros'),        s => { setFsLibros(s.docs.map(d => ({ id: d.id, ...d.data() } as FSLibro))); markLoaded(); });
    const u8  = onSnapshot(collection(db, 'usuarios', uid, 'materias'),      s => { setFsMaterias(s.docs.map(d => ({ id: d.id, ...d.data() } as FSMateria))); markLoaded(); });
    const u9  = onSnapshot(collection(db, 'usuarios', uid, 'diario'),        s => { setFsDiario(s.docs.map(d => ({ id: d.id, ...d.data() } as FSEntradaDiario))); markLoaded(); });
    const u10 = onSnapshot(collection(db, 'usuarios', uid, 'objetivos_cha'), s => { setFsObjetivosCHA(s.docs.map(d => ({ id: d.id, ...d.data() } as FSObjetivoCHA))); markLoaded(); });
    const u11 = onSnapshot(collection(db, 'usuarios', uid, 'transacciones'), s => { setFsTransacciones(s.docs.map(d => ({ id: d.id, ...d.data() } as FSTransaccion))); markLoaded(); });
    return () => { unsubStats(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); u9(); u10(); u11(); };
  }, [user?.uid]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const stats    = useMemo(() => statsFromDoc(fsStats), [fsStats]);
  const missions = useMemo(() => buildTree(fsMisiones), [fsMisiones]);
  const maxStatXp = useMemo(() => Math.max(...FS_KEYS.map(k => fsStats?.[k]?.xp ?? 0), 1), [fsStats]);
  const radarData = useMemo(() => FS_KEYS.map(k => ({
    subject: STAT_META[k].shortName,
    A: Math.round(((fsStats?.[k]?.xp ?? 0) / maxStatXp) * 100),
    fullMark: 100,
  })), [fsStats, maxStatXp]);

  const habits: Habit[] = useMemo(() => fsHabitos.map(h => ({
    id: h.id, name: h.nombre, stat: h.stat,
    icon: STAT_META[h.stat]?.icon ?? <Zap className="w-4 h-4" />,
    completed: isHabitDoneToday(h),
    activeToday: isHabitActiveToday(h),
    attribute: STAT_META[h.stat]?.name ?? h.stat,
    xpValue: h.xpValue ?? 20,
    recurrence: h.recurrence ?? 'daily',
    diasSemana: h.diasSemana ?? [],
  })), [fsHabitos]);

  const todayEventos = useMemo(() => fsEventos.filter(e => e.fecha === HOY), [fsEventos]);

  const txStats = useMemo(() => {
    const txMes = fsTransacciones.filter(t => t.fecha.startsWith(txMesFilter));
    const ingresosMes = txMes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
    const gastosMes   = txMes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0);

    // Saldo por moneda
    const porMoneda: Record<string, { ingresos: number; gastos: number; saldo: number }> = {};
    for (const t of fsTransacciones) {
      const m = t.moneda ?? 'ARS';
      if (!porMoneda[m]) porMoneda[m] = { ingresos: 0, gastos: 0, saldo: 0 };
      porMoneda[m].saldo += t.tipo === 'ingreso' ? t.monto : -t.monto;
      if (t.tipo === 'ingreso') porMoneda[m].ingresos += t.monto;
      else porMoneda[m].gastos += t.monto;
    }

    // Gráfico por categoría (del mes filtrado)
    const catMap: Record<string, number> = {};
    for (const t of txMes.filter(t => t.tipo === 'gasto')) {
      const cat = t.categoria || '📦 Otro';
      catMap[cat] = (catMap[cat] ?? 0) + t.monto;
    }
    const porCategoria = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: name.split(' ').slice(1).join(' ') || name, value }));

    const ordenadas = [...fsTransacciones].sort((a, b) => b.fecha.localeCompare(a.fecha));
    return { ingresosMes, gastosMes, porMoneda, porCategoria, ordenadas };
  }, [fsTransacciones, txMesFilter]);

  // Nivel principal, rango y clase
  const mainLevelData = useMemo(() => calcMainLevel(fsStats), [fsStats]);
  const heroRank      = useMemo(() => rankFromLevel(mainLevelData.level), [mainLevelData.level]);
  const heroClass     = useMemo(() => assignClass(fsStats), [fsStats]);

  // XP por día y logros
  const xpPerDay = calcXpPerDay(fsHabitos, 14);
  const logrosUnlocked = useMemo(() => {
    const ids: string[] = [];
    if (fsHabitos.some(h => (h.completedDates?.length ?? 0) > 0)) ids.push('primera_quest');
    if (fsHabitos.some(h => calcStreak(h.completedDates ?? [], h.recurrence ?? 'daily') >= 7)) ids.push('racha_7');
    if (fsHabitos.some(h => calcStreak(h.completedDates ?? [], h.recurrence ?? 'daily') >= 30)) ids.push('racha_30');
    if (Object.values(fsStats ?? {}).some((s: { xp: number }) => xpLevel(s.xp).level >= 5)) ids.push('nivel_5');
    if (Object.values(fsStats ?? {}).some((s: { xp: number }) => xpLevel(s.xp).level >= 10)) ids.push('nivel_10');
    if (fsLibros.some(l => l.estado === 'leido')) ids.push('primer_libro');
    if (fsMaterias.some(m => m.examenes.some(e => e.nota !== undefined))) ids.push('primer_examen');
    const habitsToday = fsHabitos.filter(h => isHabitActiveToday(h));
    const doneToday   = fsHabitos.filter(h => isHabitDoneToday(h)).length;
    if (habitsToday.length > 0 && doneToday === habitsToday.length) ids.push('todos_hoy');
    return ids;
  }, [fsHabitos, fsStats, fsLibros, fsMaterias]);

  const filterTasks = (d: Date): Task[] => {
    const dStr = d.toISOString().slice(0, 10);
    return fsTareas
      .filter(t => {
        if (t.recurrence === 'daily') return true;
        if (t.recurrence === 'weekly' && t.weekday === getDay(d)) return true;
        if (t.recurrence === 'once' && t.date === dStr) return true;
        return false;
      })
      .map(t => ({
        id: t.id, title: t.titulo, time: t.hora ?? '',
        color: t.color ?? '#3b82f6',
        completed: t.completedDates?.includes(dStr) ?? false,
        recurrence: t.recurrence, weekday: t.weekday, date: t.date,
        completedDates: t.completedDates ?? [],
      }));
  };

  const habitsToday  = habits.filter(h => h.activeToday);
  const done         = habitsToday.filter(h => h.completed).length;

  const totalXp                                   = fsStats ? FS_KEYS.reduce((s, k) => s + (fsStats[k]?.xp ?? 0), 0) : 0;
  const { level: heroLevel, xpInLevel, xpForNext: heroXpForNext } = xpLevel(totalXp);
  const initials   = (user?.displayName ?? 'H').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  // ── Firestore writes ──────────────────────────────────────────────────────

  async function toggleHabit(id: string) {
    if (!user?.uid) return;
    const h = fsHabitos.find(x => x.id === id);
    if (!h || !isHabitActiveToday(h)) return;
    const yaHecho = isHabitDoneToday(h);
    const prev = h.completedDates ?? (h.fechaCompletado ? [h.fechaCompletado] : []);
    const toggled = yaHecho
      ? (h.recurrence === 'once_week' ? prev.filter(d => !isDateInCurrentWeek(d)) : prev.filter(d => d !== HOY))
      : [...prev, HOY];
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
    const next = toggled.filter(d => d >= cutoff.toISOString().slice(0, 10));
    const xp = h.xpValue ?? 20;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'usuarios', user.uid, 'habitos', id), { completedDates: next, fechaCompletado: null });
      batch.set(doc(db, 'usuarios', user.uid, 'stats', 'main'), { [h.stat]: { xp: increment(yaHecho ? -xp : xp) } }, { merge: true });
      await batch.commit();
    } catch {
      showToast('Error al guardar el hábito');
    }
  }

  async function toggleTask(id: string, d: Date) {
    if (!user?.uid) return;
    const dStr = d.toISOString().slice(0, 10);
    const t = fsTareas.find(x => x.id === id);
    if (!t) return;
    const prev = t.completedDates ?? [];
    const toggled = prev.includes(dStr) ? prev.filter(x => x !== dStr) : [...prev, dStr];
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 90);
    const next = toggled.filter(x => x >= cutoff.toISOString().slice(0, 10));
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'tareas', id), { completedDates: next });
    } catch {
      showToast('Error al guardar la tarea');
    }
  }

  async function addMission(parentId: string, title: string) {
    if (!user?.uid) return;
    const realParent = parentId === 'root' ? null : parentId;
    try {
      await addDoc(collection(db, 'usuarios', user.uid, 'misiones'), {
        titulo: title, completada: false, parentId: realParent,
        orden: fsMisiones.filter(m => m.parentId === realParent).length,
      });
    } catch {
      showToast('Error al agregar la misión');
    }
  }

  async function toggleMission(id: string) {
    if (!user?.uid) return;
    const m = fsMisiones.find(x => x.id === id);
    if (!m) return;
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'misiones', id), { completada: !m.completada });
    } catch {
      showToast('Error al actualizar la misión');
    }
  }

  function openEditHabit(id: string) {
    const h = fsHabitos.find(x => x.id === id);
    if (!h) return;
    setEditingHabitId(id);
    setHabitForm({ nombre: h.nombre, stat: h.stat, recurrence: h.recurrence ?? 'daily', diasSemana: h.diasSemana ?? [] });
    setModal('habit');
  }

  async function saveHabit() {
    if (!user?.uid || !habitForm.nombre.trim()) return;
    const data = {
      nombre: habitForm.nombre.trim(),
      stat: habitForm.stat,
      recurrence: habitForm.recurrence,
      diasSemana: habitForm.recurrence === 'weekly' ? habitForm.diasSemana : [],
    };
    try {
      if (editingHabitId) {
        await updateDoc(doc(db, 'usuarios', user.uid, 'habitos', editingHabitId), data);
        setEditingHabitId(null);
      } else {
        await addDoc(collection(db, 'usuarios', user.uid, 'habitos'), { ...data, fechaCompletado: null, completedDates: [] });
      }
      setHabitForm({ nombre: '', stat: 'fuerza', recurrence: 'daily', diasSemana: [] });
      setModal(null);
    } catch (e: unknown) {
      setModalError((e as Error).message ?? 'Error al guardar');
    }
  }

  async function deleteHabit(id: string) {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, 'usuarios', user.uid, 'habitos', id));
    } catch {
      showToast('Error al eliminar el hábito');
    }
  }

  async function updateHabitXp(id: string, xpValue: number) {
    if (!user?.uid || xpValue < 1) return;
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'habitos', id), { xpValue });
    } catch {
      showToast('Error al guardar el XP');
    }
  }

  async function addTask() {
    if (!user?.uid || !taskForm.titulo.trim()) return;
    const data: Omit<FSTarea, 'id'> = {
      titulo: taskForm.titulo.trim(),
      recurrence: taskForm.recurrence,
      color: taskForm.color,
      completedDates: [],
      ...(taskForm.hora ? { hora: taskForm.hora } : {}),
      ...(taskForm.recurrence === 'weekly' ? { weekday: taskForm.weekday } : {}),
      ...(taskForm.recurrence === 'once' ? { date: taskForm.date } : {}),
    };
    try {
      await addDoc(collection(db, 'usuarios', user.uid, 'tareas'), data);
      setTaskForm({ titulo: '', hora: '', recurrence: 'once', weekday: 1, date: HOY, color: '#3b82f6' });
      setModal(null);
    } catch (e: unknown) {
      setModalError((e as Error).message ?? 'Error al guardar');
    }
  }

  async function deleteTask(id: string) {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, 'usuarios', user.uid, 'tareas', id));
    } catch {
      showToast('Error al eliminar la tarea');
    }
  }

  async function addEvento() {
    if (!user?.uid || !eventoForm.titulo.trim()) return;
    const data: Omit<FSEvento, 'id'> = {
      titulo: eventoForm.titulo.trim(),
      fecha: eventoForm.fecha,
      ...(eventoForm.hora ? { hora: eventoForm.hora } : {}),
    };
    try {
      await addDoc(collection(db, 'usuarios', user.uid, 'eventos'), data);
      setEventoForm({ titulo: '', hora: '', fecha: HOY });
      setModal(null);
    } catch (e: unknown) {
      setModalError((e as Error).message ?? 'Error al guardar');
    }
  }

  async function deleteEvento(id: string) {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, 'usuarios', user.uid, 'eventos', id));
    } catch {
      showToast('Error al eliminar el evento');
    }
  }

  async function addRutina() {
    if (!user?.uid || !rutinaForm.nombre.trim()) return;
    try {
      await addDoc(collection(db, 'usuarios', user.uid, 'rutinas'), {
        nombre: rutinaForm.nombre.trim(), diasSemana: rutinaForm.diasSemana,
        ejercicios: [], orden: fsRutinas.length,
      });
      setRutinaForm({ nombre: '', diasSemana: [] });
      setModal(null);
    } catch (e: unknown) {
      setModalError((e as Error).message ?? 'Error al guardar');
    }
  }

  async function deleteRutina(id: string) {
    if (!user?.uid) return;
    await deleteDoc(doc(db, 'usuarios', user.uid, 'rutinas', id));
  }

  async function addEjercicio() {
    if (!user?.uid || !targetRutinaId || !ejercicioForm.nombre.trim()) return;
    const rutina = fsRutinas.find(r => r.id === targetRutinaId);
    if (!rutina) return;
    const newEj: FSEjercicio = {
      id: Date.now().toString(), lastCompletedDate: null,
      nombre: ejercicioForm.nombre.trim(),
      ...(ejercicioForm.series  ? { series: ejercicioForm.series }   : {}),
      ...(ejercicioForm.reps    ? { reps: ejercicioForm.reps }       : {}),
      ...(ejercicioForm.notas   ? { notas: ejercicioForm.notas }     : {}),
      ...(ejercicioForm.mediaUrl ? { mediaUrl: ejercicioForm.mediaUrl } : {}),
    };
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'rutinas', targetRutinaId), {
        ejercicios: [...rutina.ejercicios, newEj],
      });
      setEjercicioForm({ nombre: '', series: 3, reps: '8-12', notas: '', mediaUrl: '' });
      setModal(null);
    } catch (e: unknown) {
      setModalError((e as Error).message ?? 'Error al guardar');
    }
  }

  async function updateEjercicio() {
    if (!user?.uid || !targetRutinaId || !targetEjercicioId || !ejercicioForm.nombre.trim()) return;
    const rutina = fsRutinas.find(r => r.id === targetRutinaId);
    if (!rutina) return;
    const ejercicios = rutina.ejercicios.map(e => {
      if (e.id !== targetEjercicioId) return e;
      return {
        ...e,
        nombre: ejercicioForm.nombre.trim(),
        series: ejercicioForm.series || e.series,
        reps: ejercicioForm.reps || e.reps,
        notas: ejercicioForm.notas,
        mediaUrl: ejercicioForm.mediaUrl,
      };
    });
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'rutinas', targetRutinaId), { ejercicios });
      setEjercicioForm({ nombre: '', series: 3, reps: '8-12', notas: '', mediaUrl: '' });
      setTargetEjercicioId(null);
      setModal(null);
    } catch (e: unknown) {
      setModalError((e as Error).message ?? 'Error al guardar');
    }
  }

  async function deleteEjercicio(rutinaId: string, ejId: string) {
    if (!user?.uid) return;
    const rutina = fsRutinas.find(r => r.id === rutinaId);
    if (!rutina) return;
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'rutinas', rutinaId), {
        ejercicios: rutina.ejercicios.filter(e => e.id !== ejId),
      });
    } catch {
      showToast('Error al eliminar el ejercicio');
    }
  }

  async function toggleEjercicio(rutinaId: string, ejId: string) {
    if (!user?.uid) return;
    const rutina = fsRutinas.find(r => r.id === rutinaId);
    if (!rutina) return;
    const ej = rutina.ejercicios.find(e => e.id === ejId);
    if (!ej) return;
    const completing = ej.lastCompletedDate !== HOY;
    const ejercicios = rutina.ejercicios.map(e =>
      e.id !== ejId ? e : { ...e, lastCompletedDate: completing ? HOY : null }
    );
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'usuarios', user.uid, 'rutinas', rutinaId), { ejercicios });
      batch.set(doc(db, 'usuarios', user.uid, 'stats', 'main'),
        { fuerza: { xp: increment(completing ? 5 : -5) } }, { merge: true });
      await batch.commit();
    } catch {
      showToast('Error al guardar el ejercicio');
    }
  }

  async function seedRutinaHipertrofia() {
    if (!user?.uid) return;
    const SEED = [
      { nombre: 'Pecho + Tríceps', diasSemana: [1], orden: 0, ejercicios: [
        { id: '1-1', nombre: 'Flexiones clásicas',       series: 4, reps: '12-15', notas: 'Manos al ancho de hombros',             lastCompletedDate: null },
        { id: '1-2', nombre: 'Flexiones diamante',       series: 3, reps: '10-12', notas: 'Manos juntas formando un diamante',      lastCompletedDate: null },
        { id: '1-3', nombre: 'Flexiones declinadas',     series: 3, reps: '10-12', notas: 'Pies elevados en silla o cama',          lastCompletedDate: null },
        { id: '1-4', nombre: 'Flexiones abiertas',       series: 3, reps: '12-15', notas: 'Manos más anchas que hombros',           lastCompletedDate: null },
        { id: '1-5', nombre: 'Dips en silla',            series: 4, reps: '10-12', notas: 'Manos apoyadas en silla, pies adelante', lastCompletedDate: null },
        { id: '1-6', nombre: 'Extensión tríceps c/peso', series: 3, reps: '12',    notas: 'Con mochila, bidón o lo que tengas',     lastCompletedDate: null },
      ]},
      { nombre: 'Espalda + Bíceps', diasSemana: [2], orden: 1, ejercicios: [
        { id: '2-1', nombre: 'Remo con bidones/mochila', series: 4, reps: '12',    notas: 'Inclinado 45°, tirar hacia el abdomen',          lastCompletedDate: null },
        { id: '2-2', nombre: 'Superman hold',            series: 4, reps: '15',    notas: 'Boca abajo, elevar brazos y piernas',            lastCompletedDate: null },
        { id: '2-3', nombre: 'Remo invertido (mesa)',    series: 3, reps: '10-12', notas: 'Acostado bajo una mesa resistente, tirar',       lastCompletedDate: null },
        { id: '2-4', nombre: 'Curl bíceps con peso',     series: 4, reps: '12',    notas: 'Con bidón de agua, mochila o bolsa',             lastCompletedDate: null },
        { id: '2-5', nombre: 'Curl martillo',            series: 3, reps: '12',    notas: 'Agarre neutro con el peso',                     lastCompletedDate: null },
        { id: '2-6', nombre: 'Encogimientos de hombros', series: 3, reps: '15',   notas: 'Con peso en cada mano',                         lastCompletedDate: null },
      ]},
      { nombre: 'Piernas + Core', diasSemana: [3], orden: 2, ejercicios: [
        { id: '3-1', nombre: 'Sentadillas',          series: 4, reps: '15-20',     notas: 'Con mochila cargada para más peso',               lastCompletedDate: null },
        { id: '3-2', nombre: 'Zancadas caminando',   series: 3, reps: '12 c/p',   notas: 'Paso largo, rodilla no pasa la punta del pie',    lastCompletedDate: null },
        { id: '3-3', nombre: 'Sentadilla búlgara',   series: 3, reps: '10 c/p',   notas: 'Pie trasero elevado en silla',                   lastCompletedDate: null },
        { id: '3-4', nombre: 'Puente de glúteos',    series: 4, reps: '15',       notas: 'Elevar cadera, apretar arriba 2s',               lastCompletedDate: null },
        { id: '3-5', nombre: 'Elevación de talones', series: 4, reps: '20',       notas: 'En un escalón, rango completo',                  lastCompletedDate: null },
        { id: '3-6', nombre: 'Plancha frontal',      series: 3, reps: '45s',      notas: 'Cuerpo recto, no hundir cadera',                 lastCompletedDate: null },
        { id: '3-7', nombre: 'Plancha lateral',      series: 3, reps: '30s c/l',  notas: 'Codo bajo el hombro',                           lastCompletedDate: null },
      ]},
      { nombre: 'Hombros + Core', diasSemana: [4], orden: 3, ejercicios: [
        { id: '4-1', nombre: 'Pike push-ups',           series: 4, reps: '10-12', notas: 'Cadera elevada en V invertida',             lastCompletedDate: null },
        { id: '4-2', nombre: 'Elevaciones laterales',   series: 4, reps: '15',    notas: 'Con bidones o botellas de agua',            lastCompletedDate: null },
        { id: '4-3', nombre: 'Elevaciones frontales',   series: 3, reps: '12',    notas: 'Alternar brazos',                          lastCompletedDate: null },
        { id: '4-4', nombre: 'Press militar con peso',  series: 3, reps: '12',    notas: 'Mochila, bidón o bolsa con peso',           lastCompletedDate: null },
        { id: '4-5', nombre: 'Face pull con toalla',    series: 3, reps: '15',    notas: 'Toalla enganchada en puerta',              lastCompletedDate: null },
        { id: '4-6', nombre: 'Crunch abdominal',        series: 4, reps: '20',    notas: 'Subir solo hasta omóplatos',               lastCompletedDate: null },
        { id: '4-7', nombre: 'Bicicleta abdominal',     series: 3, reps: '15 c/l', notas: 'Codo toca rodilla opuesta',              lastCompletedDate: null },
      ]},
      { nombre: 'Full Body + Intensidad', diasSemana: [5], orden: 4, ejercicios: [
        { id: '5-1', nombre: 'Burpees',                      series: 3, reps: '10',     notas: 'Explosivo, ritmo controlado',                   lastCompletedDate: null },
        { id: '5-2', nombre: 'Flexiones clásicas',           series: 3, reps: '15',     notas: 'Última serie al fallo',                         lastCompletedDate: null },
        { id: '5-3', nombre: 'Sentadillas con salto',        series: 3, reps: '12',     notas: 'Aterrizar suave con rodillas flexionadas',       lastCompletedDate: null },
        { id: '5-4', nombre: 'Remo con peso',                series: 3, reps: '12',     notas: 'Con mochila o bidones',                         lastCompletedDate: null },
        { id: '5-5', nombre: 'Zancadas con peso',            series: 3, reps: '10 c/p', notas: 'Mochila cargada',                               lastCompletedDate: null },
        { id: '5-6', nombre: 'Mountain climbers',            series: 3, reps: '30s',    notas: 'Ritmo rápido, core activado',                   lastCompletedDate: null },
        { id: '5-7', nombre: 'Plancha c/toque de hombros',   series: 3, reps: '12 c/l', notas: 'No rotar cadera',                              lastCompletedDate: null },
      ]},
    ];
    for (const r of SEED) {
      await addDoc(collection(db, 'usuarios', user.uid, 'rutinas'), r);
    }
  }

  // ── Biblioteca CRUD ───────────────────────────────────────────────────────────

  async function addLibro() {
    if (!user?.uid || !libroForm.titulo.trim()) return;
    const capitulos: FSCapitulo[] = Array.from({ length: libroForm.totalCapitulos }, (_, i) => ({
      id: `cap-${Date.now()}-${i}`, numero: i + 1, leido: false,
    }));
    try {
      await addDoc(collection(db, 'usuarios', user.uid, 'libros'), {
        titulo: libroForm.titulo.trim(), autor: libroForm.autor.trim() || null,
        estado: libroForm.estado, capitulos, xpPorCapitulo: libroForm.xpPorCapitulo,
      });
      setLibroForm({ titulo: '', autor: '', estado: 'pendiente', totalCapitulos: 10, xpPorCapitulo: 5 });
      setModal(null);
    } catch (e: unknown) {
      setModalError((e as Error).message ?? 'Error al guardar');
    }
  }

  async function deleteLibro(id: string) {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, 'usuarios', user.uid, 'libros', id));
      if (expandedLibro === id) setExpandedLibro(null);
    } catch {
      showToast('Error al eliminar el libro');
    }
  }

  async function updateLibroEstado(libroId: string, estado: EstadoLibro) {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'libros', libroId), { estado });
    } catch {
      showToast('Error al actualizar el estado');
    }
  }

  async function toggleCapitulo(libroId: string, capId: string) {
    if (!user?.uid) return;
    const libro = fsLibros.find(l => l.id === libroId);
    if (!libro) return;
    const cap = libro.capitulos.find(c => c.id === capId);
    if (!cap) return;
    const completing = !cap.leido;
    const capitulos = libro.capitulos.map(c => c.id !== capId ? c : { ...c, leido: completing });
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'usuarios', user.uid, 'libros', libroId), { capitulos });
      batch.set(doc(db, 'usuarios', user.uid, 'stats', 'main'),
        { inteligencia: { xp: increment(completing ? libro.xpPorCapitulo : -libro.xpPorCapitulo) } }, { merge: true });
      await batch.commit();
    } catch {
      showToast('Error al guardar el capítulo');
    }
  }

  async function saveCapituloNotas(libroId: string, capId: string, notas: string) {
    if (!user?.uid) return;
    const libro = fsLibros.find(l => l.id === libroId);
    if (!libro) return;
    const capitulos = libro.capitulos.map(c => c.id !== capId ? c : { ...c, notas });
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'libros', libroId), { capitulos });
    } catch {
      showToast('Error al guardar las notas');
    }
  }

  // ── Facultad CRUD ─────────────────────────────────────────────────────────────

  async function addMateria() {
    if (!user?.uid || !materiaForm.nombre.trim()) return;
    try {
      await addDoc(collection(db, 'usuarios', user.uid, 'materias'), {
        nombre: materiaForm.nombre.trim(), color: materiaForm.color,
        materiales: [], tareas: [], examenes: [],
      });
      setMateriaForm({ nombre: '', color: '#6366f1' });
      setModal(null);
    } catch (e: unknown) {
      setModalError((e as Error).message ?? 'Error al guardar');
    }
  }

  async function deleteMateria(id: string) {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, 'usuarios', user.uid, 'materias', id));
      if (selectedMateria === id) setSelectedMateria(null);
    } catch {
      showToast('Error al eliminar la materia');
    }
  }

  async function addMaterial() {
    if (!user?.uid || !targetMateriaId || !materialForm.titulo.trim()) return;
    const materia = fsMaterias.find(m => m.id === targetMateriaId);
    if (!materia) return;
    const newMat: FSMaterial = {
      id: Date.now().toString(), tipo: materialForm.tipo, titulo: materialForm.titulo.trim(),
      ...(materialForm.contenido.trim() ? { contenido: materialForm.contenido.trim() } : {}),
      ...(materialForm.url.trim() ? { url: materialForm.url.trim() } : {}),
    };
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'materias', targetMateriaId), { materiales: [...materia.materiales, newMat] });
      setMaterialForm({ tipo: 'nota', titulo: '', contenido: '', url: '' });
      setModal(null);
    } catch (e: unknown) {
      setModalError((e as Error).message ?? 'Error al guardar');
    }
  }

  async function deleteMaterial(materiaId: string, matId: string) {
    if (!user?.uid) return;
    const m = fsMaterias.find(x => x.id === materiaId);
    if (!m) return;
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'materias', materiaId), { materiales: m.materiales.filter(x => x.id !== matId) });
    } catch {
      showToast('Error al eliminar el material');
    }
  }

  async function addTareaFac() {
    if (!user?.uid || !targetMateriaId || !tareaFacForm.titulo.trim()) return;
    const materia = fsMaterias.find(m => m.id === targetMateriaId);
    if (!materia) return;
    const newT: FSTareaFac = {
      id: Date.now().toString(), titulo: tareaFacForm.titulo.trim(), completada: false,
      ...(tareaFacForm.fecha ? { fecha: tareaFacForm.fecha } : {}),
    };
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'materias', targetMateriaId), { tareas: [...materia.tareas, newT] });
      setTareaFacForm({ titulo: '', fecha: '' });
      setModal(null);
    } catch (e: unknown) {
      setModalError((e as Error).message ?? 'Error al guardar');
    }
  }

  async function toggleTareaFac(materiaId: string, tareaId: string) {
    if (!user?.uid) return;
    const m = fsMaterias.find(x => x.id === materiaId);
    if (!m) return;
    const t = m.tareas.find(x => x.id === tareaId);
    if (!t) return;
    const completing = !t.completada;
    const tareas = m.tareas.map(x => x.id !== tareaId ? x : { ...x, completada: completing });
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'usuarios', user.uid, 'materias', materiaId), { tareas });
      batch.set(doc(db, 'usuarios', user.uid, 'stats', 'main'),
        { inteligencia: { xp: increment(completing ? 15 : -15) } }, { merge: true });
      await batch.commit();
    } catch {
      showToast('Error al guardar la tarea');
    }
  }

  async function deleteTareaFac(materiaId: string, tareaId: string) {
    if (!user?.uid) return;
    const m = fsMaterias.find(x => x.id === materiaId);
    if (!m) return;
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'materias', materiaId), { tareas: m.tareas.filter(x => x.id !== tareaId) });
    } catch {
      showToast('Error al eliminar la tarea');
    }
  }

  async function addExamen() {
    if (!user?.uid || !targetMateriaId || !examenForm.titulo.trim()) return;
    const materia = fsMaterias.find(m => m.id === targetMateriaId);
    if (!materia) return;
    const nota    = examenForm.nota    ? parseFloat(examenForm.nota)    : undefined;
    const notaMax = examenForm.notaMax ? parseFloat(examenForm.notaMax) : 10;
    const newEx: FSExamen = {
      id: Date.now().toString(), titulo: examenForm.titulo.trim(), notaMax,
      ...(examenForm.fecha ? { fecha: examenForm.fecha } : {}),
      ...(nota !== undefined ? { nota } : {}),
    };
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'usuarios', user.uid, 'materias', targetMateriaId), { examenes: [...materia.examenes, newEx] });
      if (nota !== undefined) {
        const xp = Math.round((nota / notaMax) * 30);
        batch.set(doc(db, 'usuarios', user.uid, 'stats', 'main'),
          { inteligencia: { xp: increment(xp) } }, { merge: true });
      }
      await batch.commit();
      setExamenForm({ titulo: '', fecha: '', nota: '', notaMax: '10' });
      setModal(null);
    } catch (e: unknown) {
      setModalError((e as Error).message ?? 'Error al guardar');
    }
  }

  async function deleteExamen(materiaId: string, examenId: string) {
    if (!user?.uid) return;
    const m = fsMaterias.find(x => x.id === materiaId);
    if (!m) return;
    try {
      await updateDoc(doc(db, 'usuarios', user.uid, 'materias', materiaId), { examenes: m.examenes.filter(x => x.id !== examenId) });
    } catch {
      showToast('Error al eliminar el examen');
    }
  }

  async function connectGCal() {
    if (!user) return;
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
    try {
      const result = await reauthenticateWithPopup(user, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGcalToken(credential.accessToken);
        localStorage.setItem('gcal_token', credential.accessToken);
        localStorage.setItem('gcal_token_exp', (Date.now() + 3500 * 1000).toString());
      }
    } catch (err) {
      console.error('Error connecting Google Calendar:', err);
    }
  }

  function disconnectGCal() {
    setGcalToken(null);
    setGcalEvents([]);
    localStorage.removeItem('gcal_token');
    localStorage.removeItem('gcal_token_exp');
  }

  function gcalForDate(d: Date): GCalEvent[] {
    const dStr = d.toISOString().slice(0, 10);
    return gcalEvents.filter(ev => {
      const start = ev.start.dateTime ? ev.start.dateTime.slice(0, 10) : ev.start.date;
      return start === dStr;
    });
  }

  function gcalTime(ev: GCalEvent): string {
    return ev.start.dateTime ? format(new Date(ev.start.dateTime), 'HH:mm') : 'Todo el día';
  }

  function openEditTx(t: FSTransaccion) {
    setEditingTxId(t.id);
    setTxForm({ descripcion: t.descripcion, monto: t.monto.toString(), tipo: t.tipo, categoria: t.categoria, fecha: t.fecha, moneda: t.moneda ?? 'ARS' });
    setShowTxModal(true);
  }

  function closeTxModal() {
    setShowTxModal(false);
    setEditingTxId(null);
    setTxForm({ descripcion: '', monto: '', tipo: 'gasto', categoria: '', fecha: HOY, moneda: 'ARS' });
  }

  async function saveTransaccion() {
    if (!user?.uid || !txForm.descripcion.trim() || !txForm.monto) return;
    const data = {
      descripcion: txForm.descripcion.trim(),
      monto: parseFloat(txForm.monto),
      tipo: txForm.tipo,
      categoria: txForm.categoria || (txForm.tipo === 'ingreso' ? '💼 Trabajo' : '📦 Otro'),
      fecha: txForm.fecha,
      moneda: txForm.moneda,
    };
    try {
      if (editingTxId) {
        await updateDoc(doc(db, 'usuarios', user.uid, 'transacciones', editingTxId), data);
        showToast('Transacción actualizada', true);
      } else {
        await addDoc(collection(db, 'usuarios', user.uid, 'transacciones'), data);
        showToast('Transacción guardada', true);
      }
      closeTxModal();
    } catch {
      showToast('Error al guardar la transacción');
    }
  }

  async function deleteTransaccion(id: string) {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, 'usuarios', user.uid, 'transacciones', id));
    } catch {
      showToast('Error al eliminar la transacción');
    }
  }

  // ── Auth states ───────────────────────────────────────────────────────────

  if (authLoading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        <CheckCircle2 className="w-8 h-8 text-blue-600" />
      </motion.div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={() => signInWithPopup(auth, new GoogleAuthProvider())} />;

  if (!dataReady) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        <CheckCircle2 className="w-8 h-8 text-blue-600" />
      </motion.div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading hero data…</p>
    </div>
  );

  // ── Nav ───────────────────────────────────────────────────────────────────

  const NAV: { id: TabId; icon: ReactNode; label: string }[] = [
    { id: 'dashboard',  icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard'  },
    { id: 'calendar',   icon: <CalendarIcon     className="w-5 h-5" />, label: 'Calendar'   },
    { id: 'gym',        icon: <Dumbbell         className="w-5 h-5" />, label: 'Gym'        },
    { id: 'attributes', icon: <Sword            className="w-5 h-5" />, label: 'Attributes' },
    { id: 'habits',     icon: <Zap              className="w-5 h-5" />, label: 'Quests'     },
    { id: 'missions',   icon: <Target           className="w-5 h-5" />, label: 'Missions'   },
    { id: 'billetera',  icon: <Wallet           className="w-5 h-5" />, label: 'Treasury'   },
    { id: 'settings',   icon: <Settings         className="w-5 h-5" />, label: 'Settings'   },
  ];

  const PAGE_TITLE: Record<string, string> = {
    dashboard: 'BATTLE STATION', calendar: 'BATTLE LOG', gym: 'GYM',
    attributes: 'SKILL TREE', habits: 'DAILY QUESTS', missions: 'MISSION TREE',
    billetera: 'TREASURY', settings: 'SETTINGS',
  };
  const PAGE_SUB: Record<string, string> = {
    dashboard: `Welcome back, ${user.displayName?.split(' ')[0] ?? 'Hero'} 👋`,
    calendar: 'Schedule your battles', gym: 'Entrenamiento y alimentación',
    attributes: "Your hero's power", habits: 'Complete your daily quests',
    missions: 'Track your objectives', billetera: 'Controlá tus ingresos y gastos',
    settings: 'Configure your hero',
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className={cn(
              'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white pointer-events-none',
              toast.ok ? 'bg-emerald-600' : 'bg-red-600'
            )}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Nueva / Editar transacción ── */}
      <AnimatePresence>
        {showTxModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={closeTxModal}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  {editingTxId ? 'Editar transacción' : 'Nueva transacción'}
                </h3>
                <button onClick={closeTxModal} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                {(['gasto', 'ingreso'] as const).map(t => (
                  <button key={t} onClick={() => setTxForm(f => ({ ...f, tipo: t, categoria: '' }))}
                    className={cn('flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all',
                      txForm.tipo === t ? (t === 'ingreso' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm') : 'text-slate-500')}>
                    {t === 'gasto' ? '↓ Gasto' : '↑ Ingreso'}
                  </button>
                ))}
              </div>
              <input placeholder="Descripción" value={txForm.descripcion} onChange={e => setTxForm(f => ({ ...f, descripcion: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors" />
              <div className="flex gap-3">
                <input type="number" placeholder="Monto" value={txForm.monto} onChange={e => setTxForm(f => ({ ...f, monto: e.target.value }))}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors" />
                <select value={txForm.moneda} onChange={e => setTxForm(f => ({ ...f, moneda: e.target.value as Moneda }))}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors">
                  {Object.entries(MONEDA_META).map(([code, m]) => (
                    <option key={code} value={code}>{m.flag} {code}</option>
                  ))}
                </select>
              </div>
              <select value={txForm.categoria} onChange={e => setTxForm(f => ({ ...f, categoria: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors">
                <option value="">Categoría (opcional)</option>
                {(txForm.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={txForm.fecha} onChange={e => setTxForm(f => ({ ...f, fecha: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors" />
              <button onClick={saveTransaccion} disabled={!txForm.descripcion.trim() || !txForm.monto}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20">
                {editingTxId ? 'Actualizar' : 'Guardar'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Backdrop mobile ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={cn(
        'border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col fixed h-full z-30 transition-all duration-300 overflow-hidden',
        sidebarOpen
          ? 'translate-x-0 w-64'
          : '-translate-x-full md:translate-x-0 w-64 md:w-16'
      )}>
        {/* Logo + toggle */}
        <div className={cn('flex items-center border-b border-slate-100 dark:border-slate-800 shrink-0', sidebarOpen ? 'p-4 gap-3 justify-between' : 'p-3 justify-center')}>
          {sidebarOpen && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-black text-base leading-none tracking-tight">QUESTFLOW</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lv.{heroLevel} Hero</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title={sidebarOpen ? 'Colapsar' : 'Expandir'}
          >
            <ChevronRight className={cn('w-4 h-4 transition-transform duration-300 hidden md:block', sidebarOpen && 'rotate-180')} />
            <X className="w-4 h-4 md:hidden" />
          </button>
        </div>

        {/* Nav items */}
        <nav className={cn('flex-1 mt-2 space-y-1 overflow-y-auto', sidebarOpen ? 'px-3' : 'px-2')}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
              title={!sidebarOpen ? item.label : undefined}
              className={cn(
                'w-full flex items-center rounded-xl transition-all duration-200 group',
                sidebarOpen ? 'gap-3 px-4 py-3' : 'justify-center px-2 py-3',
                tab === item.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}>
              <span className={cn('shrink-0', tab === item.id ? 'text-white' : 'group-hover:text-blue-500 transition-colors')}>{item.icon}</span>
              {sidebarOpen && <span className="font-semibold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn('border-t border-slate-200 dark:border-slate-800 shrink-0', sidebarOpen ? 'p-4' : 'p-2')}>
          {sidebarOpen && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-4 relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Hero XP</p>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold">{xpInLevel} xp</span>
                  <span className="text-[10px] opacity-60">/ {heroXpForNext}</span>
                </div>
                <ProgressBar value={xpInLevel} max={heroXpForNext} color="bg-blue-600" className="h-1.5" />
              </div>
              <Sword className="absolute -right-4 -bottom-4 w-20 h-20 text-blue-500/10 group-hover:rotate-12 transition-transform duration-500" />
            </div>
          )}
          <div className={cn('flex items-center gap-3', !sidebarOpen && 'justify-center')}>
            {user.photoURL
              ? <img src={user.photoURL} className="h-9 w-9 shrink-0 rounded-full border-2 border-blue-200" />
              : <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">{initials}</div>
            }
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.displayName}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={cn('flex-1 p-4 md:p-8 transition-all duration-300', sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-16')}>
        <header className="flex justify-between items-center mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — solo mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden shrink-0 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xs md:text-sm truncate">{PAGE_SUB[tab]}</p>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter mt-0.5 truncate">{PAGE_TITLE[tab]}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search quests…" className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64" />
            </div>
            <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">

          {/* ══ DASHBOARD ══ */}
          {tab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">

              {/* Hero Banner */}
              <div className="relative bg-gradient-to-br from-slate-900 via-blue-950/70 to-slate-900 rounded-3xl p-6 border border-blue-900/40 overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_0%,rgba(59,130,246,0.2),transparent_60%)]" />
                <div className="relative z-10 flex flex-wrap items-center gap-6">
                  <div className="relative shrink-0">
                    {user.photoURL
                      ? <img src={user.photoURL} className="w-[72px] h-[72px] rounded-2xl border-2 border-blue-400/40 shadow-xl" />
                      : <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-blue-500 to-purple-700 flex items-center justify-center text-white font-black text-xl shadow-xl border-2 border-blue-400/30">{initials}</div>
                    }
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">LVL {heroLevel}</span>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-white tracking-tight">{user.displayName}</h3>
                      <span className={cn('text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border', CLASS_META[heroClass]?.color ?? 'text-blue-300', 'bg-white/10 border-white/20')}>
                        {CLASS_META[heroClass]?.icon} {heroClass}
                      </span>
                      <span className={cn('text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest bg-white/10 border border-white/20', RANK_META[heroRank]?.color ?? 'text-slate-300')}>
                        {RANK_META[heroRank]?.label ?? heroRank}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mb-1">{xpInLevel} / {heroXpForNext} XP — nivel {heroLevel}</p>
                    <p className={cn('text-xs font-bold mb-3', RANK_META[heroRank]?.color ?? 'text-slate-400')}>
                      Nivel Principal {mainLevelData.level} · {RANK_META[heroRank]?.label}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(xpInLevel / heroXpForNext) * 100}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">{Math.round((xpInLevel / heroXpForNext) * 100)}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full sm:w-auto shrink-0">
                    {FS_KEYS.map(k => {
                      const { level } = xpLevel(fsStats?.[k]?.xp ?? 0);
                      return (
                        <div key={k} className="flex items-center gap-1.5 bg-slate-800/70 border border-slate-700/50 rounded-xl px-2.5 py-2">
                          <span className="text-xs">{STAT_META[k].icon}</span>
                          <span className="text-[10px] font-black text-slate-300">{STAT_META[k].shortName}</span>
                          <span className="text-[10px] text-slate-500 ml-auto">Lv{level}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stats + Radar */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-black tracking-tight uppercase">Hero Attributes</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.map(s => <StatCard key={s.name} stat={s} />)}
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Performance Radar</h4>
                  <div className="w-full h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Stats" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              {/* Agenda + Side panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black flex items-center gap-3"><CalendarIcon className="w-6 h-6 text-blue-600" /> DAILY AGENDA</h3>
                      <button onClick={() => { setEventoForm(p => ({ ...p, fecha: HOY })); setModal('evento'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-blue-500/20">
                        <Plus className="w-4 h-4" /> Nuevo Evento
                      </button>
                    </div>
                    {(() => {
                      const todayGCal = gcalForDate(new Date());
                      const allToday  = [...todayEventos, ...todayGCal.map(g => ({ _gcal: true as const, id: g.id, titulo: g.summary ?? '(sin título)', hora: gcalTime(g) }))];
                      return allToday.length === 0
                        ? <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                            <CalendarDays className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-400">Sin eventos para hoy</p>
                            <button onClick={() => { setEventoForm(p => ({ ...p, fecha: HOY })); setModal('evento'); }}
                              className="mt-2 text-xs text-blue-500 font-bold hover:underline">+ Agregar evento</button>
                          </div>
                        : <div className="space-y-4 relative">
                            <div className="absolute left-[87px] top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
                            {allToday.map(ev => {
                              const isGCal = '_gcal' in ev;
                              return (
                                <div key={ev.id} className="grid grid-cols-[80px_1fr] gap-8">
                                  <div className="text-right py-2"><span className="text-xs font-black text-slate-400">{ev.hora || '—'}</span></div>
                                  <div className="relative pl-4">
                                    <div className={cn('absolute -left-[41px] top-3 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 z-10', isGCal ? 'bg-emerald-500' : 'bg-blue-600')} />
                                    <div className="group/ev relative p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                      <h4 className="font-bold text-sm">{ev.titulo}</h4>
                                      <p className={cn('text-[10px] mt-1 font-bold uppercase tracking-widest', isGCal ? 'text-emerald-500' : 'text-blue-500')}>
                                        {isGCal ? '📅 Google Calendar' : 'evento'}
                                      </p>
                                      {!isGCal && (
                                        <button onClick={() => deleteEvento(ev.id)}
                                          className="opacity-0 group-hover/ev:opacity-100 absolute top-2 right-2 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-all">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>;
                    })()}
                  </section>
                </div>

                <div className="space-y-6">
                  {/* Quests */}
                  <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-sm flex items-center gap-2"><Zap className="w-5 h-5 text-blue-600" /> DAILY QUESTS</h3>
                      <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded-full">{Math.round((done / Math.max(habitsToday.length, 1)) * 100)}% DONE</span>
                    </div>
                    {habitsToday.length === 0
                      ? <p className="text-[11px] text-slate-400 text-center py-4">Sin quests para hoy.</p>
                      : <div className="space-y-2">
                          {habitsToday.slice(0, 6).map(h => (
                            <div key={h.id} onClick={() => toggleHabit(h.id)} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', h.completed ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>{h.icon}</div>
                              <p className={cn('font-bold text-xs flex-1', h.completed && 'line-through text-slate-400')}>{h.name}</p>
                              <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0', h.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700')}>
                                {h.completed && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                            </div>
                          ))}
                        </div>
                    }
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <ProgressBar value={done} max={Math.max(habitsToday.length, 1)} color="bg-blue-600" />
                      <p className="text-[10px] text-slate-400 mt-1.5">{done}/{habitsToday.length} · +{done * 20} XP</p>
                    </div>
                  </section>

                  {/* Mission overview */}
                  <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-sm flex items-center gap-2"><Target className="w-5 h-5 text-blue-600" /> MISSIONS</h3>
                      <button onClick={() => setTab('missions')} className="text-[10px] text-blue-500 font-black hover:underline">Ver árbol →</button>
                    </div>
                    {missions.children && missions.children.length > 0
                      ? <div className="space-y-3">
                          {missions.children.slice(0, 3).map(m => (
                            <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 truncate pr-2">{m.title}</p>
                                <span className="text-[9px] font-black text-blue-500 shrink-0">{m.progress}%</span>
                              </div>
                              <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.progress}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      : fsMisiones.length === 0
                        ? <p className="text-[11px] text-slate-400 text-center py-4">Sin misiones activas.</p>
                        : <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden">
                            <Sword className="absolute -right-3 -bottom-3 w-16 h-16 text-white/10" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-200 mb-1">EPIC QUEST</p>
                            <h4 className="font-black text-sm mb-2">{missions.title}</h4>
                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div className="h-full bg-white rounded-full" style={{ width: `${missions.progress}%` }} />
                            </div>
                            <p className="text-[10px] text-blue-200 mt-1">{missions.progress}%</p>
                          </div>
                    }
                  </section>

                  {/* XP History — últimos 14 días */}
                  <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">XP Semanal</h4>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={xpPerDay}>
                          <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#94a3b8' }} tickFormatter={d => d.slice(5)} />
                          <YAxis hide />
                          <Line type="monotone" dataKey="xp" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* Logros */}
                  <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Logros</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'primera_quest', icon: '⚔️', label: 'Primera Quest' },
                        { id: 'racha_7',       icon: '🔥', label: 'Racha 7 días'  },
                        { id: 'racha_30',      icon: '🔥', label: 'Racha 30 días' },
                        { id: 'nivel_5',       icon: '⭐', label: 'Nivel 5'       },
                        { id: 'nivel_10',      icon: '🌟', label: 'Nivel 10'      },
                        { id: 'primer_libro',  icon: '📚', label: 'Primer libro'  },
                        { id: 'primer_examen', icon: '🎓', label: 'Primer examen' },
                        { id: 'todos_hoy',     icon: '✅', label: 'Todas hoy'     },
                      ].map(l => {
                        const done = logrosUnlocked.includes(l.id);
                        return (
                          <div key={l.id} title={l.label}
                            className={cn('flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all',
                              done ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50' : 'border-slate-100 dark:border-slate-800 opacity-40 grayscale')}>
                            <span className="text-xl">{l.icon}</span>
                            <span className="text-[9px] font-bold text-slate-500 leading-tight">{l.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ CALENDAR ══ */}
          {tab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black flex items-center gap-3"><CalendarIcon className="w-6 h-6 text-blue-600" /> BATTLE LOG</h3>
                  <div className="flex gap-2 items-center">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setSelDate(addDays(selDate, -7))}><ChevronRight className="w-4 h-4 rotate-180" /></button>
                    <span className="text-sm font-bold px-4">{format(selDate, 'MMMM yyyy')}</span>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={() => setSelDate(addDays(selDate, 7))}><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-3 mb-8">
                  {eachDayOfInterval({ start: startOfWeek(selDate), end: addDays(startOfWeek(selDate), 6) }).map(day => (
                    <button key={day.toString()} onClick={() => setSelDate(day)}
                      className={cn('flex flex-col items-center p-4 rounded-2xl border transition-all',
                        isSameDay(day, selDate) ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-blue-200'
                      )}>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{format(day, 'EEE')}</span>
                      <span className="text-lg font-black">{format(day, 'd')}</span>
                      {isToday(day) && <div className={cn('w-1 h-1 rounded-full mt-1', isSameDay(day, selDate) ? 'bg-white' : 'bg-blue-600')} />}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Quests para {format(selDate, 'EEEE, MMMM do')}</h4>
                    <button onClick={() => { setTaskForm(p => ({ ...p, date: selDate.toISOString().slice(0, 10) })); setModal('task'); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                      <Plus className="w-4 h-4" /> Nueva tarea
                    </button>
                  </div>
                  {(() => {
                    const tasks   = filterTasks(selDate);
                    const gcalDay = gcalForDate(selDate);
                    return tasks.length === 0 && gcalDay.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                        <CalendarDays className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                        <p className="text-sm font-bold text-slate-400">Sin quests para este día.</p>
                        <button onClick={() => { setTaskForm(p => ({ ...p, date: selDate.toISOString().slice(0, 10) })); setModal('task'); }}
                          className="mt-2 text-xs text-blue-500 font-bold hover:underline">+ Agregar tarea</button>
                      </div>
                    ) : (
                      <>
                        {tasks.map(task => (
                          <div key={task.id}
                            className="group flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 cursor-pointer"
                            onClick={() => toggleTask(task.id, selDate)}>
                            <div className="flex items-center gap-4">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
                              <span className="text-xs font-black text-slate-400 w-16">{task.time}</span>
                              <div>
                                <h4 className={cn('font-bold text-sm', task.completed && 'line-through text-slate-400')}>{task.title}</h4>
                                {task.recurrence !== 'once' && (
                                  <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold uppercase mt-0.5"><Repeat className="w-3 h-3" />{task.recurrence}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className={cn('w-8 h-8 rounded-xl border-2 flex items-center justify-center', task.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700')}>
                                {task.completed && <CheckCircle2 className="w-5 h-5" />}
                              </div>
                            </div>
                          </div>
                        ))}
                        {gcalDay.map(ev => (
                          <div key={ev.id} className="flex items-center justify-between p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                            <div className="flex items-center gap-4">
                              <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-xs font-black text-slate-400 w-16">{gcalTime(ev)}</span>
                              <div>
                                <h4 className="font-bold text-sm">{ev.summary ?? '(sin título)'}</h4>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">📅 Google Calendar</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </section>
            </motion.div>
          )}

          {/* ══ GYM ══ */}
          {tab === 'gym' && (
            <motion.div key="gym" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">

              {/* Inner tabs */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                {([['entreno', 'Entrenamiento', <Dumbbell className="w-4 h-4" />], ['comida', 'Alimentación', <Utensils className="w-4 h-4" />]] as const).map(([id, label, icon]) => (
                  <button key={id} onClick={() => setGymInnerTab(id as 'entreno' | 'comida')}
                    className={cn('flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
                      gymInnerTab === id ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700')}>
                    {icon}{label}
                  </button>
                ))}
              </div>

              {gymInnerTab === 'entreno' && (() => {
                const todayNum    = getDay(new Date());
                const todayRuts   = fsRutinas.filter(r => r.diasSemana?.includes(todayNum));
                const otherRuts   = fsRutinas.filter(r => !r.diasSemana?.includes(todayNum));
                return (
                  <div className="space-y-8">

                    {/* Hoy */}
                    <section>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-lg shadow-red-500/20"><Dumbbell className="w-5 h-5" /></div>
                        <div>
                          <h3 className="text-xl font-black tracking-tight uppercase">HOY — {DIAS_CORTO[todayNum]}</h3>
                          <p className="text-xs text-slate-500">{todayRuts.length === 0 ? 'Sin rutina asignada' : todayRuts.map(r => r.nombre).join(' · ')}</p>
                        </div>
                      </div>
                      {todayRuts.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                          <Flame className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                          <p className="font-bold text-slate-400">Día de descanso 🏖️</p>
                          <p className="text-xs text-slate-400 mt-1">No hay rutina para {DIAS_CORTO[todayNum]}</p>
                        </div>
                      ) : todayRuts.map(rutina => (
                        <div key={rutina.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-4">
                          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <h4 className="font-black text-base">{rutina.nombre}</h4>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                                {rutina.diasSemana?.map(d => DIAS_CORTO[d]).join(' · ')}
                              </p>
                            </div>
                            <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded-full">
                              {rutina.ejercicios?.filter(e => e.lastCompletedDate === HOY).length ?? 0}/{rutina.ejercicios?.length ?? 0}
                            </span>
                          </div>
                          <div className="p-4 space-y-3">
                            {rutina.ejercicios?.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-4">Sin ejercicios. Agregá uno abajo.</p>
                            ) : rutina.ejercicios?.map(ej => (
                              <EjercicioRow key={ej.id} ejercicio={ej}
                                onToggle={() => toggleEjercicio(rutina.id, ej.id)}
                                onDelete={() => deleteEjercicio(rutina.id, ej.id)}
                                onEdit={() => {
                                  setTargetRutinaId(rutina.id);
                                  setTargetEjercicioId(ej.id);
                                  setEjercicioForm({ nombre: ej.nombre, series: ej.series ?? 3, reps: ej.reps ?? '', notas: ej.notas ?? '', mediaUrl: ej.mediaUrl ?? '' });
                                  setModal('ejercicio');
                                }} />
                            ))}
                            <button onClick={() => { setTargetRutinaId(rutina.id); setModal('ejercicio'); }}
                              className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                              <Plus className="w-4 h-4" /> Agregar ejercicio
                            </button>
                          </div>
                        </div>
                      ))}
                    </section>

                    {/* Todas las rutinas */}
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black uppercase tracking-tight">Mis Rutinas</h3>
                        <button onClick={() => setModal('rutina')}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-md shadow-blue-500/20">
                          <Plus className="w-4 h-4" /> Nueva Rutina
                        </button>
                      </div>
                      {fsRutinas.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                          <Dumbbell className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                          <p className="font-bold text-slate-400">Sin rutinas aún.</p>
                          <div className="flex flex-col items-center gap-2 mt-3">
                            <button onClick={() => setModal('rutina')} className="text-xs text-blue-500 font-bold hover:underline">+ Crear rutina manual</button>
                            <button onClick={seedRutinaHipertrofia}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-md shadow-red-500/20">
                              <Dumbbell className="w-3.5 h-3.5" /> Importar Rutina Hipertrofia (Lun–Vie)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {[...todayRuts, ...otherRuts].map(rutina => (
                            <div key={rutina.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                              <div className="flex items-center justify-between px-5 py-4">
                                <div>
                                  <h4 className="font-bold text-sm">{rutina.nombre}</h4>
                                  <div className="flex gap-1 mt-1">
                                    {DIAS_LETRA.map((d, i) => (
                                      <span key={i} className={cn('w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center',
                                        rutina.diasSemana?.includes(i) ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                                        {d}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-slate-400">{rutina.ejercicios?.length ?? 0} ejercicios</span>
                                  <button onClick={() => { setTargetRutinaId(rutina.id); setModal('ejercicio'); }}
                                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-all">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => deleteRutina(rutina.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                );
              })()}

              {gymInnerTab === 'comida' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
                      <Utensils className="w-6 h-6 text-orange-500" /> ALIMENTACIÓN
                    </h3>
                    <button onClick={() => { setHabitForm({ nombre: '', stat: 'fuerza', recurrence: 'daily', diasSemana: [] }); setModal('habit'); }}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-md shadow-orange-500/20">
                      <Plus className="w-4 h-4" /> Nuevo hábito
                    </button>
                  </div>
                  {habits.filter(h => h.stat === 'fuerza').length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                      <Utensils className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                      <p className="font-bold text-slate-400">Sin hábitos STR aún.</p>
                      <button onClick={() => { setHabitForm({ nombre: '', stat: 'fuerza', recurrence: 'daily', diasSemana: [] }); setModal('habit'); }}
                        className="mt-2 text-xs text-blue-500 font-bold hover:underline">+ Agregar hábito</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {habits.filter(h => h.stat === 'fuerza').map(h => (
                        <motion.div key={h.id} layout
                          className={cn('group relative flex items-center gap-5 p-6 rounded-2xl border-2 cursor-pointer transition-all',
                            h.completed ? 'border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-900/10'
                                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-orange-200')}
                          onClick={() => toggleHabit(h.id)}>
                          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                            h.completed ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                            <div className="scale-150">{h.icon}</div>
                          </div>
                          <div className="flex-1">
                            <p className={cn('font-black text-base', h.completed && 'line-through text-slate-400')}>{h.name}</p>
                            <p className="text-[10px] font-bold text-orange-500 mt-1 uppercase tracking-widest">STR · {h.attribute}</p>
                          </div>
                          <div className={cn('w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0',
                            h.completed ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-200 dark:border-slate-700')}>
                            {h.completed && <CheckCircle2 className="w-5 h-5" />}
                          </div>
                          <button onClick={e => { e.stopPropagation(); deleteHabit(h.id); }}
                            className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ══ ATTRIBUTES ══ */}
          {tab === 'attributes' && (() => {
            const meta   = STAT_META[attrStat];
            const stat   = stats.find(s => s.shortName === meta.shortName)!;
            const linked = habits.filter(h => h.stat === attrStat);
            return (
              <motion.div key="attributes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                {/* ── Stat tabs ── */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {FS_KEYS.map(k => {
                    const m = STAT_META[k];
                    const active = k === attrStat;
                    return (
                      <button key={k} onClick={() => setAttrStat(k)}
                        className={cn('flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all shrink-0',
                          active ? `${m.color} border-transparent text-white shadow-lg` : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:border-slate-300')}>
                        <span className="w-5 h-5">{m.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">{m.shortName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* ── Stat header ── */}
                {(() => {
                  const totalXp = fsStats?.[attrStat]?.xp ?? 0;
                  const xpNextLevel = stat ? (stat.level * 100) : 100;
                  return (
                    <div className={cn('rounded-3xl p-6 text-white', meta.color)}>
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                          <span className="scale-150">{meta.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-black uppercase tracking-tight">{meta.name}</h2>
                          <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Nivel {stat?.level ?? 1}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-3xl font-black leading-none">{totalXp}</p>
                          <p className="text-white/60 text-[10px] font-bold mt-0.5">XP total</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-white/60 text-[10px] font-bold">{stat?.value ?? 0}/100</span>
                        <div className="flex-1 h-2.5 bg-white/20 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${stat?.value ?? 0}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full bg-white rounded-full" />
                        </div>
                        <span className="text-white/60 text-[10px] font-bold">Lv.{(stat?.level ?? 1) + 1}</span>
                      </div>
                      <p className="text-white/60 text-xs">{xpNextLevel - totalXp} XP para siguiente nivel · {meta.description}</p>
                      <div className="flex gap-3 mt-4">
                        <div className="flex-1 bg-white/10 rounded-2xl p-3 text-center">
                          <p className="text-white font-black text-lg leading-none">{linked.length}</p>
                          <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest mt-0.5">Quests</p>
                        </div>
                        {attrStat === 'fuerza' && (
                          <div className="flex-1 bg-white/10 rounded-2xl p-3 text-center">
                            <p className="text-white font-black text-lg leading-none">
                              {fsRutinas.reduce((s, r) => s + (r.ejercicios?.length ?? 0), 0)}
                            </p>
                            <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest mt-0.5">Ejercicios</p>
                          </div>
                        )}
                        <div className="flex-1 bg-white/10 rounded-2xl p-3 text-center">
                          <p className="text-white font-black text-lg leading-none">{stat?.level ?? 1}</p>
                          <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest mt-0.5">Nivel</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Fuerza: acceso al Gym ── */}
                {attrStat === 'fuerza' && (
                  <button onClick={() => setTab('gym')}
                    className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-200 dark:border-red-900/40 hover:border-red-400 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-red-600 text-white"><Dumbbell className="w-5 h-5" /></div>
                      <div className="text-left">
                        <p className="font-black text-sm">Rutina de Gym</p>
                        <p className="text-[10px] text-slate-400">Ver entrenamiento y completar ejercicios · +5 XP c/u</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                  </button>
                )}

                {/* ── Fuentes de XP ── */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fuentes de XP</p>
                    <button onClick={() => { setHabitForm({ nombre: '', stat: attrStat, recurrence: 'daily', diasSemana: [] }); setModal('habit'); }}
                      className="text-[10px] font-bold text-blue-500 hover:underline">+ Nueva quest</button>
                  </div>

                  {linked.length === 0 && attrStat !== 'fuerza' && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                      <p className="text-sm text-slate-400">Sin fuentes de XP para {meta.name}.</p>
                      <button onClick={() => { setHabitForm({ nombre: '', stat: attrStat, recurrence: 'daily', diasSemana: [] }); setModal('habit'); }}
                        className="mt-2 text-xs text-blue-500 font-bold hover:underline">+ Agregar quest</button>
                    </div>
                  )}

                  {linked.map(h => {
                    const xpVal = h.xpValue;
                    const isEditing = editingHabitXp === h.id;
                    return (
                      <div key={h.id} className={cn('group flex items-center gap-3 p-4 rounded-2xl border-2 bg-white dark:bg-slate-900 transition-all',
                        h.completed ? 'border-blue-200 dark:border-blue-900/40' : 'border-slate-100 dark:border-slate-800')}>
                        {/* toggle */}
                        <div onClick={() => toggleHabit(h.id)}
                          className={cn('w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all',
                            h.completed ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300')}>
                          {h.completed && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        {/* nombre */}
                        <p onClick={() => toggleHabit(h.id)}
                          className={cn('flex-1 text-sm font-bold cursor-pointer', h.completed && 'line-through text-slate-400')}>
                          {h.name}
                        </p>
                        {/* XP badge editable */}
                        {isEditing ? (
                          <input
                            type="number" min={1} max={999} defaultValue={xpVal} autoFocus
                            className="w-16 text-center text-xs font-black border-2 border-blue-400 rounded-lg px-1 py-1 focus:outline-none bg-white dark:bg-slate-800"
                            onBlur={e => { updateHabitXp(h.id, parseInt(e.target.value) || xpVal); setEditingHabitXp(null); }}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingHabitXp(null); }}
                          />
                        ) : (
                          <button onClick={() => setEditingHabitXp(h.id)}
                            className={cn('flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black border-2 transition-all hover:scale-105',
                              h.completed ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600'
                                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500')}>
                            +{xpVal} XP
                          </button>
                        )}
                        {/* delete */}
                        <button onClick={() => deleteHabit(h.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Gym exercises como fuente fija para fuerza */}
                  {attrStat === 'fuerza' && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Ejercicios de gym</p>
                        <p className="text-[10px] text-slate-400">Cada ejercicio completado en la rutina</p>
                      </div>
                      <span className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-500">
                        +5 XP
                      </span>
                    </div>
                  )}
                </section>

                {/* ══ INTELIGENCIA: Biblioteca + Facultad ══ */}
                {attrStat === 'inteligencia' && (
                  <div className="space-y-4">
                    {/* Inner tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                      {(['biblioteca', 'facultad'] as const).map(t => (
                        <button key={t} onClick={() => setIntTab(t)}
                          className={cn('flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                            intTab === t ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700')}>
                          {t === 'biblioteca' ? '📚 Biblioteca' : '🎓 Facultad'}
                        </button>
                      ))}
                    </div>

                    {/* ── BIBLIOTECA ── */}
                    {intTab === 'biblioteca' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mis libros</p>
                          <button onClick={() => setModal('libro')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:opacity-90">
                            <Plus className="w-3.5 h-3.5" /> Agregar libro
                          </button>
                        </div>

                        {fsLibros.length === 0 ? (
                          <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                            <p className="text-2xl mb-2">📚</p>
                            <p className="text-sm text-slate-400">Sin libros aún.</p>
                            <button onClick={() => setModal('libro')} className="mt-2 text-xs text-blue-500 font-bold hover:underline">+ Agregar el primero</button>
                          </div>
                        ) : fsLibros.map(libro => {
                          const leidos   = libro.capitulos?.filter(c => c.leido).length ?? 0;
                          const total    = libro.capitulos?.length ?? 0;
                          const pct      = total > 0 ? Math.round((leidos / total) * 100) : 0;
                          const expanded = expandedLibro === libro.id;
                          const em       = ESTADO_LIBRO_META[libro.estado ?? 'pendiente'];
                          return (
                            <div key={libro.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                              <div className="flex items-start gap-3 p-4">
                                <button onClick={() => setExpandedLibro(expanded ? null : libro.id)}
                                  className="flex-1 text-left space-y-2 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-black text-sm truncate">{libro.titulo}</p>
                                      {libro.autor && <p className="text-[10px] text-slate-400">{libro.autor}</p>}
                                    </div>
                                    <span className={cn('shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full', em.color)}>{em.label}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 shrink-0">{leidos}/{total} caps · +{libro.xpPorCapitulo} XP c/u</span>
                                  </div>
                                </button>
                                <div className="flex flex-col gap-1 shrink-0">
                                  <select value={libro.estado ?? 'pendiente'} onChange={e => updateLibroEstado(libro.id, e.target.value as EstadoLibro)}
                                    onClick={e => e.stopPropagation()}
                                    className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                                    <option value="pendiente">Pendiente</option>
                                    <option value="leyendo">Leyendo</option>
                                    <option value="leido">Leído</option>
                                  </select>
                                  <button onClick={() => deleteLibro(libro.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all self-end">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {expanded && (
                                <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Capítulos</p>
                                  {libro.capitulos?.map(cap => (
                                    <CapituloRow key={cap.id} cap={cap}
                                      onToggle={() => toggleCapitulo(libro.id, cap.id)}
                                      onSave={notas => saveCapituloNotas(libro.id, cap.id, notas)} />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── FACULTAD ── */}
                    {intTab === 'facultad' && (
                      <div className="space-y-3">
                        {!selectedMateria ? (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Materias</p>
                              <button onClick={() => setModal('materia')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:opacity-90">
                                <Plus className="w-3.5 h-3.5" /> Nueva materia
                              </button>
                            </div>
                            {fsMaterias.length === 0 ? (
                              <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                <p className="text-2xl mb-2">🎓</p>
                                <p className="text-sm text-slate-400">Sin materias aún.</p>
                                <button onClick={() => setModal('materia')} className="mt-2 text-xs text-blue-500 font-bold hover:underline">+ Agregar materia</button>
                              </div>
                            ) : fsMaterias.map(m => {
                              const tareasHechas = m.tareas?.filter(t => t.completada).length ?? 0;
                              const notaPromedio = m.examenes?.length
                                ? (m.examenes.filter(e => e.nota !== undefined).reduce((s, e) => s + (e.nota! / e.notaMax) * 10, 0) / m.examenes.filter(e => e.nota !== undefined).length).toFixed(1)
                                : null;
                              return (
                                <div key={m.id} className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 cursor-pointer transition-all"
                                  onClick={() => setSelectedMateria(m.id)}>
                                  <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: m.color }}>
                                    {m.nombre.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{m.nombre}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {m.materiales?.length ?? 0} materiales · {tareasHechas}/{m.tareas?.length ?? 0} tareas
                                      {notaPromedio && ` · Prom. ${notaPromedio}`}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    <button onClick={e => { e.stopPropagation(); deleteMateria(m.id); }}
                                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        ) : (() => {
                          const mat = fsMaterias.find(m => m.id === selectedMateria);
                          if (!mat) return null;
                          return (
                            <div className="space-y-3">
                              {/* Header materia */}
                              <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedMateria(null)}
                                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                  <ChevronRight className="w-5 h-5 rotate-180 text-slate-500" />
                                </button>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black" style={{ backgroundColor: mat.color }}>
                                  {mat.nombre.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="font-black text-base flex-1">{mat.nombre}</h3>
                                <button onClick={() => { setTargetMateriaId(mat.id); setModal(matSubTab === 'materiales' ? 'material' : matSubTab === 'tareas' ? 'tareaFac' : 'examen'); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:opacity-90">
                                  <Plus className="w-3.5 h-3.5" />
                                  {matSubTab === 'materiales' ? 'Material' : matSubTab === 'tareas' ? 'Tarea' : 'Examen'}
                                </button>
                              </div>
                              {/* Sub-tabs */}
                              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                {(['materiales', 'tareas', 'examenes'] as const).map(t => (
                                  <button key={t} onClick={() => setMatSubTab(t)}
                                    className={cn('flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                                      matSubTab === t ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-500')}>
                                    {t === 'materiales' ? 'Materiales' : t === 'tareas' ? 'Tareas' : 'Exámenes'}
                                  </button>
                                ))}
                              </div>

                              {/* Materiales */}
                              {matSubTab === 'materiales' && (
                                <div className="space-y-2">
                                  {(mat.materiales ?? []).length === 0
                                    ? <p className="text-center text-sm text-slate-400 py-6">Sin materiales. Agregá notas, videos o enlaces.</p>
                                    : (mat.materiales ?? []).map(mat2 => (
                                      <div key={mat2.id} className="group flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">{MATERIAL_ICON[mat2.tipo]}</div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-sm">{mat2.titulo}</p>
                                          {mat2.contenido && <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{mat2.contenido}</p>}
                                          {mat2.url && (
                                            <a href={mat2.url} target="_blank" rel="noopener noreferrer"
                                              className="text-xs text-blue-500 hover:underline mt-1 block truncate">{mat2.url}</a>
                                          )}
                                        </div>
                                        <button onClick={() => deleteMaterial(mat.id, mat2.id)}
                                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all shrink-0">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))
                                  }
                                </div>
                              )}

                              {/* Tareas */}
                              {matSubTab === 'tareas' && (
                                <div className="space-y-2">
                                  {(mat.tareas ?? []).length === 0
                                    ? <p className="text-center text-sm text-slate-400 py-6">Sin tareas. Agregá entregas o trabajos.</p>
                                    : (mat.tareas ?? []).map(t => (
                                      <div key={t.id} className={cn('group flex items-center gap-3 p-4 rounded-2xl border-2 transition-all',
                                        t.completada ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-900/10'
                                                     : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900')}>
                                        <div onClick={() => toggleTareaFac(mat.id, t.id)}
                                          className={cn('w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all',
                                            t.completada ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400')}>
                                          {t.completada && <CheckCircle2 className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={cn('font-bold text-sm', t.completada && 'line-through text-slate-400')}>{t.titulo}</p>
                                          {t.fecha && <p className="text-[10px] text-slate-400">Entrega: {t.fecha}</p>}
                                        </div>
                                        <button onClick={() => deleteTareaFac(mat.id, t.id)}
                                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all shrink-0">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))
                                  }
                                </div>
                              )}

                              {/* Exámenes */}
                              {matSubTab === 'examenes' && (
                                <div className="space-y-2">
                                  {(mat.examenes ?? []).length === 0
                                    ? <p className="text-center text-sm text-slate-400 py-6">Sin exámenes. Registrá notas y fechas.</p>
                                    : (mat.examenes ?? []).map(ex => {
                                      const pct = ex.nota !== undefined ? ex.nota / ex.notaMax : null;
                                      const color = pct === null ? 'text-slate-400' : pct >= 0.7 ? 'text-emerald-600' : pct >= 0.5 ? 'text-yellow-600' : 'text-red-500';
                                      return (
                                        <div key={ex.id} className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                          <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm">{ex.titulo}</p>
                                            {ex.fecha && <p className="text-[10px] text-slate-400">{ex.fecha}</p>}
                                          </div>
                                          {ex.nota !== undefined
                                            ? <span className={cn('font-black text-lg', color)}>{ex.nota}<span className="text-xs text-slate-400 font-bold">/{ex.notaMax}</span></span>
                                            : <span className="text-xs text-slate-400 italic">Sin nota</span>
                                          }
                                          <button onClick={() => deleteExamen(mat.id, ex.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all shrink-0">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      );
                                    })
                                  }
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            );
          })()}

          {/* ══ QUESTS ══ */}
          {tab === 'habits' && (
            <motion.div key="habits" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3"><Zap className="w-7 h-7 text-blue-600" /> DAILY QUESTS</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-slate-500">{done}/{habits.length} completadas</span>
                  <button onClick={() => setModal('habit')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-blue-500/20">
                    <Plus className="w-4 h-4" /> Nueva Quest
                  </button>
                </div>
              </div>
              {habits.length === 0
                ? <div className="py-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                    <Zap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="font-bold text-slate-400">Sin quests aún.</p>
                    <button onClick={() => setModal('habit')} className="mt-3 text-sm text-blue-500 font-bold hover:underline">+ Agregar primera quest</button>
                  </div>
                : <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {habits.map(h => (
                        <motion.div key={h.id} layout
                          className={cn('group relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all',
                            !h.activeToday
                              ? 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-50 cursor-not-allowed'
                              : h.completed
                                ? 'border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/10 cursor-pointer'
                                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200 cursor-pointer')}
                          onClick={() => h.activeToday && toggleHabit(h.id)}>
                          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', h.completed ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                            <div className="scale-150">{h.icon}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={cn('font-black text-sm', h.completed && 'line-through text-slate-400')}>{h.name}</p>
                              {(() => {
                                const fh = fsHabitos.find(x => x.id === h.id);
                                const streak = fh ? calcStreak(fh.completedDates ?? [], fh.recurrence ?? 'daily') : 0;
                                return streak > 0 ? (
                                  <span className="flex items-center gap-0.5 text-[10px] font-black text-orange-400">
                                    <Flame className="w-3 h-3" /> {streak}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{h.attribute}</span>
                              <span className="text-[10px] text-slate-400">·</span>
                              <span className="text-[10px] text-slate-400 font-medium">{habitRecurrenceLabel(h.recurrence, h.diasSemana, DIAS_CORTO)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={e => { e.stopPropagation(); openEditHabit(h.id); }}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); deleteHabit(h.id); }}
                              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className={cn('w-8 h-8 rounded-xl border-2 flex items-center justify-center', h.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700')}>
                              {h.completed && <CheckCircle2 className="w-5 h-5" />}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Progreso de hoy</h4>
                      <ProgressBar value={done} max={Math.max(habitsToday.length, 1)} color="bg-blue-600" className="h-3" />
                      <p className="text-sm font-bold text-slate-500 mt-3">{done} de {habitsToday.length} completadas hoy · +{done * 20} XP</p>
                    </div>
                  </>
              }
            </motion.div>
          )}

          {/* ══ MISSIONS ══ */}
          {tab === 'missions' && (
            <motion.div key="missions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3"><Target className="w-7 h-7 text-blue-600" /> MISSION TREE</h3>
                <p className="text-sm text-slate-400">Hacé click en un nodo para togglear · + para agregar sub-misión</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <div className="flex justify-center min-w-max pb-8">
                  <MissionNodeComp node={missions} onAdd={addMission} onToggle={toggleMission} />
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ TREASURY ══ */}
          {tab === 'billetera' && (
            <motion.div key="billetera" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3"><Wallet className="w-7 h-7 text-emerald-600" /> TREASURY</h3>
                <button onClick={() => { setEditingTxId(null); setTxForm({ descripcion: '', monto: '', tipo: 'gasto', categoria: '', fecha: HOY, moneda: 'ARS' }); setShowTxModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">
                  <Plus className="w-4 h-4" /> Nueva transacción
                </button>
              </div>

              {/* Saldos por moneda */}
              {Object.keys(txStats.porMoneda).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(txStats.porMoneda).map(([code, vals]) => {
                    const m = MONEDA_META[code] ?? { symbol: code, flag: '💱' };
                    return (
                      <div key={code} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{m.flag} Saldo {code}</p>
                        <p className={cn('text-xl font-black', vals.saldo >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                          {m.symbol} {vals.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Filtro de mes + resumen */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Resumen del mes</h4>
                  <input type="month" value={txMesFilter} onChange={e => setTxMesFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-emerald-500 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase">Ingresos</p>
                      <p className="font-black text-emerald-700 dark:text-emerald-400 text-sm">+${txStats.ingresosMes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <TrendingDown className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-red-600 uppercase">Gastos</p>
                      <p className="font-black text-red-600 dark:text-red-400 text-sm">-${txStats.gastosMes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>

                {/* Gráfico por categoría */}
                {txStats.porCategoria.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Gastos por categoría</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={txStats.porCategoria} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip formatter={(v) => typeof v === 'number' ? `$${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : v} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {txStats.porCategoria.map((_, i) => (
                            <Cell key={i} fill={['#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316'][i % 8]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Lista de transacciones */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Todas las transacciones</h4>
                </div>
                {txStats.ordenadas.length === 0
                  ? <div className="py-16 text-center">
                      <Wallet className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                      <p className="font-bold text-slate-400">Sin transacciones aún.</p>
                      <p className="text-sm text-slate-400 mt-1">Registrá tu primer movimiento.</p>
                    </div>
                  : <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {txStats.ordenadas.map(t => {
                        const mon = MONEDA_META[t.moneda ?? 'ARS'] ?? MONEDA_META['ARS'];
                        return (
                          <div key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 group transition-colors">
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0', t.tipo === 'ingreso' ? 'bg-emerald-500' : 'bg-red-500')}>
                              {t.tipo === 'ingreso' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{t.descripcion}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t.categoria} · {t.fecha} · <span className="font-black">{mon.flag} {t.moneda ?? 'ARS'}</span></p>
                            </div>
                            <p className={cn('font-black text-sm shrink-0', t.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-500')}>
                              {t.tipo === 'ingreso' ? '+' : '-'}{mon.symbol} {t.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </p>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => openEditTx(t)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-300 hover:text-blue-500 transition-all">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteTransaccion(t.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                }
              </div>
            </motion.div>
          )}

          {/* ══ SETTINGS ══ */}
          {tab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <h3 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3"><Settings className="w-7 h-7 text-blue-600" /> SETTINGS</h3>
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 space-y-6 max-w-lg">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hero Name</label>
                  <input type="text" defaultValue={user.displayName ?? ''} disabled className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none opacity-60 cursor-not-allowed" />
                  <p className="text-[10px] text-slate-400 mt-1">Nombre sincronizado desde Google</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                  <input type="text" defaultValue={user.email ?? ''} disabled className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none opacity-60 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hero Level</label>
                  <input type="text" value={`Level ${heroLevel} · ${totalXp} XP total`} disabled className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none opacity-60 cursor-not-allowed" />
                </div>

                {/* Google Calendar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Google Calendar</label>
                  {gcalToken ? (
                    <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Conectado</p>
                          <p className="text-[10px] text-emerald-600/70">{gcalEvents.length} eventos sincronizados</p>
                        </div>
                      </div>
                      <button onClick={disconnectGCal}
                        className="text-xs font-bold text-red-500 hover:text-red-600 hover:underline transition-colors">
                        Desconectar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Conectá tu Google Calendar para ver tus eventos en la agenda y el calendario.
                      </p>
                      <button onClick={connectGCal}
                        className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all shadow-sm">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Conectar Google Calendar
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => signOut(auth)}
                    className="flex items-center gap-2 px-6 py-3 border border-red-200 dark:border-red-900/40 text-red-600 rounded-xl text-xs font-black hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── Form Modal ── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setModal(null); setEditingHabitId(null); setTargetEjercicioId(null); setTargetMateriaId(null); setModalError(null); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-lg">
                  {modal === 'habit' ? (editingHabitId ? 'Editar Quest' : '+ Nueva Quest') : modal === 'task' ? '+ Nueva Tarea' : modal === 'evento' ? '+ Nuevo Evento' : modal === 'rutina' ? '+ Nueva Rutina' : modal === 'libro' ? '+ Nuevo Libro' : modal === 'materia' ? '+ Nueva Materia' : modal === 'material' ? '+ Nuevo Material' : modal === 'tareaFac' ? '+ Nueva Tarea' : modal === 'examen' ? '+ Nuevo Examen' : targetEjercicioId ? 'Editar Ejercicio' : '+ Nuevo Ejercicio'}
                </h3>
                <button onClick={() => { setModal(null); setEditingHabitId(null); setTargetEjercicioId(null); setTargetMateriaId(null); setModalError(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Habit form ── */}
              {modal === 'habit' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
                    <input autoFocus type="text" value={habitForm.nombre}
                      onChange={e => setHabitForm(p => ({ ...p, nombre: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && saveHabit()}
                      placeholder="Ej: Leer 30 min"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Frecuencia</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([['daily', 'Diaria'], ['weekdays', 'Lun — Vie'], ['once_week', '1× semana'], ['weekly', 'Días fijos']] as [HabitRecurrence, string][]).map(([val, label]) => (
                        <button key={val} onClick={() => setHabitForm(p => ({ ...p, recurrence: val }))}
                          className={cn('py-2.5 rounded-xl border-2 text-xs font-bold transition-all',
                            habitForm.recurrence === val ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-200 dark:border-slate-700 hover:border-blue-200 text-slate-500')}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {habitForm.recurrence === 'weekly' && (
                      <div className="mt-3">
                        <p className="text-[10px] text-slate-400 mb-2">Elegí los días</p>
                        <div className="flex gap-2 flex-wrap">
                          {DIAS_LETRA.map((d, i) => (
                            <button key={i} onClick={() => {
                              const cur = habitForm.diasSemana;
                              const next = cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i];
                              setHabitForm(p => ({ ...p, diasSemana: next }));
                            }}
                              className={cn('w-9 h-9 rounded-full text-xs font-black transition-all',
                                habitForm.diasSemana.includes(i) ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-100')}>
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Stat</label>
                    <div className="grid grid-cols-3 gap-2">
                      {FS_KEYS.map(k => (
                        <button key={k} onClick={() => setHabitForm(p => ({ ...p, stat: k }))}
                          className={cn('flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-xs font-bold',
                            habitForm.stat === k ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-200 dark:border-slate-700 hover:border-blue-200 text-slate-500')}>
                          <span>{STAT_META[k].icon}</span>
                          <span>{STAT_META[k].shortName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={saveHabit} disabled={!habitForm.nombre.trim() || (habitForm.recurrence === 'weekly' && habitForm.diasSemana.length === 0)}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                    {editingHabitId ? 'Guardar cambios' : 'Agregar Quest'}
                  </button>
                </div>
              )}

              {/* ── Task form ── */}
              {modal === 'task' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título</label>
                    <input autoFocus type="text" value={taskForm.titulo}
                      onChange={e => setTaskForm(p => ({ ...p, titulo: e.target.value }))}
                      placeholder="Ej: Estudiar matemáticas"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hora (opcional)</label>
                      <input type="time" value={taskForm.hora}
                        onChange={e => setTaskForm(p => ({ ...p, hora: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Color</label>
                      <div className="flex gap-2 pt-2">
                        {['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#a855f7', '#eab308'].map(c => (
                          <button key={c} onClick={() => setTaskForm(p => ({ ...p, color: c }))}
                            style={{ backgroundColor: c }}
                            className={cn('w-6 h-6 rounded-full transition-all hover:scale-110', taskForm.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : '')} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recurrencia</label>
                    <div className="flex gap-2">
                      {(['once', 'daily', 'weekly'] as const).map(r => (
                        <button key={r} onClick={() => setTaskForm(p => ({ ...p, recurrence: r }))}
                          className={cn('flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all',
                            taskForm.recurrence === r ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-200 dark:border-slate-700 hover:border-blue-200')}>
                          {r === 'once' ? 'Una vez' : r === 'daily' ? 'Diaria' : 'Semanal'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {taskForm.recurrence === 'once' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha</label>
                      <input type="date" value={taskForm.date}
                        onChange={e => setTaskForm(p => ({ ...p, date: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  )}
                  {taskForm.recurrence === 'weekly' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Día</label>
                      <div className="grid grid-cols-7 gap-1">
                        {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d, i) => (
                          <button key={i} onClick={() => setTaskForm(p => ({ ...p, weekday: i }))}
                            className={cn('py-2 rounded-lg text-xs font-bold border-2 transition-all',
                              taskForm.weekday === i ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-200 dark:border-slate-700 hover:border-blue-200')}>
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={addTask} disabled={!taskForm.titulo.trim()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                    Agregar Tarea
                  </button>
                </div>
              )}

              {/* ── Rutina form ── */}
              {modal === 'rutina' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
                    <input autoFocus type="text" value={rutinaForm.nombre}
                      onChange={e => setRutinaForm(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Ej: Push Day, Piernas, Full Body"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Días de la semana</label>
                    <div className="grid grid-cols-7 gap-1">
                      {DIAS_LETRA.map((d, i) => (
                        <button key={i} onClick={() => setRutinaForm(p => ({
                          ...p, diasSemana: p.diasSemana.includes(i) ? p.diasSemana.filter(x => x !== i) : [...p.diasSemana, i]
                        }))} className={cn('py-2.5 rounded-xl text-xs font-black border-2 transition-all',
                          rutinaForm.diasSemana.includes(i) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-200 dark:border-slate-700 hover:border-blue-200')}>
                          {d}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{DIAS_CORTO.filter((_, i) => rutinaForm.diasSemana.includes(i)).join(', ') || 'Ningún día seleccionado'}</p>
                  </div>
                  <button onClick={addRutina} disabled={!rutinaForm.nombre.trim()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                    Crear Rutina
                  </button>
                </div>
              )}

              {/* ── Ejercicio form ── */}
              {modal === 'ejercicio' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ejercicio</label>
                    <input autoFocus type="text" value={ejercicioForm.nombre}
                      onChange={e => setEjercicioForm(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Ej: Bench Press, Sentadilla"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Series</label>
                      <input type="number" min={1} max={20} value={ejercicioForm.series}
                        onChange={e => setEjercicioForm(p => ({ ...p, series: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reps / Duración</label>
                      <input type="text" value={ejercicioForm.reps}
                        onChange={e => setEjercicioForm(p => ({ ...p, reps: e.target.value }))}
                        placeholder="8-12 / 30seg"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notas (opcional)</label>
                    <input type="text" value={ejercicioForm.notas}
                      onChange={e => setEjercicioForm(p => ({ ...p, notas: e.target.value }))}
                      placeholder="Ej: Agarre ancho, pecho bajo"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Video YouTube (opcional)</label>
                    <input type="text" value={ejercicioForm.mediaUrl}
                      onChange={e => setEjercicioForm(p => ({ ...p, mediaUrl: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    {ejercicioForm.mediaUrl && youtubeEmbedUrl(ejercicioForm.mediaUrl) && (
                      <p className="text-[10px] text-emerald-500 font-bold mt-1">✓ Video de YouTube detectado</p>
                    )}
                  </div>
                  <button onClick={targetEjercicioId ? updateEjercicio : addEjercicio} disabled={!ejercicioForm.nombre.trim()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                    {targetEjercicioId ? 'Guardar Cambios' : 'Agregar Ejercicio'}
                  </button>
                </div>
              )}

              {/* ── Libro form ── */}
              {modal === 'libro' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título</label>
                    <input autoFocus type="text" value={libroForm.titulo} onChange={e => setLibroForm(p => ({ ...p, titulo: e.target.value }))}
                      placeholder="Ej: Atomic Habits" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Autor (opcional)</label>
                    <input type="text" value={libroForm.autor} onChange={e => setLibroForm(p => ({ ...p, autor: e.target.value }))}
                      placeholder="Ej: James Clear" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estado</label>
                      <select value={libroForm.estado} onChange={e => setLibroForm(p => ({ ...p, estado: e.target.value as EstadoLibro }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm focus:outline-none">
                        <option value="pendiente">Pendiente</option>
                        <option value="leyendo">Leyendo</option>
                        <option value="leido">Leído</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Capítulos</label>
                      <input type="number" min={1} max={200} value={libroForm.totalCapitulos} onChange={e => setLibroForm(p => ({ ...p, totalCapitulos: parseInt(e.target.value) || 1 }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">XP por cap.</label>
                      <input type="number" min={1} max={100} value={libroForm.xpPorCapitulo} onChange={e => setLibroForm(p => ({ ...p, xpPorCapitulo: parseInt(e.target.value) || 1 }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm focus:outline-none" />
                    </div>
                  </div>
                  <button onClick={addLibro} disabled={!libroForm.titulo.trim()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                    Agregar Libro
                  </button>
                </div>
              )}

              {/* ── Materia form ── */}
              {modal === 'materia' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre</label>
                    <input autoFocus type="text" value={materiaForm.nombre} onChange={e => setMateriaForm(p => ({ ...p, nombre: e.target.value }))}
                      placeholder="Ej: Análisis Matemático" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'].map(c => (
                        <button key={c} onClick={() => setMateriaForm(p => ({ ...p, color: c }))}
                          className={cn('w-8 h-8 rounded-xl transition-all', materiaForm.color === c && 'ring-2 ring-offset-2 ring-slate-400 scale-110')}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <button onClick={addMateria} disabled={!materiaForm.nombre.trim()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                    Crear Materia
                  </button>
                </div>
              )}

              {/* ── Material form ── */}
              {modal === 'material' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo</label>
                    <div className="flex gap-2">
                      {(['nota', 'video', 'enlace'] as TipoMaterial[]).map(t => (
                        <button key={t} onClick={() => setMaterialForm(p => ({ ...p, tipo: t }))}
                          className={cn('flex-1 py-2 rounded-xl text-xs font-bold border-2 capitalize transition-all',
                            materialForm.tipo === t ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-200 dark:border-slate-700')}>
                          {t === 'nota' ? '📝 Nota' : t === 'video' ? '🎥 Video' : '🔗 Enlace'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título</label>
                    <input autoFocus type="text" value={materialForm.titulo} onChange={e => setMaterialForm(p => ({ ...p, titulo: e.target.value }))}
                      placeholder="Ej: Resumen unidad 3" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  {materialForm.tipo === 'nota' && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contenido</label>
                      <textarea value={materialForm.contenido} onChange={e => setMaterialForm(p => ({ ...p, contenido: e.target.value }))}
                        placeholder="Escribí tus notas aquí..." rows={5}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                    </div>
                  )}
                  {(materialForm.tipo === 'video' || materialForm.tipo === 'enlace') && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">URL</label>
                      <input type="text" value={materialForm.url} onChange={e => setMaterialForm(p => ({ ...p, url: e.target.value }))}
                        placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      {materialForm.tipo === 'video' && materialForm.url && youtubeEmbedUrl(materialForm.url) && (
                        <p className="text-[10px] text-emerald-500 font-bold mt-1">✓ Video de YouTube detectado</p>
                      )}
                    </div>
                  )}
                  <button onClick={addMaterial} disabled={!materialForm.titulo.trim()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                    Agregar Material
                  </button>
                </div>
              )}

              {/* ── Tarea facultad form ── */}
              {modal === 'tareaFac' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tarea / Entrega</label>
                    <input autoFocus type="text" value={tareaFacForm.titulo} onChange={e => setTareaFacForm(p => ({ ...p, titulo: e.target.value }))}
                      placeholder="Ej: TP1 — Funciones" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha de entrega (opcional)</label>
                    <input type="date" value={tareaFacForm.fecha} onChange={e => setTareaFacForm(p => ({ ...p, fecha: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <button onClick={addTareaFac} disabled={!tareaFacForm.titulo.trim()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                    Agregar Tarea
                  </button>
                </div>
              )}

              {/* ── Examen form ── */}
              {modal === 'examen' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Examen / Parcial</label>
                    <input autoFocus type="text" value={examenForm.titulo} onChange={e => setExamenForm(p => ({ ...p, titulo: e.target.value }))}
                      placeholder="Ej: 1er Parcial" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nota obtenida</label>
                      <input type="number" min={0} step={0.1} value={examenForm.nota} onChange={e => setExamenForm(p => ({ ...p, nota: e.target.value }))}
                        placeholder="Ej: 8" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nota máxima</label>
                      <input type="number" min={1} value={examenForm.notaMax} onChange={e => setExamenForm(p => ({ ...p, notaMax: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-sm focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha (opcional)</label>
                    <input type="date" value={examenForm.fecha} onChange={e => setExamenForm(p => ({ ...p, fecha: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  {examenForm.nota && (
                    <p className="text-[10px] text-emerald-500 font-bold">
                      +{Math.round((parseFloat(examenForm.nota) / (parseFloat(examenForm.notaMax) || 10)) * 30)} XP a Inteligencia
                    </p>
                  )}
                  <button onClick={addExamen} disabled={!examenForm.titulo.trim()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                    Guardar Examen
                  </button>
                </div>
              )}

              {/* ── Evento form ── */}
              {modal === 'evento' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título</label>
                    <input autoFocus type="text" value={eventoForm.titulo}
                      onChange={e => setEventoForm(p => ({ ...p, titulo: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addEvento()}
                      placeholder="Ej: Reunión con equipo"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hora (opcional)</label>
                      <input type="time" value={eventoForm.hora}
                        onChange={e => setEventoForm(p => ({ ...p, hora: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha</label>
                      <input type="date" value={eventoForm.fecha}
                        onChange={e => setEventoForm(p => ({ ...p, fecha: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                  </div>
                  <button onClick={addEvento} disabled={!eventoForm.titulo.trim()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-40 transition-all">
                    Agregar Evento
                  </button>
                </div>
              )}

              {/* Error banner */}
              {modalError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400">
                  ⚠️ {modalError}
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
