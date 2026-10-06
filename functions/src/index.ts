/**
 * Cloud Function: cerebro-chat
 * Procesa mensajes conversacionales usando Claude API
 * Intermediea las llamadas para mantener la API key segura
 */

import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import Anthropic from '@anthropic-ai/sdk';

// Inicializar Firebase Admin
initializeApp();

// Crear cliente de Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

interface ChatRequest {
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  contexto: {
    notas?: Array<{ titulo?: string; contenido: string; tags?: string[]; fecha: string }>;
    personas?: Array<{ nombre: string; tags?: string[]; notas?: string; ultimoContacto?: string }>;
    grupos?: Array<{ nombre: string; tags?: string[]; notas?: string }>;
  };
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Construye el prompt del sistema con el contexto relevante
 */
function buildSystemPrompt(contexto: ChatRequest['contexto']): string {
  const basePrompt = `Eres el Segundo Cerebro de Gastón: un asistente IA personalizado integrado en su app de productividad y estudio tipo RPG.

Tu rol:
- Ayudar a Gastón a buscar, organizar y reflexionar sobre su conocimiento personal
- Responder preguntas sobre sus notas, personas, grupos, tareas y objetivos
- Ser conversacional, amable y directo
- Usar la información que Gastón ha almacenado para dar contexto a tus respuestas

Comunicación:
- Responde siempre en español
- Tono: casual, de colega, no robótico
- Si no encuentras info relevante, dilo claramente: "No encontré referencias específicas, pero..."
- Ofrece síntesis cuando hay mucha información`;

  const partes: string[] = [basePrompt];

  if (contexto.notas?.length) {
    partes.push('## Notas relevantes:\n' + contexto.notas
      .map(n => `- ${n.titulo || '(sin título)'} (${n.fecha})\n  ${n.contenido.slice(0, 150)}...\n  Tags: ${n.tags?.join(', ') || 'ninguno'}`)
      .join('\n'));
  }

  if (contexto.personas?.length) {
    partes.push('## Personas relevantes:\n' + contexto.personas
      .map(p => `- ${p.nombre}${p.ultimoContacto ? ` (último contacto: ${p.ultimoContacto})` : ''}\n  ${p.notas?.slice(0, 100) || ''}\n  Tags: ${p.tags?.join(', ') || 'ninguno'}`)
      .join('\n'));
  }

  if (contexto.grupos?.length) {
    partes.push('## Grupos relevantes:\n' + contexto.grupos
      .map(g => `- ${g.nombre}\n  ${g.notas?.slice(0, 100) || ''}\n  Tags: ${g.tags?.join(', ') || 'ninguno'}`)
      .join('\n'));
  }

  return partes.join('\n\n');
}

/**
 * HTTP Cloud Function: procesa mensajes del Segundo Cerebro
 */
export const cerebroChatFunction = onRequest(
  { region: 'us-central1', memory: '256MB', timeoutSeconds: 30 },
  async (req, res) => {
    // Habilitar CORS para desarrollo local
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      // Verificar método HTTP
      if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
      }

      // Verificar token de autenticación
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const token = authHeader.substring(7);
      let uid: string;
      try {
        const decodedToken = await getAuth().verifyIdToken(token);
        uid = decodedToken.uid;
      } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid token' });
        return;
      }

      // Parsear body
      const body = req.body as ChatRequest;
      if (!body.userMessage) {
        res.status(400).json({ success: false, error: 'userMessage is required' });
        return;
      }

      // Construir prompt del sistema
      const systemPrompt = buildSystemPrompt(body.contexto);

      // Llamar a Claude API
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: body.conversationHistory.map(m => ({
          role: m.role,
          content: m.content,
        })),
      });

      // Extraer texto de la respuesta
      const messageContent = response.content[0];
      if (messageContent.type !== 'text') {
        res.status(500).json({ success: false, error: 'Unexpected response format from Claude' });
        return;
      }

      const message = messageContent.text;

      // Opcional: guardar en Firestore para análisis/historial
      // await saveMessageToFirestore(uid, { user: body.userMessage, ai: message });

      res.json({ success: true, message } as ApiResponse);
    } catch (error) {
      console.error('Error in cerebroChatFunction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: errorMessage } as ApiResponse);
    }
  }
);

/**
 * Función auxiliar para guardar mensajes en Firestore (opcional)
 */
// async function saveMessageToFirestore(uid: string, message: { user: string; ai: string }) {
//   try {
//     const db = getFirestore();
//     await db.collection('usuarios').doc(uid).collection('cerebro_history').add({
//       user: message.user,
//       ai: message.ai,
//       timestamp: new Date(),
//     });
//   } catch (error) {
//     console.warn('Could not save message to Firestore:', error);
//   }
// }
