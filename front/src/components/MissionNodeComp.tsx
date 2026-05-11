import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { MissionNode } from '../types';

export const MissionNodeComp = ({
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
