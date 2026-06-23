import { useState } from 'react';
import { Plus, Lock, Wallet, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { MissionNode, MisionPrioridad } from '../types';

const PRIORIDAD_DOT: Record<MisionPrioridad, string> = {
  urgente: 'bg-red-500',
  alta:    'bg-orange-400',
  media:   'bg-yellow-400',
  baja:    'bg-slate-400',
};

const MONEDA_SYM: Record<string, string> = {
  ARS: '$', USD: 'U$S', EUR: '€', BRL: 'R$', CLP: 'CLP$', UYU: '$U',
};

export const MissionNodeComp = ({
  node, onAdd, onToggle, onEdit, onDelete, level = 0,
}: {
  node: MissionNode;
  onAdd:    (parentId: string, title: string) => void;
  onToggle: (id: string) => void;
  onEdit:   (id: string) => void;
  onDelete: (id: string) => void;
  level?: number;
}) => {
  const [adding, setAdding]       = useState(false);
  const [newTitle, setNewTitle]   = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const done      = node.progress === 100;
  const isRoot    = node.id === 'root';
  const bloqueada = node.bloqueada ?? false;

  return (
    <div className="flex flex-col items-center">
      {/* ── Nodo ── */}
      <div className={cn(
        'relative group min-w-[220px] max-w-[280px] rounded-2xl border-2 transition-all select-none',
        isRoot
          ? 'bg-violet-600 border-violet-500 text-white shadow-xl shadow-violet-500/30 p-5'
          : node.type === 'epic'
            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 p-4'
            : node.type === 'milestone'
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4'
              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 p-3',
        bloqueada && !isRoot && 'opacity-60 cursor-not-allowed',
        done && !isRoot && !bloqueada && 'opacity-70',
      )}>

        {/* Header del nodo */}
        <div className="flex items-start gap-2 mb-2">
          {/* Prioridad dot */}
          {node.prioridad && (
            <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', PRIORIDAD_DOT[node.prioridad])} />
          )}

          {/* Título */}
          <h4
            className={cn(
              'flex-1 text-xs font-bold leading-tight cursor-pointer',
              isRoot || node.type === 'epic' ? 'text-white' : 'text-slate-800 dark:text-slate-100',
              done && !isRoot && 'line-through opacity-60',
            )}
            onClick={() => !bloqueada && !isRoot && onToggle(node.id)}
          >
            {node.title}
          </h4>

          {/* Acciones (visible en hover o para root) */}
          {!isRoot && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={e => { e.stopPropagation(); onEdit(node.id); }}
                className={cn('p-1 rounded-lg transition-colors', isRoot || node.type === 'epic' ? 'hover:bg-white/20 text-white/70' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400')}
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(node.id); }}
                className={cn('p-1 rounded-lg transition-colors', isRoot || node.type === 'epic' ? 'hover:bg-white/20 text-white/70' : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400')}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Descripción */}
        {node.descripcion && (
          <p className={cn('text-[10px] mb-2 leading-relaxed',
            isRoot || node.type === 'epic' ? 'text-white/60' : 'text-slate-400')}>
            {node.descripcion}
          </p>
        )}

        {/* Barra de progreso */}
        <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${node.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn('h-full rounded-full', isRoot || node.type === 'epic' ? 'bg-white' : 'bg-blue-500')}
          />
        </div>

        {/* Footer: % + badges + add */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-[10px] font-bold', isRoot || node.type === 'epic' ? 'text-white/60' : 'text-slate-400')}>
            {node.progress}%
          </span>

          {/* Bloqueado */}
          {bloqueada && (
            <span className="flex items-center gap-0.5 text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
              <Lock className="w-2.5 h-2.5" /> Bloqueada
            </span>
          )}

          {/* Costo */}
          {node.costoMonto != null && node.costoMonto > 0 && (
            <span className={cn('flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full',
              isRoot || node.type === 'epic' ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600')}>
              <Wallet className="w-2.5 h-2.5" />
              {MONEDA_SYM[node.costoMoneda ?? 'ARS']} {node.costoMonto.toLocaleString('es-AR')}
            </span>
          )}

          <div className="ml-auto flex items-center gap-1">
            {/* Colapsar hijos */}
            {node.children && node.children.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setCollapsed(c => !c); }}
                className={cn('p-1 rounded-md transition-colors', isRoot || node.type === 'epic' ? 'hover:bg-white/20 text-white/70' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400')}
              >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
            {/* Agregar hijo */}
            <button
              onClick={e => { e.stopPropagation(); setAdding(a => !a); }}
              className={cn('p-1 rounded-md transition-colors', isRoot || node.type === 'epic' ? 'hover:bg-white/20 text-white/70' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400')}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Inline add */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 overflow-hidden"
            >
              <input
                autoFocus type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTitle.trim()) {
                    onAdd(node.id, newTitle.trim()); setNewTitle(''); setAdding(false);
                  }
                  if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
                }}
                onClick={e => e.stopPropagation()}
                placeholder="Nombre de la misión… (Enter)"
                className={cn(
                  'w-full bg-transparent border-none text-[11px] focus:outline-none',
                  isRoot || node.type === 'epic' ? 'placeholder:text-white/40 text-white' : 'placeholder:text-slate-400',
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Hijos ── */}
      {node.children && node.children.length > 0 && !collapsed && (
        <div className="relative pt-8 flex gap-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-200 dark:bg-slate-700" />
          {node.children.map((child, idx) => (
            <div key={child.id} className="relative">
              {node.children!.length > 1 && (
                <div className={cn('absolute top-0 h-px bg-slate-200 dark:bg-slate-700',
                  idx === 0 ? 'left-1/2 right-0' : idx === node.children!.length - 1 ? 'left-0 right-1/2' : 'left-0 right-0'
                )} />
              )}
              <MissionNodeComp node={child} onAdd={onAdd} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
