import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Calendar as CalendarIcon, Zap, Settings,
  CheckCircle2, Plus, Target, Sword, Brain, Flame, Dumbbell,
  BookOpen, ChevronRight, Bell, Search, Trophy, Sparkles,
  Repeat, CalendarDays, LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import {
  format, addDays, startOfWeek, eachDayOfInterval,
  isSameDay, isToday, getDay,
} from 'date-fns';
import {
  onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  collection, doc, increment, onSnapshot,
  setDoc, updateDoc, addDoc,
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';

// ─── Firestore types ──────────────────────────────────────────────────────────

type FSStatKey = 'fuerza' | 'inteligencia' | 'carisma' | 'agilidad' | 'resistencia' | 'sabiduria';
type FSStatsDoc = Record<FSStatKey, { xp: number }>;
type FSHabito  = { id: string; nombre: string; stat: FSStatKey; fechaCompletado: string | null };
type FSEvento  = { id: string; titulo: string; hora?: string; fecha: string };
type FSMision  = { id: string; titulo: string; completada: boolean; parentId: string | null; orden: number };
type FSTarea   = { id: string; titulo: string; hora?: string; recurrence: 'once' | 'daily' | 'weekly'; weekday?: number; date?: string; color: string; completedDates: string[] };

// ─── UI types ─────────────────────────────────────────────────────────────────

interface Stat { name: string; value: number; max: number; level: number; icon: React.ReactNode; color: string; description: string; shortName: string; }
interface Habit { id: string; name: string; stat: FSStatKey; icon: React.ReactNode; completed: boolean; attribute: string; }
interface MissionNode { id: string; title: string; type: 'epic' | 'milestone' | 'task'; progress: number; children?: MissionNode[]; }
interface Task { id: string; title: string; time: string; color: string; completed: boolean; recurrence: 'once' | 'daily' | 'weekly'; weekday?: number; date?: string; completedDates: string[]; }
interface Exercise { id: string; name: string; description: string; muscles: string[]; sets: number; reps: string; days: number[]; }

// ─── Constants ────────────────────────────────────────────────────────────────

const HOY = new Date().toISOString().slice(0, 10);
const FS_KEYS: FSStatKey[] = ['fuerza', 'inteligencia', 'carisma', 'agilidad', 'resistencia', 'sabiduria'];

const STAT_META: Record<FSStatKey, Omit<Stat, 'value' | 'max' | 'level'>> = {
  fuerza:       { name: 'Strength',     icon: <Dumbbell className="w-4 h-4" />, color: 'bg-red-500',     shortName: 'STR', description: 'Physical output and endurance.'   },
  inteligencia: { name: 'Intelligence', icon: <Brain    className="w-4 h-4" />, color: 'bg-blue-500',    shortName: 'INT', description: 'Learning and problem solving.'    },
  carisma:      { name: 'Charisma',     icon: <Sparkles className="w-4 h-4" />, color: 'bg-yellow-500',  shortName: 'CHA', description: 'Communication and collaboration.' },
  sabiduria:    { name: 'Wisdom',       icon: <BookOpen className="w-4 h-4" />, color: 'bg-purple-500',  shortName: 'WIS', description: 'Mindfulness and decision making.' },
  agilidad:     { name: 'Agility',      icon: <Zap      className="w-4 h-4" />, color: 'bg-emerald-500', shortName: 'AGI', description: 'Speed and precision.'             },
  resistencia:  { name: 'Resistance',   icon: <Flame    className="w-4 h-4" />, color: 'bg-orange-500',  shortName: 'RES', description: 'Endurance and toughness.'        },
};

const GYM_ROUTINE: Exercise[] = [
  { id: 'e1', name: 'Bench Press',    description: 'Fundamental chest strength.',            muscles: ['Chest','Triceps','Shoulders'],       sets: 4, reps: '8-12',   days: [1,4] },
  { id: 'e2', name: 'Deadlift',       description: 'King of all exercises.',                 muscles: ['Back','Glutes','Hamstrings','Core'], sets: 3, reps: '5',      days: [2,5] },
  { id: 'e3', name: 'Squats',         description: 'Essential lower body power.',            muscles: ['Quads','Glutes','Core'],            sets: 4, reps: '10',     days: [1,4] },
  { id: 'e4', name: 'Overhead Press', description: 'Builds broad shoulders.',                muscles: ['Shoulders','Triceps','Core'],       sets: 3, reps: '8-10',   days: [2,5] },
  { id: 'e5', name: 'Pull Ups',       description: 'Back width and bicep strength.',         muscles: ['Back','Biceps'],                    sets: 3, reps: 'Failure', days: [1,4] },
  { id: 'e6', name: 'Barbell Row',    description: 'Back thickness and pulling power.',      muscles: ['Back','Biceps','Core'],             sets: 4, reps: '8-10',   days: [2,5] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function xpLevel(xp: number) {
  return { level: Math.floor(xp / 100) + 1, xpInLevel: xp % 100 };
}

function statsFromDoc(fsDoc: FSStatsDoc | null): Stat[] {
  return FS_KEYS.map(key => {
    const xp = fsDoc?.[key]?.xp ?? 0;
    const { level, xpInLevel } = xpLevel(xp);
    return { ...STAT_META[key], value: xpInLevel, max: 100, level };
  });
}

function buildTree(misiones: FSMision[]): MissionNode {
  const empty: MissionNode = { id: 'root', title: 'My Missions', type: 'epic', progress: 0, children: [] };
  if (!misiones.length) return empty;

  function node(m: FSMision, depth: number): MissionNode {
    const kids = misiones.filter(c => c.parentId === m.id).sort((a, b) => a.orden - b.orden).map(c => node(c, depth + 1));
    const prog = kids.length ? Math.round(kids.filter(k => k.progress === 100).length / kids.length * 100) : m.completada ? 100 : 0;
    return { id: m.id, title: m.titulo, type: depth === 0 ? 'epic' : depth === 1 ? 'milestone' : 'task', progress: prog, children: kids.length ? kids : undefined };
  }

  const roots = misiones.filter(m => !m.parentId).sort((a, b) => a.orden - b.orden);
  if (!roots.length) return empty;
  if (roots.length === 1) return node(roots[0], 0);
  const children = roots.map(r => node(r, 1));
  return { id: 'root', title: 'My Missions', type: 'epic', progress: Math.round(children.reduce((s, c) => s + c.progress, 0) / children.length), children };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ProgressBar = ({ value, max, color, className }: { value: number; max: number; color: string; className?: string }) => (
  <div className={cn('w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden', className)}>
    <motion.div
      initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={cn('h-full rounded-full', color)}
    />
  </div>
);

const StatCard = ({ stat }: { stat: Stat }) => (
  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2">
        <div className={cn('p-1.5 rounded-lg text-white', stat.color)}>{stat.icon}</div>
        <div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">{stat.name}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Lv.{stat.level}</span>
        </div>
      </div>
      <span className="text-xs font-mono font-bold text-slate-500">{stat.value}/100 xp</span>
    </div>
    <ProgressBar value={stat.value} max={stat.max} color={stat.color} />
    <p className="text-[10px] text-slate-400 mt-2 leading-tight">{stat.description}</p>
  </div>
);

const MuscleMapSVG = ({ active }: { active: string[] }) => {
  const on = (m: string) => active.includes(m);
  const hit = 'fill-red-500'; const off = 'fill-slate-200 dark:fill-slate-700';
  return (
    <svg viewBox="0 0 100 200" className="w-24 h-48">
      <circle cx="50" cy="15" r="10" className={off} />
      <rect x="45" y="25" width="10" height="5" className={off} />
      <path d="M30 30 Q50 25 70 30 L75 45 Q50 40 25 45 Z"      className={on('Shoulders') ? hit : off} />
      <path d="M35 45 Q50 42 65 45 L65 65 Q50 68 35 65 Z"      className={on('Chest') ? hit : off} />
      <path d="M40 70 Q50 68 60 70 L60 95 Q50 98 40 95 Z"      className={on('Core') ? hit : off} />
      <path d="M20 45 L30 45 L28 80 L18 80 Z"                  className={on('Biceps') || on('Triceps') ? hit : off} />
      <path d="M70 45 L80 45 L82 80 L72 80 Z"                  className={on('Biceps') || on('Triceps') ? hit : off} />
      <path d="M30 100 Q50 95 70 100 L75 115 Q50 120 25 115 Z" className={on('Glutes') ? hit : off} />
      <path d="M28 120 L48 120 L45 160 L25 160 Z"              className={on('Quads') || on('Hamstrings') ? hit : off} />
      <path d="M52 120 L72 120 L75 160 L55 160 Z"              className={on('Quads') || on('Hamstrings') ? hit : off} />
      <path d="M25 165 L45 165 L42 195 L22 195 Z"              className={on('Calves') ? hit : off} />
      <path d="M55 165 L75 165 L78 195 L58 195 Z"              className={on('Calves') ? hit : off} />
    </svg>
  );
};

const GymCard = ({ exercise }: { exercise: Exercise }) => (
  <div className="flex flex-col gap-4 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-red-200 dark:hover:border-red-900/40 transition-all">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h4 className="font-black text-slate-900 dark:text-slate-100 text-lg tracking-tight">{exercise.name}</h4>
        <p className="text-xs text-slate-500 mt-1">{exercise.description}</p>
      </div>
      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-100 dark:border-red-900/30 ml-4 shrink-0">
        {exercise.sets} × {exercise.reps}
      </span>
    </div>
    <div className="flex items-center gap-6 pt-4 border-t border-slate-50 dark:border-slate-800">
      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shrink-0">
        <MuscleMapSVG active={exercise.muscles} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Zones</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {exercise.muscles.map(m => (
            <span key={m} className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{m}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const MissionNodeComp = ({
  node, onAdd, onToggle, level = 0,
}: {
  node: MissionNode; onAdd: (id: string, t: string) => void;
  onToggle: (id: string) => void; level?: number;
}) => {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const done = node.progress === 100;
  return (
    <div className="flex flex-col items-center">
      <div className={cn('relative p-4 rounded-xl border-2 min-w-[200px] text-center transition-all cursor-pointer',
        node.type === 'epic'      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' :
        node.type === 'milestone' ? 'bg-white dark:bg-slate-900 border-blue-200 dark:border-slate-700' :
                                    'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        done && node.type !== 'epic' && 'opacity-60'
      )} onClick={() => node.id !== 'root' && onToggle(node.id)}>
        <h4 className={cn('text-xs font-bold mb-2', node.type === 'epic' ? 'text-white' : 'text-slate-800 dark:text-slate-100', done && node.type !== 'epic' && 'line-through')}>{node.title}</h4>
        <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div className={cn('h-full', node.type === 'epic' ? 'bg-white' : 'bg-blue-500')} style={{ width: `${node.progress}%` }} />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] opacity-70">{node.progress}%</span>
          <button onClick={e => { e.stopPropagation(); setAdding(!adding); }}
            className={cn('p-1 rounded-md', node.type === 'epic' ? 'hover:bg-white/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800')}>
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <AnimatePresence>
          {adding && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 overflow-hidden">
              <input autoFocus type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newTitle) { onAdd(node.id, newTitle); setNewTitle(''); setAdding(false); } }}
                onClick={e => e.stopPropagation()}
                placeholder="Mission title…"
                className="w-full bg-transparent border-none text-[10px] focus:outline-none placeholder:opacity-50" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="relative pt-8 flex gap-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-200 dark:bg-slate-700" />
          {node.children.map((child, idx) => (
            <div key={child.id} className="relative">
              {node.children!.length > 1 && (
                <div className={cn('absolute top-0 h-px bg-slate-200 dark:bg-slate-700',
                  idx === 0 ? 'left-1/2 right-0' : idx === node.children!.length - 1 ? 'left-0 right-1/2' : 'left-0 right-0'
                )} />
              )}
              <MissionNodeComp node={child} onAdd={onAdd} onToggle={onToggle} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 shadow-xl text-center max-w-sm w-full">
      <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mx-auto mb-6">
        <CheckCircle2 className="w-9 h-9" />
      </div>
      <h1 className="font-black text-2xl tracking-tight mb-1">QUESTFLOW</h1>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Battle Station</p>
      <p className="text-slate-500 text-sm mb-10 leading-relaxed">Tu productividad como un RPG.<br />Completá quests, subí de nivel.</p>
      <button onClick={onLogin}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity=".7" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff" fillOpacity=".5" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity=".9" />
        </svg>
        Continuar con Google
      </button>
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser]           = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Firestore raw state
  const [fsStats,    setFsStats]    = useState<FSStatsDoc | null>(null);
  const [fsHabitos,  setFsHabitos]  = useState<FSHabito[]>([]);
  const [fsEventos,  setFsEventos]  = useState<FSEvento[]>([]);
  const [fsMisiones, setFsMisiones] = useState<FSMision[]>([]);
  const [fsTareas,   setFsTareas]   = useState<FSTarea[]>([]);

  // UI state
  const [tab,     setTab]     = useState('dashboard');
  const [selDate, setSelDate] = useState(new Date());
  const [gymView, setGymView] = useState<'today' | 'weekly'>('today');

  // Auth listener
  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); }), []);

  // Firestore listeners
  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;
    const u1 = onSnapshot(doc(db, 'usuarios', uid, 'stats', 'main'), s => setFsStats(s.exists() ? s.data() as FSStatsDoc : null));
    const u2 = onSnapshot(collection(db, 'usuarios', uid, 'habitos'),  s => setFsHabitos(s.docs.map(d => ({ id: d.id, ...d.data() } as FSHabito))));
    const u3 = onSnapshot(collection(db, 'usuarios', uid, 'eventos'),  s => setFsEventos(s.docs.map(d => ({ id: d.id, ...d.data() } as FSEvento))));
    const u4 = onSnapshot(collection(db, 'usuarios', uid, 'misiones'), s => setFsMisiones(s.docs.map(d => ({ id: d.id, ...d.data() } as FSMision))));
    const u5 = onSnapshot(collection(db, 'usuarios', uid, 'tareas'),   s => setFsTareas(s.docs.map(d => ({ id: d.id, ...d.data() } as FSTarea))));
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [user?.uid]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const stats    = statsFromDoc(fsStats);
  const missions = buildTree(fsMisiones);
  const radarData = stats.map(s => ({ subject: s.shortName, A: s.value, fullMark: 100 }));

  const habits: Habit[] = fsHabitos.map(h => ({
    id: h.id, name: h.nombre, stat: h.stat,
    icon: STAT_META[h.stat]?.icon ?? <Zap className="w-4 h-4" />,
    completed: h.fechaCompletado === HOY,
    attribute: STAT_META[h.stat]?.name ?? h.stat,
  }));

  const todayEventos = fsEventos.filter(e => e.fecha === HOY);

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

  const done = habits.filter(h => h.completed).length;

  const totalXp    = fsStats ? FS_KEYS.reduce((s, k) => s + (fsStats[k]?.xp ?? 0), 0) : 0;
  const heroLevel  = Math.floor(totalXp / 600) + 1;
  const xpInLevel  = totalXp % 600;
  const initials   = (user?.displayName ?? 'H').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  // ── Firestore writes ──────────────────────────────────────────────────────

  async function toggleHabit(id: string) {
    if (!user?.uid) return;
    const h = fsHabitos.find(x => x.id === id);
    if (!h) return;
    const yaHecho = h.fechaCompletado === HOY;
    await updateDoc(doc(db, 'usuarios', user.uid, 'habitos', id), { fechaCompletado: yaHecho ? null : HOY });
    await setDoc(doc(db, 'usuarios', user.uid, 'stats', 'main'), { [h.stat]: { xp: increment(yaHecho ? -20 : 20) } }, { merge: true });
  }

  async function toggleTask(id: string, d: Date) {
    if (!user?.uid) return;
    const dStr = d.toISOString().slice(0, 10);
    const t = fsTareas.find(x => x.id === id);
    if (!t) return;
    const prev = t.completedDates ?? [];
    const next = prev.includes(dStr) ? prev.filter(x => x !== dStr) : [...prev, dStr];
    await updateDoc(doc(db, 'usuarios', user.uid, 'tareas', id), { completedDates: next });
  }

  async function addMission(parentId: string, title: string) {
    if (!user?.uid) return;
    const realParent = parentId === 'root' ? null : parentId;
    await addDoc(collection(db, 'usuarios', user.uid, 'misiones'), {
      titulo: title, completada: false, parentId: realParent,
      orden: fsMisiones.filter(m => m.parentId === realParent).length,
    });
  }

  async function toggleMission(id: string) {
    if (!user?.uid) return;
    const m = fsMisiones.find(x => x.id === id);
    if (!m) return;
    await updateDoc(doc(db, 'usuarios', user.uid, 'misiones', id), { completada: !m.completada });
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

  // ── Nav ───────────────────────────────────────────────────────────────────

  const NAV = [
    { id: 'dashboard',  icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard'  },
    { id: 'calendar',   icon: <CalendarIcon     className="w-5 h-5" />, label: 'Calendar'   },
    { id: 'attributes', icon: <Sword            className="w-5 h-5" />, label: 'Attributes' },
    { id: 'habits',     icon: <Zap              className="w-5 h-5" />, label: 'Quests'     },
    { id: 'missions',   icon: <Target           className="w-5 h-5" />, label: 'Missions'   },
    { id: 'settings',   icon: <Settings         className="w-5 h-5" />, label: 'Settings'   },
  ];

  const PAGE_TITLE: Record<string, string> = {
    dashboard: 'BATTLE STATION', calendar: 'BATTLE LOG', attributes: 'SKILL TREE',
    habits: 'DAILY QUESTS', missions: 'MISSION TREE', settings: 'SETTINGS',
  };
  const PAGE_SUB: Record<string, string> = {
    dashboard: `Welcome back, ${user.displayName?.split(' ')[0] ?? 'Hero'} 👋`,
    calendar: 'Schedule your battles', attributes: "Your hero's power",
    habits: 'Complete your daily quests', missions: 'Track your objectives',
    settings: 'Configure your hero',
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col fixed h-full z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg leading-none tracking-tight">QUESTFLOW</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lv.{heroLevel} Hero</p>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-4 space-y-1">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                tab === item.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}>
              <span className={cn(tab === item.id ? 'text-white' : 'group-hover:text-blue-500 transition-colors')}>{item.icon}</span>
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-4 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Hero XP</p>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold">{xpInLevel} xp</span>
                <span className="text-[10px] opacity-60">/ 600</span>
              </div>
              <ProgressBar value={xpInLevel} max={600} color="bg-blue-600" className="h-1.5" />
            </div>
            <Sword className="absolute -right-4 -bottom-4 w-20 h-20 text-blue-500/10 group-hover:rotate-12 transition-transform duration-500" />
          </div>
          <div className="flex items-center gap-3 px-2">
            {user.photoURL
              ? <img src={user.photoURL} className="h-10 w-10 rounded-full border-2 border-blue-200" />
              : <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">{initials}</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.displayName}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{PAGE_SUB[tab]}</p>
            <h2 className="text-4xl font-black tracking-tighter mt-1">{PAGE_TITLE[tab]}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
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
                      <span className="text-[10px] font-black bg-blue-500/20 border border-blue-400/30 text-blue-300 px-3 py-1 rounded-full uppercase tracking-widest">Hero</span>
                    </div>
                    <p className="text-slate-400 text-xs mb-3">{xpInLevel} / 600 XP — nivel {heroLevel}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(xpInLevel / 600) * 100}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">{Math.round((xpInLevel / 600) * 100)}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 shrink-0">
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
                    <h3 className="text-xl font-black flex items-center gap-3 mb-8"><CalendarIcon className="w-6 h-6 text-blue-600" /> DAILY AGENDA</h3>
                    {todayEventos.length === 0
                      ? <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                          <CalendarDays className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                          <p className="text-sm font-bold text-slate-400">Sin eventos para hoy</p>
                        </div>
                      : <div className="space-y-4 relative">
                          <div className="absolute left-[87px] top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
                          {todayEventos.map(ev => (
                            <div key={ev.id} className="grid grid-cols-[80px_1fr] gap-8">
                              <div className="text-right py-2"><span className="text-xs font-black text-slate-400">{ev.hora || '—'}</span></div>
                              <div className="relative pl-4">
                                <div className="absolute -left-[41px] top-3 w-3 h-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 z-10" />
                                <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                  <h4 className="font-bold text-sm">{ev.titulo}</h4>
                                  <p className="text-[10px] text-blue-500 mt-1 font-bold uppercase tracking-widest">evento</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                    }
                  </section>
                </div>

                <div className="space-y-6">
                  {/* Quests */}
                  <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-sm flex items-center gap-2"><Zap className="w-5 h-5 text-blue-600" /> DAILY QUESTS</h3>
                      <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded-full">{Math.round((done / Math.max(habits.length, 1)) * 100)}% DONE</span>
                    </div>
                    {habits.length === 0
                      ? <p className="text-[11px] text-slate-400 text-center py-4">Sin quests. Agregalas en la pantalla Quests.</p>
                      : <div className="space-y-2">
                          {habits.slice(0, 6).map(h => (
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
                      <ProgressBar value={done} max={Math.max(habits.length, 1)} color="bg-blue-600" />
                      <p className="text-[10px] text-slate-400 mt-1.5">{done}/{habits.length} · +{done * 20} XP</p>
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
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Quests para {format(selDate, 'EEEE, MMMM do')}</h4>
                  {filterTasks(selDate).length > 0 ? filterTasks(selDate).map(task => (
                    <div key={task.id} onClick={() => toggleTask(task.id, selDate)}
                      className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 cursor-pointer">
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
                      <div className={cn('w-8 h-8 rounded-xl border-2 flex items-center justify-center', task.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700')}>
                        {task.completed && <CheckCircle2 className="w-5 h-5" />}
                      </div>
                    </div>
                  )) : (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                      <CalendarDays className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                      <p className="text-sm font-bold text-slate-400">Sin quests para este día.</p>
                      <p className="text-xs text-slate-400 mt-1">Agregalas desde la app mobile.</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {/* ══ ATTRIBUTES ══ */}
          {tab === 'attributes' && (
            <motion.div key="attributes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <h3 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3"><Sword className="w-7 h-7 text-blue-600" /> SKILL TREE</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.map(stat => {
                  const linked = habits.filter(h => h.attribute === stat.name);
                  return (
                    <div key={stat.name} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn('p-3 rounded-2xl text-white', stat.color)}>{stat.icon}</div>
                          <div>
                            <h4 className="text-lg font-black">{stat.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level {stat.level}</p>
                          </div>
                        </div>
                        <span className="text-xl font-black">{stat.value}<span className="text-xs text-slate-400 font-bold ml-1">/100 xp</span></span>
                      </div>
                      <ProgressBar value={stat.value} max={stat.max} color={stat.color} className="h-2 mb-4" />
                      <div className="space-y-2 flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quests Asociadas</p>
                        {linked.length > 0 ? linked.map(h => (
                          <div key={h.id} onClick={() => toggleHabit(h.id)} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-blue-200 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs', h.completed ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-700')}>{h.icon}</div>
                              <p className="text-xs font-bold">{h.name}</p>
                            </div>
                            <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center', h.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700')}>
                              {h.completed && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                          </div>
                        )) : <p className="text-[10px] text-slate-400 text-center py-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">Sin quests. Agregalas desde la app mobile.</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Gym */}
              <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-500/20"><Dumbbell className="w-6 h-6" /></div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight uppercase">Strength Training</h3>
                      <p className="text-xs text-slate-500">Your weekly gym program</p>
                    </div>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(['today', 'weekly'] as const).map(v => (
                      <button key={v} onClick={() => setGymView(v)}
                        className={cn('px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all', gymView === v ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600' : 'text-slate-500')}>
                        {v === 'today' ? 'Today' : 'Weekly'}
                      </button>
                    ))}
                  </div>
                </div>
                {gymView === 'today'
                  ? GYM_ROUTINE.filter(ex => ex.days.includes(getDay(new Date()))).length > 0
                    ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{GYM_ROUTINE.filter(ex => ex.days.includes(getDay(new Date()))).map(ex => <GymCard key={ex.id} exercise={ex} />)}</div>
                    : <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl"><Flame className="w-12 h-12 text-slate-200 mx-auto mb-4" /><p className="text-sm font-bold text-slate-400">Rest Day — recover well!</p></div>
                  : <div className="space-y-8">{[1,2,3,4,5,6,0].map(d => {
                      const name = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d];
                      const exs  = GYM_ROUTINE.filter(ex => ex.days.includes(d));
                      return (
                        <div key={d}>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400 px-4 py-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">{name}</span>
                            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                          </div>
                          {exs.length > 0 ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{exs.map(ex => <GymCard key={ex.id} exercise={ex} />)}</div> : <p className="text-center text-xs text-slate-400 italic py-3">Rest day</p>}
                        </div>
                      );
                    })}</div>
                }
              </section>
            </motion.div>
          )}

          {/* ══ QUESTS ══ */}
          {tab === 'habits' && (
            <motion.div key="habits" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3"><Zap className="w-7 h-7 text-blue-600" /> DAILY QUESTS</h3>
                <span className="text-sm font-black text-slate-500">{done}/{habits.length} completadas</span>
              </div>
              {habits.length === 0
                ? <div className="py-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl"><Zap className="w-12 h-12 text-slate-200 mx-auto mb-4" /><p className="font-bold text-slate-400">Sin quests aún.</p><p className="text-sm text-slate-400 mt-1">Agregalas desde la app mobile.</p></div>
                : <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {habits.map(h => (
                        <motion.div key={h.id} layout onClick={() => toggleHabit(h.id)}
                          className={cn('flex items-center gap-5 p-6 rounded-2xl border-2 cursor-pointer transition-all',
                            h.completed ? 'border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200')}>
                          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0', h.completed ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                            <div className="scale-150">{h.icon}</div>
                          </div>
                          <div className="flex-1">
                            <p className={cn('font-black text-base', h.completed && 'line-through text-slate-400')}>{h.name}</p>
                            <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-widest">{h.attribute}</p>
                          </div>
                          <div className={cn('w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0', h.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700')}>
                            {h.completed && <CheckCircle2 className="w-5 h-5" />}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Overall Progress</h4>
                      <ProgressBar value={done} max={Math.max(habits.length, 1)} color="bg-blue-600" className="h-3" />
                      <p className="text-sm font-bold text-slate-500 mt-3">{done} of {habits.length} complete · +{done * 20} XP earned</p>
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
                {fsMisiones.length === 0
                  ? <div className="py-16 text-center"><Target className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" /><p className="font-bold text-slate-400">Sin misiones aún.</p><p className="text-sm text-slate-400 mt-1">Agregalas desde la app mobile.</p></div>
                  : <div className="flex justify-center min-w-max pb-8">
                      <MissionNodeComp node={missions} onAdd={addMission} onToggle={toggleMission} />
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
    </div>
  );
}
