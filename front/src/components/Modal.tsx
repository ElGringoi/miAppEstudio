import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export const Modal = ({ open, onClose, children, className }: ModalProps) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          onClick={e => e.stopPropagation()}
          className={cn(
            'bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl',
            className
          )}
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const ModalHeader = ({ title, onClose }: { title: ReactNode; onClose: () => void }) => (
  <div className="flex items-center justify-between mb-6">
    <h3 className="font-black text-lg flex items-center gap-2">{title}</h3>
    <button
      onClick={onClose}
      aria-label="Cerrar"
      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);
