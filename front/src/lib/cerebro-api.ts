/**
 * Cliente del chat del Segundo Cerebro: llama a la función serverless /api/cerebro-chat
 * con el token de la sesión de Firebase. La key de Groq nunca sale del servidor.
 */

import { auth } from './firebase';

export interface ContextoChat {
  notas?: Array<{ titulo?: string; contenido: string; tags?: string[]; fecha: string }>;
  personas?: Array<{ nombre: string; tags?: string[]; notas?: string; ultimoContacto?: string }>;
  grupos?: Array<{ nombre: string; tags?: string[]; notas?: string }>;
}

export interface ChatRequest {
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  contexto: ContextoChat;
}

export async function preguntarAlCerebro(request: ChatRequest): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Iniciá sesión para usar el chat');

  const token = await user.getIdToken();
  const res = await fetch('/api/cerebro-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const data = (await res.json().catch(() => null)) as
    | { success: boolean; message?: string; error?: string }
    | null;

  if (!res.ok || !data?.success || !data.message) {
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return data.message;
}
