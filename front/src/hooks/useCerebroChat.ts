/**
 * Hook personalizado para manejar la lógica del chat del Segundo Cerebro
 * Gestiona el historial y responde buscando en las notas, personas y grupos
 */

import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage, FSEntradaDiario, FSPersona, FSGrupo } from '../types';
import { responderConMisDatos } from '../utils/cerebro-busqueda';

const STORAGE_KEY = 'cerebro_chat_history';

interface UseCerebroChatOptions {
  entradas: FSEntradaDiario[];
  personas: FSPersona[];
  grupos: FSGrupo[];
}

/** Lee el historial guardado; si falla, arranca vacío */
const cargarHistorial = (): ChatMessage[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.warn('No se pudo cargar historial del chat:', e);
    return [];
  }
};

export function useCerebroChat(options: UseCerebroChatOptions) {
  const { entradas, personas, grupos } = options;
  const [mensajes, setMensajes] = useState<ChatMessage[]>(cargarHistorial);

  // Guardar historial en localStorage cada vez que cambia
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mensajes));
    } catch (e) {
      console.warn('No se pudo guardar historial:', e);
    }
  }, [mensajes]);

  /**
   * Agrega la pregunta y la respuesta de búsqueda local al historial
   */
  const send = useCallback(
    async (userMessage: string) => {
      const texto = userMessage.trim();
      if (!texto) return;

      const ahora = new Date().toISOString();
      const userMsg: ChatMessage = { id: crypto.randomUUID(), de: 'user', texto, timestamp: ahora };
      const iaMsg: ChatMessage = {
        id: crypto.randomUUID(),
        de: 'ia',
        texto: responderConMisDatos(texto, { entradas, personas, grupos }),
        timestamp: ahora,
      };

      setMensajes(prev => [...prev, userMsg, iaMsg]);
    },
    [entradas, personas, grupos]
  );

  /**
   * Limpia el historial del chat
   */
  const limpiar = useCallback(() => {
    setMensajes([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    mensajes,
    send,
    limpiar,
  };
}
