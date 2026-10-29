/**
 * Función serverless de Vercel: intermedia el chat del Segundo Cerebro con Groq.
 * - Verifica que quien llama tenga sesión iniciada (token de Firebase Auth)
 * - Si ALLOWED_UIDS está definida, solo atiende a esos uids
 * - Limita pedidos por minuto y el tamaño del body
 * - Llama a Groq con la key guardada en el servidor (GROQ_API_KEY), nunca expuesta al cliente
 */

import {
  MAX_BODY_CARACTERES, crearLimitador, largoBody, limitarContexto, uidPermitido, uidsPermitidos,
} from '../server/cerebro/limites.js';

// Tipos mínimos del request/response de Vercel (evita agregar dependencias)
interface RequestLike {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ResponseLike {
  status(code: number): ResponseLike;
  json(body: unknown): void;
}

type Mensaje = { role: 'user' | 'assistant'; content: string };

interface ChatRequest {
  userMessage: string;
  conversationHistory: Mensaje[];
  contexto: {
    notas?: Array<{ titulo?: string; contenido: string; tags?: string[]; fecha: string }>;
    personas?: Array<{ nombre: string; tags?: string[]; notas?: string; ultimoContacto?: string }>;
    grupos?: Array<{ nombre: string; tags?: string[]; notas?: string }>;
  };
}

const MAX_MENSAJES_HISTORIAL = 10;
const MAX_CARACTERES_MENSAJE = 4000;

const puedePedir = crearLimitador();

/**
 * Verifica el ID token de Firebase con el endpoint REST de Identity Toolkit y
 * devuelve el uid de su dueño (null si el token no es válido). La API key es la
 * del proyecto, así que un token de otro proyecto no pasa.
 */
async function uidDelToken(idToken: string): Promise<string | null> {
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('Falta VITE_FIREBASE_API_KEY en el servidor');

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as { users?: Array<{ localId?: string }> } | null;
  return data?.users?.[0]?.localId ?? null;
}

/** Prompt del sistema con el contexto relevante (notas, personas y grupos) */
function buildSystemPrompt(contexto: ChatRequest['contexto']): string {
  const partes: string[] = [`Eres el Segundo Cerebro de Gastón: un asistente personal integrado en su app de productividad y estudio.

Tu rol:
- Ayudar a Gastón a buscar, organizar y reflexionar sobre su conocimiento personal
- Responder usando SOLO la información de contexto que se te da; si no alcanza, decilo

Comunicación:
- Responde siempre en español rioplatense (vos)
- Tono casual y directo, de colega
- Sé breve; ofrecé síntesis cuando hay mucha información`];

  if (contexto.notas?.length) {
    partes.push('## Notas relevantes:\n' + contexto.notas
      .map(n => `- ${n.titulo || '(sin título)'} (${n.fecha})\n  ${n.contenido.slice(0, 500)}\n  Tags: ${n.tags?.join(', ') || 'ninguno'}`)
      .join('\n'));
  }

  if (contexto.personas?.length) {
    partes.push('## Personas relevantes:\n' + contexto.personas
      .map(p => `- ${p.nombre}${p.ultimoContacto ? ` (último contacto: ${p.ultimoContacto})` : ''}\n  ${p.notas?.slice(0, 300) || ''}\n  Tags: ${p.tags?.join(', ') || 'ninguno'}`)
      .join('\n'));
  }

  if (contexto.grupos?.length) {
    partes.push('## Grupos relevantes:\n' + contexto.grupos
      .map(g => `- ${g.nombre}\n  ${g.notas?.slice(0, 300) || ''}\n  Tags: ${g.tags?.join(', ') || 'ninguno'}`)
      .join('\n'));
  }

  return partes.join('\n\n');
}

/** Sanitiza el historial: solo mensajes válidos, recortados, y que arranque con el usuario */
function limpiarHistorial(historial: unknown): Mensaje[] {
  if (!Array.isArray(historial)) return [];

  const validos = historial
    .filter((m): m is Mensaje =>
      typeof m?.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CARACTERES_MENSAJE) }))
    .slice(-MAX_MENSAJES_HISTORIAL);

  const primerUsuario = validos.findIndex(m => m.role === 'user');
  return primerUsuario === -1 ? [] : validos.slice(primerUsuario);
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const uid = await uidDelToken(token);
    if (!uid) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const permitidos = uidsPermitidos(process.env.ALLOWED_UIDS);
    if (!permitidos) console.warn('[cerebro-chat] ALLOWED_UIDS sin definir: atiende a cualquier usuario con sesión');
    if (!uidPermitido(uid, permitidos)) {
      return res.status(403).json({ success: false, error: 'Este chat es privado' });
    }

    if (!puedePedir(uid)) {
      return res.status(429).json({ success: false, error: 'Demasiados pedidos seguidos. Esperá un minuto.' });
    }

    if (largoBody(req.body) > MAX_BODY_CARACTERES) {
      return res.status(413).json({ success: false, error: 'El pedido es demasiado grande' });
    }

    const body = (req.body ?? {}) as Partial<ChatRequest>;
    const userMessage = typeof body.userMessage === 'string' ? body.userMessage.trim() : '';
    if (!userMessage) {
      return res.status(400).json({ success: false, error: 'userMessage is required' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(500).json({ success: false, error: 'Falta GROQ_API_KEY en el servidor' });
    }

    // El historial llega SIN el mensaje actual; lo agregamos al final
    const mensajes: Mensaje[] = [
      ...limpiarHistorial(body.conversationHistory),
      { role: 'user', content: userMessage.slice(0, MAX_CARACTERES_MENSAJE) },
    ];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        max_completion_tokens: 1024,
        temperature: 0.4,
        messages: [
          { role: 'system', content: buildSystemPrompt(limitarContexto(body.contexto)) },
          ...mensajes,
        ],
      }),
    });

    const data = (await groqRes.json().catch(() => null)) as
      | { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
      | null;

    if (!groqRes.ok) {
      return res.status(502).json({
        success: false,
        error: data?.error?.message || `Groq respondió ${groqRes.status}`,
      });
    }

    const message = data?.choices?.[0]?.message?.content;
    if (!message) {
      return res.status(502).json({ success: false, error: 'Respuesta vacía de Groq' });
    }

    return res.status(200).json({ success: true, message });
  } catch (error) {
    console.error('Error en cerebro-chat:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ success: false, error: msg });
  }
}
