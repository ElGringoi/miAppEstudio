# Patrones de animación por stack

Consultar este archivo cuando la auditoría detecte oportunidades de animación y el usuario pida ejemplos concretos, o al aplicar cambios que incluyan microinteracciones.

## React Native + Expo (stack principal de Gastón)

### Feedback de tap en botones

Opción 1 — `Pressable` con estado (simple, sin librerías):

```tsx
<Pressable
  onPress={handlePress}
  style={({ pressed }) => [
    styles.button,
    { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
  ]}
>
  <Text style={styles.label}>Guardar</Text>
</Pressable>
```

Opción 2 — `react-native-reanimated` (más fluido, permite spring):

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const scale = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

<Animated.View style={animatedStyle}>
  <Pressable
    onPressIn={() => (scale.value = withSpring(0.96))}
    onPressOut={() => (scale.value = withSpring(1))}
    ...
  />
</Animated.View>
```

### Entrada de lista con stagger

Con reanimated v3, `FadeInDown.delay(index * 50)` aplicado a cada item de un `FlatList`/`map`:

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated';

{tasks.map((task, i) => (
  <Animated.View
    key={task.id}
    entering={FadeInDown.delay(i * 50).springify()}
  >
    <TaskCard task={task} />
  </Animated.View>
))}
```

### Skeleton de carga

Mientras Firebase devuelve datos, en vez de spinner mostrar la silueta del contenido con pulso:

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

const opacity = useSharedValue(0.4);
useEffect(() => {
  opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
}, []);
```

### Modal / Bottom sheet

Usar `Modal` de RN con `animationType="slide"` o — mejor — `@gorhom/bottom-sheet` para sheets con snap points y gestos.

### Transiciones entre pantallas

Si usa React Navigation, ya trae transiciones por defecto. Para compartir elementos entre pantallas (shared element transitions), usar `react-native-reanimated` v3 + `react-native-screens`.

## React web (Firebase + React en Faculty Manager web / app educativa)

### Feedback de hover y tap

CSS transitions son suficientes para el 80% de casos:

```css
.button {
  transition: transform 150ms ease, background-color 150ms ease;
}
.button:hover { background-color: var(--primary-hover); }
.button:active { transform: scale(0.98); }
```

### Framer Motion para cosas más ricas

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.25 }}
>
  {content}
</motion.div>
```

Para listas con stagger:

```tsx
<motion.ul
  initial="hidden"
  animate="visible"
  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
>
  {items.map(item => (
    <motion.li key={item.id} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

### AnimatePresence para salida

Cuando un elemento desaparece (ej: completar una tarea del preguntero), envolver con `AnimatePresence` para que anime al salir, no solo al entrar.

## HTML/CSS puro (artifacts, ejercicios de cátedra)

### Keyframes para animaciones independientes

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.card { animation: fadeInUp 300ms ease-out both; }
```

### `prefers-reduced-motion`

Siempre respetar la preferencia del sistema — es accesibilidad real:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Curvas de ease recomendadas

- **`ease-out`** (o equivalente spring) — default para entrada de elementos. Arranca rápido, se frena. Se siente natural.
- **`ease-in`** — para salidas (el elemento acelera al irse).
- **`ease-in-out`** — para cambios de estado donde el elemento permanece (expandir/contraer un acordeón).
- **`cubic-bezier(0.16, 1, 0.3, 1)`** — "ease-out-expo", muy usada en iOS, se siente premium.
- **Evitar** `linear` para casi todo menos progress bars y loops infinitos.

## Duraciones de referencia

| Tipo | Duración |
|---|---|
| Hover, tap, toggle | 100–150ms |
| Aparición de elementos pequeños | 200–300ms |
| Transición de pantalla / modal | 300–400ms |
| Stagger entre items de lista | 30–60ms de delay |

Por encima de ~500ms la app se siente lenta. Por debajo de ~100ms el usuario casi no percibe la animación.
