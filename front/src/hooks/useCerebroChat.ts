/**
 * Hook personalizado para manejar la lógica del chat del Segundo Cerebro
 * Gestiona estado de mensajes, historial, y extracción de contexto
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ContextoCerebro, FSEntradaDiario, FSPersona, FSGrupo } from '../types';
import { CEREBRO_SYSTEM_PROMPT, buildContextoPrompt, buildUserPrompt } from '../utils/cerebro-prompts';
import { callCerebroChatFunction } from '../lib/claude-client';

const STORAGE_KEY = 'cerebro_chat_history';

interface UseCerebroChatOptions {
  entradas: FSEntradaDiario[];
  personas: FSPersona[];
  grupos: FSGrupo[];
}

export function useCerebroChat(options: UseCerebroChatOptions) {
  const { entradas, personas, grupos } = options;
  const [mensajes, setMensajes] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Cargar historial del localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMensajes(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('No se pudo cargar historial del chat:', e);
    }
  }, []);

  // Guardar historial en localStorage cada vez que cambia
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mensajes));
    } catch (e) {
      console.warn('No se pudo guardar historial:', e);
    }
  }, [mensajes]);

  /**
   * Extrae contexto relevante basándose en palabras clave del mensaje
   */
  const extraerContexto = useCallback(
    (query: string): ContextoCerebro => {
      const queryLower = query.toLowerCase();
      const palabrasClave = query.split(/\s+/).filter(p => p.length > 3);

      // Búsqueda simple: coincide en tags, título, contenido, nombre
      const notasRelevantes = entradas.filter(e => {
        const buscar = [
          e.titulo?.toLowerCase() || '',
          e.contenido.toLowerCase(),
          e.tags?.map(t => t.toLowerCase()).join(' ') || '',
        ].join(' ');
        return palabrasClave.some(kw => buscar.includes(kw));
      }).slice(0, 3);

      const personasRelevantes = personas
        .filter(p => {
          const buscar = [
            p.nombre.toLowerCase(),
            p.apodo?.toLowerCase() || '',
            p.tags?.map(t => t.toLowerCase()).join(' ') || '',
            p.notas?.toLowerCase() || '',
          ].join(' ');
          return palabrasClave.some(kw => buscar.includes(kw));
        })
        .slice(0, 3)
        .map(p => ({
          nombre: p.nombre,
          tags: p.tags,
          notas: p.notas,
          ultimoContacto: p.ultimoContacto,
        }));

      const gruposRelevantes = grupos
        .filter(g => {
          const buscar = [
            g.nombre.toLowerCase(),
            g.tags?.map(t => t.toLowerCase()).join(' ') || '',
            g.notas?.toLowerCase() || '',
          ].join(' ');
          return palabrasClave.some(kw => buscar.includes(kw));
        })
        .slice(0, 3)
        .map(g => ({
          nombre: g.nombre,
          tags: g.tags,
          notas: g.notas,
        }));

      return {
        notas: notasRelevantes.length > 0 ? notasRelevantes : undefined,
        personas: personasRelevantes.length > 0 ? personasRelevantes : undefined,
        grupos: gruposRelevantes.length > 0 ? gruposRelevantes : undefined,
      };
    },
    [entradas, personas, grupos]
  );

  /**
   * Envía un mensaje y obtiene respuesta de Claude
   */
  const send = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return;

      setError(null);
      setLoading(true);

      try {
        // Agregar mensaje del usuario
        const userMsgId = crypto.randomUUID();
        const userMsg: ChatMessage = {
          id: userMsgId,
          de: 'user',
          texto: userMessage.trim(),
          timestamp: new Date().toISOString(),
        };

        if (!mountedRef.current) return;
        setMensajes(prev => [...prev, userMsg]);

        // Extraer contexto relevante
        const contexto = extraerContexto(userMessage);
        const contextoStr = buildContextoPrompt(contexto);

        // Preparar historial para Claude (últimos 5 intercambios)
        const historialReciente = mensajes
          .slice(-10)
          .map(m => ({
            role: (m.de === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.texto,
          }));

        // Agregar el nuevo mensaje del usuario
        historialReciente.push({ role: 'user', content: userMessage.trim() });

        // Llamar a la Cloud Function
        const response = await callCerebroChatFunction({
          userMessage: userMessage.trim(),
          conversationHistory: historialReciente,
          contexto,
        });

        if (!mountedRef.current) return;

        // Agregar respuesta de IA
        const iaMsgId = crypto.randomUUID();
        const iaMsg: ChatMessage = {
          id: iaMsgId,
          de: 'ia',
          texto: response,
          timestamp: new Date().toISOString(),
        };

        setMensajes(prev => [...prev, iaMsg]);
      } catch (err) {
        if (!mountedRef.current) return;
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        console.error('Error en useCerebroChat:', err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [mensajes, extraerContexto]
  );

  /**
   * Limpia el historial del chat
   */
  const limpiar = useCallback(() => {
    setMensajes([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    mensajes,
    loading,
    error,
    send,
    limpiar,
    systemPrompt: CEREBRO_SYSTEM_PROMPT,
  };
}
