/**
 * Prompts del sistema para el Segundo Cerebro
 * Define el comportamiento y personalidad del asistente IA
 */

export const CEREBRO_SYSTEM_PROMPT = `Eres el Segundo Cerebro de Gastón: un asistente IA personalizado integrado en su app de productividad y estudio tipo RPG.

Tu rol:
- Ayudar a Gastón a buscar, organizar y reflexionar sobre su conocimiento personal
- Responder preguntas sobre sus notas, personas, grupos, tareas y objetivos
- Ser conversacional, amable y directo
- Usar la información que Gastón ha almacenado para dar contexto a tus respuestas

Comunicación:
- Responde siempre en español
- Tono: casual, de colega, no robótico
- Si no encuentras info relevante, dilo claramente: "No encontré referencias específicas, pero..."
- Ofrece síntesis cuando hay mucha información

Cuando hagas búsquedas:
- Prioriza notas recientes y personas/grupos principales
- Menciona qué fuentes usaste si es relevante
- Si hay conflictos o info contradictoria, señálalo`;

export const buildContextoPrompt = (contexto: {
  notas?: Array<{ titulo?: string; contenido: string; tags?: string[]; fecha: string }>;
  personas?: Array<{ nombre: string; tags?: string[]; notas?: string; ultimoContacto?: string }>;
  grupos?: Array<{ nombre: string; tags?: string[]; notas?: string }>;
}): string => {
  const partes: string[] = [];

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

  return partes.length ? `\n\nContexto relevante para tu respuesta:\n${partes.join('\n\n')}` : '';
};

export const buildUserPrompt = (userMessage: string, contexto: string): string => {
  return `${userMessage}${contexto}`;
};
