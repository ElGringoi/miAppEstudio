# CLAUDE.md — miAppEstudio

Guía para asistentes de IA que trabajen en este proyecto. Leer antes de hacer cambios.

---

## Descripción del Proyecto

**miAppEstudio** es una app de estudio multiplataforma construida con Expo/React Native. Funciona en iOS, Android y Web desde una única base de código TypeScript.

Funcionalidades principales:
- Login con Google OAuth
- Gestión de materias con persistencia local
- Sistema de preguntas (múltiple opción, texto libre, verdadero/falso)
- Creación y almacenamiento de preguntas por materia
- Secciones de apuntes y ejercicios prácticos (aún no implementadas)

**Estado:** Prototipo inicial. Sin backend, sin tests, sin CI/CD.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Expo v53, React Native 0.79.2, React 19 |
| Ruteo | Expo Router v5 (basado en archivos, estilo Next.js) |
| Lenguaje | TypeScript 5.8.3 (modo estricto) |
| Estado global | React Context API (`UsuarioContext`) |
| Almacenamiento | `@react-native-async-storage/async-storage` (solo local) |
| Autenticación | `expo-auth-session` con Google OAuth |
| Navegación | `@react-navigation/bottom-tabs` + `@react-navigation/native` |
| Íconos | `@expo/vector-icons` + `expo-symbols` (según plataforma) |
| Linting | ESLint 9 con `eslint-config-expo` (flat config) |

---

## Estructura del Repositorio

```
miAppEstudio/
├── app/                         # Pantallas — ruteo por archivos con Expo Router
│   ├── _layout.tsx              # Layout raíz; envuelve todo en UsuarioProvider
│   ├── index.tsx                # Punto de entrada; redirige a login o /materias
│   ├── +not-found.tsx           # Pantalla 404
│   ├── (tabs)/                  # Grupo de pestañas inferiores
│   │   ├── _layout.tsx          # Configuración de la barra de pestañas
│   │   ├── LoginScreen.tsx      # Pantalla de login con Google OAuth
│   │   ├── pregunteros.tsx      # Interfaz del cuestionario
│   │   └── MateriasScreen.tsx   # Pantalla de materias deprecada (usar materias/index.tsx)
│   ├── materia/[nombre].tsx     # Pantalla dinámica: detalle de materia por parámetro
│   ├── materias/index.tsx       # Lista de materias con CRUD en AsyncStorage
│   ├── preguntero/nueva.tsx     # Crear nueva pregunta para una materia
│   ├── plantillapreguntas.tsx   # Ver preguntas guardadas por materia
│   ├── apuntes.tsx              # Placeholder de apuntes (no implementado)
│   └── ejerciciospracticos.tsx  # Placeholder de ejercicios (no implementado)
├── components/                  # Componentes reutilizables de UI
│   ├── ui/                      # Wrappers específicos por plataforma
│   │   ├── IconSymbol.tsx       # Ícono multiplataforma (SF Symbols → Material Icons)
│   │   ├── IconSymbol.ios.tsx   # Implementación SF Symbols para iOS
│   │   ├── TabBarBackground.tsx
│   │   └── TabBarBackground.ios.tsx
│   ├── ThemedText.tsx           # Texto con soporte de tema claro/oscuro
│   ├── ThemedView.tsx           # Vista con soporte de tema claro/oscuro
│   ├── Collapsible.tsx          # Sección expandible con animación
│   ├── ExternalLink.tsx         # Abre URLs en el navegador interno
│   ├── HapticTab.tsx            # Pestaña con feedback háptico en iOS
│   ├── HelloWave.tsx            # Componente de animación de saludo
│   └── ParallaxScrollView.tsx   # ScrollView con efecto parallax en el encabezado
├── constants/
│   └── Colors.ts                # Tokens de color para tema claro/oscuro
├── context/
│   └── UsuarioContext.tsx       # Estado global de autenticación (name, email, picture)
├── hooks/
│   ├── useColorScheme.ts        # Detecta el esquema de color del sistema
│   ├── useColorScheme.web.ts    # Override específico para web
│   └── useThemeColor.ts         # Devuelve el color del tema activo desde Colors.ts
├── assets/
│   ├── data/preguntas.json      # Preguntas de ejemplo para el cuestionario (5 entradas)
│   ├── fonts/SpaceMono-Regular.ttf
│   └── images/                  # Íconos y splash screen de la app
├── scripts/
│   └── reset-project.js         # Script interactivo para resetear la app a la plantilla
├── app.json                     # Configuración de Expo
├── package.json
├── tsconfig.json
└── eslint.config.js
```

---

## Comandos de Desarrollo

```bash
npm start                # Inicia el servidor de desarrollo de Expo (escanear QR con Expo Go)
npm run android          # Lanza el emulador de Android
npm run ios              # Lanza el simulador de iOS
npm run web              # Lanza la versión web en el navegador
npm run lint             # Ejecuta ESLint
npm run reset-project    # DESTRUCTIVO: resetea la app a la plantilla en blanco de Expo
```

> No ejecutar `reset-project` salvo que se pida explícitamente — sobreescribe `app/` y `components/`.

---

## Arquitectura y Convenciones Clave

### Ruteo (Expo Router)

Expo Router mapea archivos a rutas automáticamente:
- `app/index.tsx` → `/`
- `app/materias/index.tsx` → `/materias`
- `app/materia/[nombre].tsx` → `/materia/:nombre`
- `app/(tabs)/LoginScreen.tsx` → dentro del navegador de pestañas

Para navegar por código usar `expo-router`:
```ts
import { router } from 'expo-router';
router.replace('/materias');
router.push('/preguntero/nueva');
```

### Flujo de Autenticación

```
app/index.tsx
  → revisa UsuarioContext
  → redirige a LoginScreen si no hay usuario
  → redirige a /materias si está autenticado

LoginScreen.tsx
  → Google OAuth via expo-auth-session
  → al éxito: setUsuario({ name, email, picture })
  → router.replace('/materias')

UsuarioContext.cerrarSesion()
  → limpia el estado del usuario
  → router.replace('/') — vuelve a la lógica de redirección
```

### Estado Global (UsuarioContext)

Ubicado en `context/UsuarioContext.tsx`. Expone:
```ts
interface Usuario {
  name: string;
  email: string;
  picture: string;
}

// Disponible mediante el hook useUsuario()
const { usuario, setUsuario, cerrarSesion } = useUsuario();
```

El `_layout.tsx` raíz envuelve toda la app en `<UsuarioProvider>`.

### Claves de AsyncStorage

| Clave | Contenido |
|---|---|
| `materias` | `string[]` — lista de nombres de materias |
| `preguntas_{materia}` | `Pregunta[]` — preguntas de una materia específica |

Siempre serializar/deserializar con `JSON.stringify` / `JSON.parse`.

### Tipos de Preguntas

Definidos en `assets/data/preguntas.json` y `preguntero/nueva.tsx`:

```ts
type Pregunta =
  | { tipo: 'multiple'; pregunta: string; opciones: string[]; correcta: string }
  | { tipo: 'texto';    pregunta: string; correcta: string }
  | { tipo: 'vf';       pregunta: string; correcta: 'Verdadero' | 'Falso' }
```

### Sistema de Temas

Usar `ThemedText` y `ThemedView` para cualquier contenido en pantalla — manejan claro/oscuro automáticamente. Para colores personalizados:

```ts
import { useThemeColor } from '@/hooks/useThemeColor';
const color = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
```

Los tokens de color están definidos en `constants/Colors.ts`.

### Íconos (Multiplataforma)

Usar `IconSymbol` desde `components/ui/IconSymbol.tsx`:
```tsx
<IconSymbol name="house.fill" size={24} color={color} />
```

Mapea nombres de SF Symbols a Material Icons en Android/Web. Revisar el mapeo en `IconSymbol.tsx` antes de agregar íconos nuevos — si falta alguno, agregarlo ahí.

### Alias de Rutas TypeScript

Usar `@/` como alias raíz (definido en `tsconfig.json`):
```ts
import { ThemedText } from '@/components/ThemedText';
import { useUsuario } from '@/context/UsuarioContext';
```

No usar rutas relativas `../` para importaciones entre directorios.

### Archivos Específicos por Plataforma

Expo resuelve archivos por plataforma automáticamente:
- `IconSymbol.ios.tsx` se carga en iOS; `IconSymbol.tsx` en el resto.
- `useColorScheme.web.ts` se carga en web; `useColorScheme.ts` en el resto.

Seguir este patrón para nueva lógica específica por plataforma.

---

## Estilo de Código

- **Lenguaje:** TypeScript en modo estricto — sin `any`, sin tipos faltantes.
- **Solo componentes funcionales** — no usar componentes de clase.
- **Texto de la UI en español** — los usuarios objetivo son hispanohablantes.
- **Comentarios en español** — mantener consistencia con el código circundante.
- **ESLint:** reglas de `eslint-config-expo`. VSCode corrige automáticamente al guardar. Ejecutar `npm run lint` antes de hacer commit.
- **Sin framework de tests** configurado actualmente. No agregar dependencias de testing sin confirmación.
- **Sin backend ni API** — todos los datos son locales. No introducir peticiones de red sin discutirlo primero.

---

## Problemas Conocidos y Áreas Sensibles

- **El Client ID de Google está hardcodeado** en `LoginScreen.tsx`. No loguearlo ni exponerlo más. Moverlo a variables de entorno si se agrega código del lado servidor.
- `app/(tabs)/MateriasScreen.tsx` es un duplicado deprecado de `app/materias/index.tsx`. Usar siempre el segundo.
- `apuntes.tsx` y `ejerciciospracticos.tsx` son stubs — solo muestran el nombre de la materia. Están incompletos de forma intencional.
- EAS Build no está configurado (`app.json` tiene un ID de proyecto de placeholder).
- No hay manejo de errores para flujos fallidos de Google OAuth.

---

## Convenciones de Git

- **Rama principal:** `main`
- **Ramas de funcionalidades:** nombres descriptivos en kebab-case
- **Mensajes de commit:** en español, estilo informal ("Agrego X", "Corrijo Y", "Actualizo Z")
- Sin formato de commits convencionales (no se usan prefijos `feat:`, `fix:`, etc.)
- Sin hooks de pre-commit

---

## Lo Que No Existe (No Asumir)

- Sin suite de tests (no hay Jest, Vitest ni Testing Library)
- Sin pipeline de CI/CD
- Sin backend, REST API ni base de datos
- Sin sistema de variables de entorno (no se usa `.env`)
- Sin internacionalización (i18n)
- Sin configuración de EAS Build
- Sin Storybook ni catálogo de componentes
