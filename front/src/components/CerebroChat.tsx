/**
 * CerebroChat: Interfaz de chat conversacional del Segundo Cerebro
 * Permite hacer preguntas sobre notas, personas y grupos
 */

import type { ReactNode } from 'react';
import { useRef, useEffect, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import type { FSEntradaDiario, FSPersona, FSGrupo } from '../types';
import { useCerebroChat } from '../hooks/useCerebroChat';
import { cn } from '../lib/utils';

interface CerebroChatProps {
  header?: ReactNode;
  entradas: FSEntradaDiario[];
  personas: FSPersona[];
  grupos: FSGrupo[];
}

export function CerebroChat({ header, entradas, personas, grupos }: CerebroChatProps) {
  const { mensajes, send, limpiar } = useCerebroChat({
    entradas,
    personas,
    grupos,
  });

  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al fondo cuando hay nuevos mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    await send(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const estaVacio = mensajes.length === 0;

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
      style={{ height: 'calc(100vh - 11rem)', minHeight: '520px' }}
    >
      {header}

      {/* Área de mensajes */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-4"
      >
        {estaVacio && (
          <div className="flex flex-col items-center text-center gap-2 mb-6">
            <div className="text-4xl">🧠</div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
              Tu Segundo Cerebro
            </h3>
            <p className="text-slate-400 text-sm max-w-sm">
              Preguntame sobre tus notas, personas y grupos. Busco automáticamente la información relevante en tu base de conocimiento.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
              💡 Prueba: "¿Qué noté sobre productividad?" o "¿Cuáles son los pendientes con Martín?"
            </p>
          </div>
        )}

        {/* Mensajes */}
        {mensajes.map(m => (
          <div
            key={m.id}
            className={m.de === 'user' ? 'flex justify-end' : 'flex justify-start'}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                m.de === 'user'
                  ? 'rounded-br-md bg-blue-600 text-white'
                  : 'rounded-bl-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              )}
            >
              {m.texto}
            </div>
          </div>
        ))}

      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="relative flex items-center gap-2">
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Preguntale algo..."
            className="flex-1 pl-4 pr-12 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>

          {!estaVacio && (
            <button
              onClick={limpiar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Limpiar historial"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
