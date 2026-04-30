# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Descripción del Proyecto

**miAppEstudio** es una app multiplataforma (iOS, Android, Web) construida con Expo/React Native. Es una herramienta personal de productividad y estudio con gamificación.

Módulos principales:
- **Estudio:** materias, pregunteros (quiz), apuntes, ejercicios prácticos
- **Agenda:** eventos del día + hábitos diarios
- **Gym:** rutinas de entrenamiento, registro de ejercicios, cronómetro
- **RPG:** sistema de stats (fuerza, inteligencia, etc.) que sube con hábitos y misiones

**Estado:** Prototipo activo. Sin tests, sin CI/CD, sin backend propio (usa Firebase directamente desde el cliente).

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Expo v53, React Native 0.79.2, React 19 |
| Ruteo | Expo Router v5 (file-based, estilo Next.js) |
| Lenguaje | TypeScript 5.8.3 (modo estricto) |
| Estado global | React Context API (`UsuarioContext`) |
| Auth | Firebase Auth — `signInWithPopup` con `GoogleAuthProvider` |
| Base de datos | Firestore (agenda, gym, rpg) + AsyncStorage (materias, preguntas) |
| Íconos | `@expo/vector-icons` (Ionicons) + `expo-symbols` |
| Linting | ESLint 9 con `eslint-config-expo` |

---

## Comandos de Desarrollo

```bash
npx expo start        # Dev server (escanear QR con Expo Go, o abrir en browser)
npx expo start --web  # Solo web
npm run lint          # ESLint
```

> `npm run reset-project` es destructivo — sobreescribe `app/` y `components/`. No ejecutar salvo pedido explícito.

---

## Arquitectura

### Ruteo (Expo Router)

Archivos en `app/` se mapean a rutas automáticamente:
- `app/index.tsx` → `/` (redirige según auth)
- `app/(tabs)/LoginScreen.tsx` → `/LoginScreen`
- `app/(tabs)/agenda.tsx` → `/agenda`
- `app/(tabs)/gym.tsx` → `/gym`
- `app/(tabs)/rpg.tsx` → `/rpg`
- `app/materias/index.tsx` → `/materias`
- `app/materia/[nombre].tsx` → `/materia/:nombre`

`app/(tabs)/MateriasScreen.tsx` está deprecada — usar siempre `app/materias/index.tsx`.

### Flujo de Autenticación

```
app/index.tsx → revisa UsuarioContext → redirige a /LoginScreen o /materias

LoginScreen.tsx:
  signInWithPopup(auth, new GoogleAuthProvider())
  → UsuarioContext.onAuthStateChanged sincroniza el estado
  → router.replace('/materias')

UsuarioContext.cerrarSesion():
  → signOut(auth) → setUsuario(null) → router.replace('/LoginScreen')
```

`UsuarioContext` (`context/UsuarioContext.tsx`) escucha `onAuthStateChanged` de Firebase Auth y expone `{ usuario, setUsuario, cerrarSesion, loading }`. Está disponible mediante `useUsuario()`.

### Firebase

**Usar siempre `@/lib/firebase`** (no `../../config/firebase` — ese archivo está duplicado y será removido):

```ts
import { auth, db } from '@/lib/firebase';
```

Firestore se usa en agenda, gym y rpg. La estructura de colecciones es por usuario:
- `usuarios/{uid}/eventos` — eventos de agenda
- `usuarios/{uid}/habitos` — hábitos (agenda y rpg)
- `usuarios/{uid}/rutinas` — rutinas de gym
- `usuarios/{uid}/ejercicios` — registros de gym
- `usuarios/{uid}/stats` — stats RPG (`{ fuerza: { xp }, inteligencia: { xp }, ... }`)
- `usuarios/{uid}/misiones` — misiones RPG

AsyncStorage sigue usándose para materias y preguntas:
- `materias` → `string[]`
- `preguntas_{materia}` → `Pregunta[]`

### Sidebar

`components/Sidebar.tsx` es un overlay global con navegación principal. Se monta en `app/_layout.tsx` sobre el `<Slot />`. Se oculta automáticamente en `/LoginScreen` y `/`. El botón ☰ aparece en `position: absolute` arriba a la izquierda.

### Sistema de Preguntas

```ts
type Pregunta =
  | { tipo: 'multiple'; pregunta: string; opciones: string[]; correcta: string }
  | { tipo: 'texto';    pregunta: string; correcta: string }
  | { tipo: 'vf';       pregunta: string; correcta: 'Verdadero' | 'Falso' }
```

### Stats RPG

Las 6 stats son: `fuerza | inteligencia | carisma | agilidad | resistencia | sabiduria`. Cada hábito en RPG tiene una stat asociada; completarlo incrementa el XP de esa stat en Firestore.

### Alias TypeScript

Usar siempre `@/` como alias raíz (definido en `tsconfig.json`). No usar rutas relativas `../` entre directorios.

### Archivos Específicos por Plataforma

Expo resuelve automáticamente:
- `*.ios.tsx` → solo iOS
- `*.web.ts` → solo web
- El archivo sin sufijo → fallback para el resto

---

## Convenciones

- **UI en español**, comentarios en español
- Solo componentes funcionales, TypeScript estricto (evitar `any`)
- Mensajes de commit en español, estilo informal: "Agrego X", "Corrijo Y"
- Sin prefijos convencionales (`feat:`, `fix:`, etc.)
- Rama principal: `main`

---

## Áreas Sensibles

- `config/firebase.ts` y `lib/firebase.ts` son duplicados — el código nuevo usa `@/lib/firebase`. No crear una tercera instancia de Firebase.
- `apuntes.tsx` y `ejerciciospracticos.tsx` son stubs intencionales — aún no implementados.
- EAS Build no está configurado (`app.json` tiene placeholder de proyecto).
- Sin manejo de errores para flujos offline de Firestore.

---

## Lo Que No Existe

- Tests (no hay Jest, Vitest ni Testing Library)
- CI/CD
- Variables de entorno (`.env`)
- Backend propio / REST API
- i18n
- EAS Build configurado
