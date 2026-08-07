import { cn } from '../lib/utils';
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

const LABEL_CLASS = 'block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2';
const INPUT_BASE  = 'w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const FormInput = ({ label, className, ...props }: InputProps) => (
  <div className="w-full">
    {label && <label className={LABEL_CLASS}>{label}</label>}
    <input className={cn(INPUT_BASE, className)} {...props} />
  </div>
);

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const FormTextarea = ({ label, className, ...props }: TextareaProps) => (
  <div className="w-full">
    {label && <label className={LABEL_CLASS}>{label}</label>}
    <textarea className={cn(INPUT_BASE, 'resize-none', className)} {...props} />
  </div>
);

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export const FormSelect = ({ label, className, children, ...props }: SelectProps) => (
  <div className="w-full">
    {label && <label className={LABEL_CLASS}>{label}</label>}
    <select className={cn(INPUT_BASE, className)} {...props}>
      {children}
    </select>
  </div>
);
