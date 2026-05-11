import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
  className?: string;
}

export const ProgressBar = ({ value, max, color, className }: ProgressBarProps) => (
  <div className={cn('w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden', className)}>
    <motion.div
      initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={cn('h-full rounded-full', color)}
    />
  </div>
);
