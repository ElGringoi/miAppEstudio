---
name: ui-ux-design-review
description: Audita y mejora el diseño visual, UX y UI de interfaces en React, React Native/Expo, HTML/CSS y artifacts. Úsala siempre que el usuario comparta un componente, pantalla o archivo de estilos y pida feedback de diseño, mencione que algo no se ve bien, pida mejorar el diseño, hacerlo más lindo, profesional o moderno, o cuando comparta una captura o código y hable de colores, tipografía, espaciado, animaciones, accesibilidad o consistencia visual. También activar proactivamente cuando el usuario comparta código de UI sin tema específico pero con señales de que está iterando sobre el look and feel (ajustes de estilos, dudas sobre paleta, preguntas sobre si algo se ve raro). Flujo de tres pasos — auditar primero, mostrar reporte estructurado, aplicar cambios solo con aprobación explícita.
---

# UI/UX Design Review

Esta skill convierte a Claude en un revisor de diseño que audita interfaces y propone mejoras concretas antes de tocar código. El foco está en **paleta única y coherente, jerarquía visual, espaciado, microinteracciones y accesibilidad** — los cinco pilares que más impacto tienen en la percepción de calidad de una app.

## Cuándo activar

Activá la skill cuando se cumpla cualquiera de estos casos:

- El usuario comparte código de UI (JSX, TSX, StyleSheet, CSS, Tailwind, styled-components) y pide feedback.
- Menciona palabras como "diseño", "UI", "UX", "look", "estética", "se ve feo/raro/aburrido", "moderno", "profesional", "paleta", "colores", "animaciones".
- Pide "mejorar", "pulir", "refinar" una pantalla o componente.
- Comparte una captura de pantalla de su app y habla de cómo mejorarla.
- Está trabajando en Faculty Manager, apps educativas, pastelería, o cualquier proyecto suyo donde la UI sea protagonista.

## Flujo de trabajo

El flujo es **siempre el mismo**: auditar → reportar → aprobar → aplicar. No saltear pasos, incluso si el usuario parece apurado — la aprobación explícita evita que rompas un diseño que ya funciona.

### 1. Auditar

Antes de escribir una sola línea de código nuevo, leé lo que te pasaron y detectá problemas en estos ejes. Si algo no aplica a ese fragmento, saltearlo sin forzar.

**Paleta de colores**
- Contar cuántos colores distintos aparecen. Si hay más de ~5 tonos sin sistema, es una señal de alerta.
- Detectar colores "sueltos" (hex hardcodeados repartidos por el archivo) que deberían vivir en un objeto `colors` o variables CSS.
- Verificar que haya una lógica: primario, secundario, neutro (fondos/textos), semánticos (éxito/error/warning).
- Contraste: texto sobre fondo debería cumplir WCAG AA (4.5:1 para texto normal).

**Tipografía y jerarquía**
- ¿Hay más de 2-3 familias tipográficas? Usualmente es exceso.
- ¿Los tamaños siguen una escala (12, 14, 16, 20, 24, 32…) o son arbitrarios?
- ¿El peso (`fontWeight`) diferencia títulos de cuerpo de manera clara?
- ¿Hay un `lineHeight` razonable (1.4–1.6 para cuerpo)?

**Espaciado y layout**
- ¿Los márgenes/padding siguen una escala (4, 8, 12, 16, 24, 32)?
- ¿Hay aire suficiente entre elementos o está todo apretado?
- ¿Los elementos están alineados a una grilla mental coherente?
- En mobile (React Native): ¿se respeta safe area, hay padding horizontal consistente?

**Microinteracciones y animaciones**
- ¿Los botones tienen feedback al presionarse (`activeOpacity`, `Pressable` con scale, hover en web)?
- ¿Las transiciones de pantalla/modal son instantáneas (choque visual) o animadas?
- ¿Hay estados de carga (skeletons, spinners) o sólo aparece contenido de golpe?
- ¿Listas largas tienen animación de entrada escalonada?

**Accesibilidad**
- Contraste de color (mencionado arriba).
- Tamaños de toque mínimos (44x44 pt en iOS, 48x48 dp en Android).
- Labels en inputs, `accessibilityLabel` en React Native.
- Texto no debería estar a menos de 12-14px.

**Consistencia y componentes**
- ¿Hay botones con estilos distintos a lo largo del mismo archivo? Señal para extraer un componente.
- ¿Los bordes, radios y sombras son consistentes?

### 2. Reportar

Presentá el resultado de la auditoría como un reporte estructurado. **No uses viñetas sueltas** — agrupar por eje y priorizar por impacto. Formato sugerido (en español porque así se comunica Gastón):

```
## Auditoría de diseño

### 🎨 Paleta — [estado: OK / mejorable / crítico]
[observaciones concretas con ejemplos del código]

### 🔤 Tipografía
[...]

### 📐 Espaciado
[...]

### ✨ Animaciones
[...]

### ♿ Accesibilidad
[...]

### 🧩 Consistencia
[...]

## Propuesta de mejoras

**Prioridad alta** (mayor impacto visual):
1. [mejora concreta con el antes/después]
2. ...

**Prioridad media**:
...

**Nice-to-have** (animaciones, pulido):
...
```

Al final del reporte preguntá explícitamente: **"¿Aplico estos cambios? Puedo hacer todos, solo los de prioridad alta, o los que elijas."**

### 3. Aplicar

Solo después de una respuesta afirmativa del usuario, aplicá los cambios. Reglas al aplicar:

- **Centralizar la paleta**: extraer colores a un objeto `theme.colors` / `constants/colors.ts` / variables CSS. No hardcodear hex en los componentes.
- **Mantener la identidad existente**: si el proyecto ya tiene una onda (p. ej. dark fantasy en Aetherion, o algo sobrio en Faculty Manager), respetarla — mejorar no es reescribir.
- **Explicar qué cambió antes de mostrar el código** (preferencia de Gastón: explicar approach antes de código).
- **Mostrar diff conceptual** cuando el archivo sea largo: "modifiqué X, Y, Z" antes del bloque completo.
- **Usar tokens, no magic numbers**: `spacing.md` en vez de `16`, `colors.primary` en vez de `#3B82F6`.

## Paletas sugeridas por contexto

Cuando el usuario no tiene paleta definida o la actual es un desastre, proponer 2-3 opciones breves y pedir que elija. Ejemplos de direcciones (no recetas cerradas — adaptar al tono del proyecto):

- **App educativa / productividad** (Faculty Manager): neutros fríos + 1 acento. Fondos casi-blancos, textos grises oscuros, un azul/violeta de marca, verde/rojo solo para estados.
- **App creativa / oscura** (Aetherion): fondos muy oscuros (no negro puro — `#0E0E12`), acentos saturados pero no neón, contrastes fuertes.
- **App comercial** (pastelería): cálidos tierra + un pop de color. Cremas, marrones suaves, acento rosa/dorado.

Para cada propuesta dar 5-6 hex values, no más. Formato:

```
Opción A — "Calma académica"
  primario    #4F46E5
  secundario  #8B5CF6
  fondo       #FAFAFA
  superficie  #FFFFFF
  texto       #18181B
  texto suave #71717A
```

## Animaciones: qué sugerir y cuándo

Las animaciones son el área donde más fácil se pasa al exceso. Reglas:

- **Siempre sugerir** animar: aparición de modales, feedback de tap en botones, cambios de pantalla, skeletons en listas que cargan desde Firebase, check de tarea completada.
- **A veces sugerir**: animación de entrada escalonada en listas (stagger), parallax sutil en headers con scroll, transiciones compartidas entre pantallas.
- **Rara vez sugerir**: animaciones decorativas que no responden a acción del usuario, loops infinitos, partículas.
- **Duraciones**: 150-250ms para microinteracciones, 300-400ms para transiciones de pantalla. Más que eso se siente lento.
- **Librerías por stack**: React Native → `react-native-reanimated` (v3) o `Animated` nativo para cosas simples. Web React → `framer-motion` o transitions CSS. HTML puro → CSS `transition` y `@keyframes`.

Para más detalle sobre patrones de animación por framework, ver `references/animations.md`.

## Antipatrones frecuentes

Cosas que detectar y marcar como problema, no como preferencia:

- Más de 3 familias tipográficas en una pantalla.
- Usar `#000` puro para texto (preferir `#18181B`/`#1F2937` — menos duro a la vista).
- Usar `#FFF` puro para fondos de app móvil (preferir `#FAFAFA`/`#F9FAFB`).
- Botones sin `activeOpacity` o `Pressable` sin feedback visual.
- `marginTop` + `marginBottom` mezclados sin sistema (elegir uno como convención).
- Sombras random que no siguen una escala de elevación.
- Bordes de 1px de color medio-gris — casi siempre se ven mejor bordes muy sutiles (`#E5E7EB`) o directamente sombras.
- Textos con `opacity: 0.5` en vez de usar un color de texto secundario real.
- **Paletas paralelas compitiendo**: config de Tailwind + variables CSS + hex hardcodeados en componentes — los tres con el mismo color escrito distinto. Marcar como crítico y proponer una sola fuente de verdad.
- **El mismo color escrito de varias formas** en un mismo archivo: `purple-600`, `purple-500`, `#A855F7`, `rgba(168,85,247,0.3)` — todos el mismo morado. Señal de falta de tokens.
- **Clases de animación referenciadas pero no definidas**: `animate-in`, `fade-in`, `slide-up`, `zoom-in`, `flip-in-y` usadas en JSX sin que exista la definición CSS ni el plugin de Tailwind correspondiente. No hacen nada y generan falsa sensación de tener animaciones. Al detectarlas, listar exactamente cuáles están huérfanas.
- **Stacks de estilos mezclados sin criterio**: Bootstrap + Tailwind + styled-components + inline styles en el mismo componente. Detectar y sugerir un stack primario (el que ya tenga más peso en el proyecto).
- **Misma lógica defensiva copiada en N lugares** (p. ej. parseo de contadores, fallback de imágenes, formato de fecha). Señal para extraer a `utils.ts` o a un componente chico.
- **Mismo dato con tres looks distintos** en la app (ej: un badge de "dificultad" que se renderiza diferente en feed, detalle y lista). Marca falta de componente compartido.
- **Sub-secciones con identidad visual ajena** al resto de la app (distinta paleta, distinto fondo, distintos radios). Si es intencional, proponer una transición clara al entrar/salir; si no, unificar.

## Cuando NO auditar a ciegas

Si el usuario comparte un fragmento muy chico (5-10 líneas de un botón), preguntá si querés ver más contexto antes de auditar — una paleta no se juzga con 2 colores a la vista.

Si el usuario ya te dio restricciones claras (p. ej. "tiene que usar los colores del logo", "el cliente quiere que sea azul"), respetarlas y auditar dentro de ese marco, no pelearse con esas decisiones.
