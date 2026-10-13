# 🚀 Segundo Cerebro — Quick Start

## En 3 pasos: pon el chat funcionando

### 1️⃣ API Key de Groq (gratis)

Creá una en https://console.groq.com/keys

### 2️⃣ Cargarla en Vercel

Proyecto `mi-app-estudio` → **Settings → Environment Variables**:

| Variable | Valor |
|---|---|
| `GROQ_API_KEY` | `gsk_...` |
| `VITE_FIREBASE_API_KEY` | La misma que usa el front (ya debería estar) |

Sin prefijo `VITE_` en la key de Groq: todo lo que empieza con `VITE_` se publica en el bundle del navegador.

### 3️⃣ Re-desplegar y usar

- Re-desplegá para que la función tome la variable
- Abrí la app → **Segundo Cerebro** → **Chat**
- Escribí: `"¿Qué noté sobre productividad?"`

---

## Archivos

| Archivo | Propósito |
|---|---|
| `api/cerebro-chat.ts` | Función de Vercel: verifica la sesión y llama a Groq |
| `front/src/lib/cerebro-api.ts` | Cliente: POST a `/api/cerebro-chat` con el token de Firebase |
| `front/src/hooks/useCerebroChat.ts` | Hook del chat (estado, historial, fallback local) |
| `front/src/utils/cerebro-busqueda.ts` | Búsqueda local de notas/personas/grupos relevantes |
| `front/src/components/CerebroChat.tsx` | Componente UI |

---

## Troubleshooting rápido

- **"⚠️ La IA no respondió (Falta GROQ_API_KEY en el servidor)"** → falta la variable en Vercel o no re-desplegaste.
- **"⚠️ La IA no respondió (Error 404)"** → estás en `npm run dev`, que no sirve `/api/cerebro-chat`. Ver `SEGUNDO_CEREBRO_SETUP.md`.
- **Logs** → Vercel → proyecto → **Logs**, filtrá por `/api/cerebro-chat`.

Para más detalles, lee `SEGUNDO_CEREBRO_SETUP.md`.
