# 🧠 Segundo Cerebro — Guía de Setup

## Estado: Fase 1 (Chat conversacional con Groq) ✅

Este documento explica cómo configurar y usar el chat del Segundo Cerebro en miAppEstudio.

---

## 📋 Fase 1: Chat conversacional (Texto)

### 1. Obtener API Key de Groq

1. Ve a [Groq Console](https://console.groq.com/keys)
2. Crea una cuenta o inicia sesión
3. **Create API Key** y copiala (formato: `gsk_...`)

El plan gratis alcanza para uso personal.

### 2. Configurar variables en Vercel

Proyecto `mi-app-estudio` → **Settings → Environment Variables**:

| Variable | Obligatoria | Para qué |
|---|---|---|
| `GROQ_API_KEY` | Sí | La usa `api/cerebro-chat.ts` para llamar a Groq |
| `VITE_FIREBASE_API_KEY` | Sí | La función la usa para verificar el token de sesión (ya está para el front) |
| `GROQ_MODEL` | No | Cambia el modelo; por defecto `llama-3.3-70b-versatile` |

⚠️ **Nunca** pongas la key de la IA con prefijo `VITE_`: Vite mete todas las `VITE_*` en el bundle del navegador y quedaría pública.

Después de cargar las variables, re-desplegá (Vercel → Deployments → **Redeploy**).

### 3. En desarrollo local

`npm run dev` sirve el front y `/api/edicion`, pero **no** `/api/cerebro-chat`. El chat igual funciona: cuando la IA no responde, contesta con la búsqueda local y avisa con "⚠️ La IA no respondió".

Para probar la IA en local, usá Vercel CLI, que corre las funciones de `api/`:

```bash
vercel env pull .env.local   # baja las variables del proyecto
vercel dev                   # front + funciones en http://localhost:3000
```

---

## 🎯 Cómo usar el Segundo Cerebro

### Usuario final:

1. Abre la app → **Segundo Cerebro** → **Chat**
2. Escribe una pregunta sobre tus notas, personas o grupos
3. La app:
   - Busca en tus notas/personas/grupos lo relevante (en el navegador)
   - Le manda a la IA la pregunta, ese contexto y los últimos 10 mensajes
   - Si la IA falla, responde solo con lo que encontró la búsqueda local
4. El historial se guarda localmente (localStorage)

### Ejemplos de preguntas:

```
"¿Qué noté sobre productividad?"
"¿Cuáles son los pendientes con Martín?"
"¿Quién es Sofía?"
"¿Qué personas tienen el tag 'familia'?"
"Dame un resumen de mis ideas sobre aprendizaje"
```

---

## 🏗️ Arquitectura

### Cliente (React)

```
CerebroChat.tsx
  ↓ (usa)
useCerebroChat.ts
  ├─ Estado: mensajes, loading
  ├─ buscarRelevantes() (cerebro-busqueda.ts) → top 3 notas/personas/grupos
  ├─ Llama: preguntarAlCerebro()
  │   ↓
  │ cerebro-api.ts → POST /api/cerebro-chat con token de Firebase
  └─ Si falla: responderConMisDatos() (búsqueda local)
```

### Backend (función serverless de Vercel)

```
api/cerebro-chat.ts
  ├─ Verifica el ID token de Firebase (Identity Toolkit)
  ├─ Limpia el historial (máx. 10 mensajes, 4000 caracteres c/u)
  ├─ Construye el prompt del sistema con el contexto
  ├─ Llama a Groq con GROQ_API_KEY
  └─ Retorna { success, message } al cliente
```

### Persistencia

```
localStorage: cerebro_chat_history
  ├─ Almacena historial localmente
  └─ Se sincronizará a Firestore en Fase 2
```

---

## 🔐 Seguridad

✅ **API Key segura:**
- La key de Groq vive SOLO en las variables de entorno de Vercel
- El cliente NUNCA la ve: no tiene prefijo `VITE_`

✅ **Autenticación:**
- Cada llamada requiere el ID token de Firebase Auth (`Authorization: Bearer ...`)
- Se valida en la función antes de llamar a Groq

---

## 📊 Búsqueda de contexto

`buscarRelevantes()` en `front/src/utils/cerebro-busqueda.ts` puntúa por **palabras clave simples**:

```ts
// El usuario pregunta: "¿Qué noté sobre productividad?"
// Se extrae: ["productividad"]

// Se busca en:
// - Títulos y contenido de notas
// - Tags de notas/personas/grupos
// - Nombres de personas
// - Notas de personas/grupos

// Retorna top 3 coincidencias de cada tipo
```

**En Fase 2**, mejoraremos esto con **embeddings** (similitud semántica).

---

## 🐛 Debugging

### Ver logs de la función:

Vercel → proyecto `mi-app-estudio` → **Logs**, filtrá por `/api/cerebro-chat`.

### En el navegador:

- Abre DevTools → Console
- Los errores aparecen como:
  ```
  Error en useCerebroChat: ...
  ```

### Revisar historial guardado:

```js
// En console del navegador:
JSON.parse(localStorage.getItem('cerebro_chat_history'))
```

---

## 📝 Próximos pasos

### Fase 2 — Multimodal (Cámara + Voz):

- [ ] Componente `CameraCapture.tsx` para capturar fotos
- [ ] Web Speech API para grabar voz (speech-to-text)
- [ ] Modelo con visión para las fotos
- [ ] Text-to-Speech para respuestas en voz
- [ ] Modal de cámara + grabador en `CerebroChat`

### Mejoras futuras:

- [ ] Sincronizar historial a Firestore
- [ ] Embeddings para búsqueda semántica
- [ ] Personalización del sistema prompt
- [ ] Reacciones a mensajes (like/dislike)
- [ ] Exportar conversaciones

---

## ⚠️ Troubleshooting

El chat muestra el motivo entre paréntesis: "⚠️ La IA no respondió (motivo)".

### "Falta GROQ_API_KEY en el servidor"

- Cargá `GROQ_API_KEY` en Vercel y re-desplegá

### "Unauthorized" / "Invalid token"

- Verifica que estés logueado en la app (Firebase Auth)
- Revisa que `VITE_FIREBASE_API_KEY` esté cargada en Vercel

### "Error 404" en local

- `npm run dev` no sirve `/api/cerebro-chat`; usá `vercel dev` (ver arriba)

---

## 📚 Referencias

- [Groq API Docs](https://console.groq.com/docs)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

**Última actualización:** 2026-10-13
