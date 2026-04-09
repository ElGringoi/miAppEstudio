# CLAUDE.md — miAppEstudio

AI assistant guide for this codebase. Read this before making changes.

---

## Project Overview

**miAppEstudio** is a cross-platform study aid app built with Expo/React Native. It supports iOS, Android, and Web from a single TypeScript codebase.

Core features:
- Google OAuth login
- Subject management with local persistence
- Quiz system (multiple choice, text input, true/false)
- Per-subject question creation and storage
- Placeholder sections for notes and practical exercises (not yet implemented)

**Status:** Early-stage prototype. No backend, no tests, no CI/CD.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo v53, React Native 0.79.2, React 19 |
| Routing | Expo Router v5 (file-based, Next.js-style) |
| Language | TypeScript 5.8.3 (strict mode) |
| State | React Context API (`UsuarioContext`) |
| Storage | `@react-native-async-storage/async-storage` (local only) |
| Auth | `expo-auth-session` with Google OAuth |
| Navigation | `@react-navigation/bottom-tabs` + `@react-navigation/native` |
| Icons | `@expo/vector-icons` + `expo-symbols` (platform-aware) |
| Linting | ESLint 9 with `eslint-config-expo` (flat config) |

---

## Repository Structure

```
miAppEstudio/
├── app/                         # Screens — Expo Router file-based routing
│   ├── _layout.tsx              # Root layout; wraps all screens in UsuarioProvider
│   ├── index.tsx                # Entry point; redirects to login or /materias
│   ├── +not-found.tsx           # 404 screen
│   ├── (tabs)/                  # Bottom-tab group
│   │   ├── _layout.tsx          # Tab bar configuration (Home, Explore)
│   │   ├── LoginScreen.tsx      # Google OAuth login screen
│   │   ├── pregunteros.tsx      # Quiz interface
│   │   └── MateriasScreen.tsx   # Deprecated subject screen (use materias/index.tsx)
│   ├── materia/[nombre].tsx     # Dynamic screen: subject detail by name param
│   ├── materias/index.tsx       # Subject list with AsyncStorage CRUD
│   ├── preguntero/nueva.tsx     # Create new question for a subject
│   ├── plantillapreguntas.tsx   # View saved questions by subject
│   ├── apuntes.tsx              # Notes placeholder (not implemented)
│   └── ejerciciospracticos.tsx  # Exercises placeholder (not implemented)
├── components/                  # Reusable UI components
│   ├── ui/                      # Platform-specific wrappers
│   │   ├── IconSymbol.tsx       # Cross-platform icon (SF Symbols → Material Icons)
│   │   ├── IconSymbol.ios.tsx   # iOS-specific SF Symbols implementation
│   │   ├── TabBarBackground.tsx
│   │   └── TabBarBackground.ios.tsx
│   ├── ThemedText.tsx           # Text with light/dark theme support
│   ├── ThemedView.tsx           # View with light/dark theme support
│   ├── Collapsible.tsx          # Expandable section with animation
│   ├── ExternalLink.tsx         # Opens URLs in in-app browser
│   ├── HapticTab.tsx            # Tab button with iOS haptic feedback
│   ├── HelloWave.tsx            # Animated wave component
│   └── ParallaxScrollView.tsx   # Scroll view with parallax header
├── constants/
│   └── Colors.ts                # Light/dark theme color tokens
├── context/
│   └── UsuarioContext.tsx       # Global user auth state (name, email, picture)
├── hooks/
│   ├── useColorScheme.ts        # Detects system color scheme
│   ├── useColorScheme.web.ts    # Web-specific override
│   └── useThemeColor.ts        # Returns themed color value from Colors.ts
├── assets/
│   ├── data/preguntas.json      # Sample quiz questions (5 entries)
│   ├── fonts/SpaceMono-Regular.ttf
│   └── images/                  # App icons and splash images
├── scripts/
│   └── reset-project.js         # Interactive script to reset app to blank template
├── app.json                     # Expo app configuration
├── package.json
├── tsconfig.json
└── eslint.config.js
```

---

## Development Commands

```bash
npm start           # Start Expo dev server (scan QR with Expo Go)
npm run android     # Launch Android emulator
npm run ios         # Launch iOS simulator
npm run web         # Launch web version in browser
npm run lint        # Run ESLint
npm run reset-project  # DESTRUCTIVE: resets app to blank Expo template
```

> Do not run `reset-project` unless explicitly asked — it overwrites `app/` and `components/`.

---

## Architecture & Key Conventions

### Routing (Expo Router)

Expo Router maps files to routes automatically:
- `app/index.tsx` → `/`
- `app/materias/index.tsx` → `/materias`
- `app/materia/[nombre].tsx` → `/materia/:nombre`
- `app/(tabs)/LoginScreen.tsx` → inside tab navigator

To navigate programmatically use `expo-router`:
```ts
import { router } from 'expo-router';
router.replace('/materias');
router.push('/preguntero/nueva');
```

### Authentication Flow

```
app/index.tsx
  → checks UsuarioContext
  → redirects to LoginScreen if no user
  → redirects to /materias if authenticated

LoginScreen.tsx
  → expo-auth-session Google OAuth
  → on success: setUsuario({ name, email, picture })
  → router.replace('/materias')

UsuarioContext.cerrarSesion()
  → clears user state
  → router.replace('/') — returns to redirect logic
```

### Global State (UsuarioContext)

Located at `context/UsuarioContext.tsx`. Provides:
```ts
interface Usuario {
  name: string;
  email: string;
  picture: string;
}

// Available via useUsuario() hook
const { usuario, setUsuario, cerrarSesion } = useUsuario();
```

The root `_layout.tsx` wraps everything in `<UsuarioProvider>`.

### AsyncStorage Keys

| Key | Content |
|---|---|
| `materias` | `string[]` — list of subject names |
| `preguntas_{materia}` | `Pregunta[]` — questions for a given subject |

Always serialize/deserialize with `JSON.stringify` / `JSON.parse`.

### Quiz Question Types

Defined in `assets/data/preguntas.json` and `preguntero/nueva.tsx`:

```ts
type Pregunta =
  | { tipo: 'multiple'; pregunta: string; opciones: string[]; correcta: string }
  | { tipo: 'texto';    pregunta: string; correcta: string }
  | { tipo: 'vf';       pregunta: string; correcta: 'Verdadero' | 'Falso' }
```

### Theme System

Use `ThemedText` and `ThemedView` for any screen content — they handle light/dark automatically. For custom colors:

```ts
import { useThemeColor } from '@/hooks/useThemeColor';
const color = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
```

Color tokens are defined in `constants/Colors.ts`.

### Icons (Cross-Platform)

Use `IconSymbol` from `components/ui/IconSymbol.tsx`:
```tsx
<IconSymbol name="house.fill" size={24} color={color} />
```

It maps SF Symbol names to Material Icons on Android/Web. Check the mapping in `IconSymbol.tsx` before adding new icons — add new entries there if the one you need is missing.

### TypeScript Path Aliases

Use `@/` as the root alias (defined in `tsconfig.json`):
```ts
import { ThemedText } from '@/components/ThemedText';
import { useUsuario } from '@/context/UsuarioContext';
```

Do not use relative `../` paths for cross-directory imports.

### Platform-Specific Files

Expo resolves platform-specific files automatically:
- `IconSymbol.ios.tsx` is loaded on iOS; `IconSymbol.tsx` on all others.
- `useColorScheme.web.ts` is loaded on web; `useColorScheme.ts` on all others.

Follow this pattern for new platform-specific logic.

---

## Code Style

- **Language:** TypeScript strict mode — no `any`, no missing types.
- **Functional components only** — no class components.
- **Language of UI text:** Spanish (the app's target users are Spanish speakers).
- **Language of code/comments:** Spanish comments are acceptable; keep consistent with surrounding code.
- **ESLint:** `eslint-config-expo` rules. VSCode auto-fixes on save. Run `npm run lint` before committing.
- **No test framework** is currently set up. Do not add test dependencies without confirming with the user.
- **No backend or API** — all data is local. Do not introduce network requests without discussion.

---

## Known Issues & Sensitive Areas

- **Google Client ID is hardcoded** in `LoginScreen.tsx`. Do not log or expose it further. Move it to env vars if adding any server-side code.
- `app/(tabs)/MateriasScreen.tsx` is a deprecated duplicate of `app/materias/index.tsx`. Prefer the latter.
- `apuntes.tsx` and `ejerciciospracticos.tsx` are stubs — they only display the subject name. They are intentionally incomplete.
- EAS Build is not configured (`app.json` has a placeholder project ID).
- No error handling exists for failed Google OAuth flows.

---

## Git Conventions

- **Default branch:** `main`
- **Feature branches:** descriptive names in snake-case or kebab-case
- **Commit messages:** Spanish, informal ("Agrego X", "Corrijo Y", "Actualizo Z")
- No conventional commit format in use
- No pre-commit hooks

---

## What Does Not Exist (Do Not Assume)

- No test suite (no Jest, Vitest, or Testing Library)
- No CI/CD pipeline
- No backend, REST API, or database
- No environment variable system (`.env` not used)
- No internationalization (i18n)
- No EAS Build configuration
- No Storybook or component catalog
