/**
 * Cliente para comunicarse con la Cloud Function de Claude
 * Encapsula la lógica de llamadas a la API del Segundo Cerebro
 */

export interface ChatRequest {
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  contexto: {
    notas?: Array<{ titulo?: string; contenido: string; tags?: string[]; fecha: string }>;
    personas?: Array<{ nombre: string; tags?: string[]; notas?: string; ultimoContacto?: string }>;
    grupos?: Array<{ nombre: string; tags?: string[]; notas?: string }>;
  };
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Llama a la Cloud Function `cerebro-chat` para procesar un mensaje
 * La función devuelve la respuesta de Claude
 */
export async function callCerebroChatFunction(request: ChatRequest): Promise<string> {
  try {
    // Primero, obtén el token del usuario autenticado
    const currentUser = (await import('firebase/auth')).getAuth().currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    const token = await currentUser.getIdToken();

    // Llamada a la Cloud Function
    // En desarrollo: http://localhost:5001/PROJECT_ID/us-central1/cerebro-chat
    // En producción: será desplegada automáticamente por Firebase
    const response = await fetch(
      `${import.meta.env.VITE_CLOUD_FUNCTION_URL || '/api/cerebro-chat'}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      }
    );

    const data = (await response.json()) as ChatResponse;

    if (!data.success) {
      throw new Error(data.error || 'Unknown error from Claude API');
    }

    return data.message || '';
  } catch (error) {
    console.error('Error calling cerebro-chat function:', error);
    throw error;
  }
}

/**
 * Alternativa: cliente directo sin Cloud Function (NO RECOMENDADO en producción)
 * Solo para desarrollo rápido si quieres exponer la API key
 */
export async function callClaudeDirectly(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_CLAUDE_API_KEY not set');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  interface MessageResponse {
    content: Array<{ type: string; text: string }>;
    error?: { message: string };
  }

  const data = (await response.json()) as MessageResponse;

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `API error: ${response.statusText}`);
  }

  return data.content[0]?.text || '';
}
