import { useState } from 'react';
import { BookOpen, Send } from 'lucide-react';

interface BitacoraWidgetProps {
  onGuardar: (texto: string) => Promise<void>;
}

export function BitacoraWidget({ onGuardar }: BitacoraWidgetProps) {
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (!texto.trim()) return;
    setGuardando(true);
    try {
      await onGuardar(texto);
      setTexto('');
    } finally {
      setGuardando(false);
    }
  }

  const ahora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-slate-900 dark:text-white">Bitácora</h3>
        <span className="text-xs text-slate-400 ml-auto">{ahora}</span>
      </div>
      <div className="flex gap-1.5">
        <input
          type="text"
          placeholder="Anotá algo del día…"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && guardar()}
          disabled={guardando}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={guardar}
          disabled={!texto.trim() || guardando}
          className="px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
