# 🚀 Segundo Cerebro — Quick Start

## En 5 minutos: Pon el chat funcionando

### 1️⃣ API Key

```bash
# Obtén una de https://console.anthropic.com/api-keys
# Copia a .env.local:
VITE_CLAUDE_API_KEY=sk-ant-xxxxx...
```

### 2️⃣ Dependencias de Cloud Function

```bash
cd functions
npm install
npm run build
```

### 3️⃣ Desplegar Functions

```bash
# Requiere: firebase CLI + autenticación
firebase deploy --only functions
```

### 4️⃣ Configurar variables en Firebase

```bash
firebase functions:config:set claude.api_key="sk-ant-xxxxx..."
```

### 5️⃣ Usar

- Abre la app → **Segundo Cerebro** → **Chat**
- Escribe: `"¿Qué noté sobre productividad?"`
- 💬 El IA responde basándose en tus notas/personas/grupos

---

## Archivos creados

| Archivo | Propósito |
|---|---|
| `front/src/types.ts` | `ChatMessage`, `ContextoCerebro` |
| `front/src/utils/cerebro-prompts.ts` | Prompts del sistema |
| `front/src/lib/claude-client.ts` | Cliente para Cloud Function |
| `front/src/hooks/useCerebroChat.ts` | Hook del chat (estado + lógica) |
| `front/src/components/CerebroChat.tsx` | Componente UI |
| `functions/src/index.ts` | Cloud Function (backend) |
| `functions/package.json` | Dependencias de functions |
| `.env.local.example` | Template de variables |
| `firebase.json` | Config de Firebase + hosting |

---

## Estado actual

✅ **Texto**: Chat conversacional
⏳ **Fase 2**: Cámara + micrófono (próximo)

---

## Troubleshooting rápido

```bash
# Ver logs
firebase functions:log

# Verificar config
firebase functions:config:get

# Re-desplegar
firebase deploy --only functions
```

Para más detalles, lee `SEGUNDO_CEREBRO_SETUP.md`.
