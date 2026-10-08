/**
 * Hook personalizado para manejar la lógica del chat del Segundo Cerebro.
 * Pregunta a la IA (Groq, vía /api/cerebro-chat) con el contexto relevante
 * de notas, personas y grupos. Si la IA falla, responde con la búsqueda local.
 */

import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage, FSEntradaDiario, FSPersona, FSGrupo } from '../types';
import { buscarRelevantes, responderConMisDatos } from '../utils/cerebro-busqueda';
import { preguntarAlCerebro } from '../lib/cerebro-api';

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
  const [loading, setLoading] = useState(false);

  // Guardar historial en localStorage cada vez que cambia
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mensajes));
    } catch (e) {
      console.warn('No se pudo guardar historial:', e);
    }
  }, [mensajes]);

  /**
   * Envía la pregunta a la IA y agrega la respuesta al historial
   */
  const send = useCallback(
    async (userMessage: string) => {
      const texto = userMessage.trim();
      if (!texto || loading) return;

      const datos = { entradas, personas, grupos };
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        de: 'user',
        texto,
        timestamp: new Date().toISOString(),
      };

      // Historial reciente, sin el mensaje actual (el backend lo agrega)
      const historial = mensajes.slice(-10).map(m => ({
        role: (m.de === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.texto,
      }));

      setMensajes(prev => [...prev, userMsg]);
      setLoading(true);

      let respuesta: string;
      try {
        const relevantes = buscarRelevantes(texto, datos);
        respuesta = await preguntarAlCerebro({
          userMessage: texto,
          conversationHistory: historial,
          contexto: relevantes,
        });
      } catch (err) {
        const motivo = err instanceof Error ? err.message : 'error desconocido';
        console.error('Error en useCerebroChat:', err);
        respuesta =
          `⚠️ La IA no respondió (${motivo}). Esto es lo que encontré en tus datos:\n\n` +
          responderConMisDatos(texto, datos);
      } finally {
        setLoading(false);
      }

      const iaMsg: ChatMessage = {
        id: crypto.randomUUID(),
        de: 'ia',
        texto: respuesta,
        timestamp: new Date().toISOString(),
      };
      setMensajes(prev => [...prev, iaMsg]);
    },
    [mensajes, entradas, personas, grupos, loading]
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
    loading,
    send,
    limpiar,
  };
}
