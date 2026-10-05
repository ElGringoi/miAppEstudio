import type { ReactNode } from 'react';
import { Send, Sparkles } from 'lucide-react';

// Conversación de muestra. Es estática a propósito: sirve para que se entienda
// para qué va a servir el chat cuando funcione.
const EJEMPLO = [
  { de: 'yo' as const,  texto: '¿Qué anoté sobre el libro que estoy leyendo?' },
  { de: 'ia' as const,  texto: 'Tenés 3 notas que lo mencionan. La más reciente es "Cap. 4 — hábitos atómicos", donde marcaste que querías probar el apilamiento de hábitos.' },
  { de: 'yo' as const,  texto: '¿Con quién quedé en juntarme este mes?' },
  { de: 'ia' as const,  texto: 'En Personas figuran dos pendientes tuyos: devolverle el taladro a Martín y mandarle el apunte a Sofi.' },
];

export function CerebroChat({ header }: { header?: ReactNode }) {
  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
      style={{ height: 'calc(100vh - 11rem)', minHeight: '520px' }}
    >
      {header}

      <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-900/40">
        <span className="text-sm">🚧</span>
        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
          Próximamente
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-4">
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <Sparkles className="w-8 h-8 text-blue-500" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
            Preguntale a tu segundo cerebro
          </h3>
          <p className="text-slate-400 text-sm max-w-sm">
            La idea es poder buscar en tus propias notas, personas y grupos conversando,
            en vez de acordarte dónde guardaste cada cosa. Todavía no funciona.
          </p>
        </div>

        {EJEMPLO.map((m, i) => (
          <div key={i} className={m.de === 'yo' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={
              m.de === 'yo'
                ? 'max-w-[80%] rounded-2xl rounded-br-md bg-blue-600 text-white px-4 py-2.5 text-sm opacity-60'
                : 'max-w-[80%] rounded-2xl rounded-bl-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 text-sm opacity-60'
            }>
              {m.texto}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className="relative">
          <input
            disabled
            placeholder="Próximamente…"
            className="w-full pl-4 pr-12 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm placeholder:text-slate-400 outline-none disabled:cursor-not-allowed opacity-60"
          />
          <button
            disabled
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-600 text-white opacity-40 cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
