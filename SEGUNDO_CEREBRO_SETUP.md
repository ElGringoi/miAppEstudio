# 🧠 Segundo Cerebro Multimodal — Guía de Setup

## Estado: Fase 1 (Chat conversacional con Claude API) ✅

Este documento explica cómo configurar y usar el Segundo Cerebro en miAppEstudio.

---

## 📋 Fase 1: Chat conversacional (Texto)

### 1. Obtener API Key de Claude

1. Ve a [Anthropic Console](https://console.anthropic.com)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** → **Create key**
4. Copia la clave (formato: `sk-ant-...`)

### 2. Configurar variables de entorno

#### En desarrollo local:

```bash
# Copia el archivo de ejemplo
cp .env.local.example .env.local

# Edita .env.local y agrega:
VITE_CLAUDE_API_KEY=sk-ant-xxx...
```

#### En la Cloud Function (Firebase):

La API Key debe estar configurada como variable de entorno de Firebase Functions:

```bash
# Si tienes Firebase CLI instalado:
firebase functions:config:set claude.api_key="sk-ant-xxx..."

# O edita en: Firebase Console → Project Settings → Cloud Functions → Runtime environment variables
```

### 3. Instalar dependencias de Cloud Function

```bash
cd functions
npm install
```

### 4. Desplegar Cloud Function

```bash
# Build
npm run build

# Deploy (requiere autenticación con Firebase CLI)
firebase deploy --only functions

# Ver logs
firebase functions:log
```

### 5. En desarrollo local (opcional)

Si quieres testear la Cloud Function localmente:

```bash
# En una terminal:
firebase emulators:start --only functions

# La Cloud Function estará en:
# http://localhost:5001/PROJECT_ID/us-central1/cerebroChatFunction
```

---

## 🎯 Cómo usar el Segundo Cerebro

### Usuario final:

1. Abre la app → **Segundo Cerebro** → **Chat**
2. Escribe una pregunta sobre tus notas, personas o grupos
3. El IA:
   - Extrae contexto relevante automáticamente
   - Busca en tus notas/personas/grupos
   - Responde basándose en tu base de conocimiento
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
useCerebroChat.ts (hook custom)
  ├─ Estado: mensajes, loading, error
  ├─ Extrae contexto: palabras clave → notas/personas/grupos
  └─ Llama: callCerebroChatFunction()
    ↓
claude-client.ts
  └─ Llama Cloud Function con token autenticado
```

### Backend (Firebase Cloud Function)

```
cerebroChatFunction (HTTP endpoint)
  ├─ Verifica token de autenticación
  ├─ Construye prompt del sistema con contexto
  ├─ Llama Claude API
  └─ Retorna respuesta al cliente
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
- La API Key de Claude está SOLO en la Cloud Function (backend)
- El cliente NUNCA ve ni expone la API Key
- Todas las llamadas se autentican con token de Firebase

✅ **Autenticación:**
- Cada llamada a la Cloud Function requiere token de Firebase Auth
- Se valida en backend antes de procesar

---

## 📊 Búsqueda de contexto

El hook `useCerebroChat` extrae contexto usando **palabras clave simples**:

```ts
// El usuario pregunta: "¿Qué noté sobre productividad?"
// Se extrae: ["productividad"]

// Se busca en:
// - Títulos de notas
// - Contenido de notas
// - Tags de notas/personas/grupos
// - Nombres de personas
// - Notas de personas/grupos

// Retorna top 3 coincidencias de cada tipo
```

**En Fase 2**, mejoraremos esto con **embeddings** (similitud semántica).

---

## 🐛 Debugging

### Ver logs de Cloud Function:

```bash
firebase functions:log
```

### En desarrollo local:

- Abre DevTools → Console
- Los errores de la Cloud Function aparecerán como:
  ```
  Error calling cerebro-chat function: ...
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
- [ ] Integración con Claude Vision API
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

### "CLAUDE_API_KEY not set"

- Verifica que `VITE_CLAUDE_API_KEY` está en `.env.local`
- O que las variables de entorno de Firebase Functions están configuradas

### "Unauthorized" en la Cloud Function

- Verifica que estés logueado en la app (Firebase Auth)
- Revisa que el token de autenticación se envía correctamente

### "No cloud function found"

- ¿Desplegaste las functions? `firebase deploy --only functions`
- ¿Está correcta la URL en `VITE_CLOUD_FUNCTION_URL`?

---

## 📚 Referencias

- [Anthropic API Docs](https://docs.anthropic.com)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

**Última actualización:** 2026-10-06
