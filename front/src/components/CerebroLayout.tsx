import type { ReactNode } from 'react';
import { Search, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Shell master/detail del Segundo Cerebro.
 *
 * La altura del contenedor es fija (`calc(100vh - 11rem)`), así que la franja
 * de secciones va ADENTRO: si fuera afuera, la caja se pasaría del viewport y
 * en mobile aparecería scroll doble.
 *
 * El wrapper flex interno necesita `min-h-0` sí o sí — sin él los paneles con
 * `overflow-y-auto` no scrollean y desbordan la caja.
 */
export function CerebroLayout({ header, showRight, left, right }: {
  header?:    ReactNode;
  showRight:  boolean;
  left:       ReactNode;
  right:      ReactNode;
}) {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
      style={{ height: 'calc(100vh - 11rem)', minHeight: '520px' }}
    >
      {header}
      <div className="flex flex-1 min-h-0">
        <div className={cn(
          'flex flex-col border-r border-slate-200 dark:border-slate-700 shrink-0',
          'w-full md:w-72 lg:w-80',
          showRight ? 'hidden md:flex' : 'flex'
        )}>
          {left}
        </div>
        <div className={cn(
          'flex-1 flex-col overflow-y-auto',
          showRight ? 'flex' : 'hidden md:flex'
        )}>
          {right}
        </div>
      </div>
    </div>
  );
}

/** Input de búsqueda con lupa, igual en todas las secciones. */
export function CerebroSearch({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="p-3 border-b border-slate-100 dark:border-slate-800">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

/** Barra superior del panel derecho: "Volver" en mobile + acciones a la derecha. */
export function PanelActions({ onBack, title, children }: {
  onBack:    () => void;
  title?:    ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
      <button onClick={onBack}
        className="md:hidden flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 mr-2"
      >
        <ChevronLeft className="w-4 h-4" /> Volver
      </button>
      {title
        ? <span className="text-sm font-bold text-slate-500 dark:text-slate-400 flex-1">{title}</span>
        : <div className="flex-1" />}
      {children}
    </div>
  );
}

/** Empty state centrado, con CTA opcional. */
export function CerebroVacio({ icono, titulo, texto, cta }: {
  icono:  string;
  titulo: string;
  texto:  string;
  cta?:   ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <span className="text-6xl">{icono}</span>
      <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">{titulo}</h3>
      <p className="text-slate-400 text-sm max-w-xs">{texto}</p>
      {cta}
    </div>
  );
}

/** Botón full-width al pie del panel izquierdo. */
export function NuevoButton({ onClick, label, icon }: {
  onClick: () => void;
  label:   string;
  icon:    ReactNode;
}) {
  return (
    <div className="p-3 border-t border-slate-100 dark:border-slate-800">
      <button onClick={onClick}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
      >
        {icon} {label}
      </button>
    </div>
  );
}
