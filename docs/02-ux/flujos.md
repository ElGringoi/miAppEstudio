# Diagramas de flujo

> Diagrama ①. Los 5 flujos de usuario más usados, con sus decisiones y salidas de error. Los rombos son decisiones; los nodos rojos son errores que hoy no tienen buena salida.

## 1. Entrar a la app

Código: `App.tsx:260`, `App.tsx:302-339`, `App.tsx:1961-1975`.

```mermaid
flowchart TD
  A([Abrir la app]) --> B{¿Hay sesión?}
  B -- No --> C[LoginScreen]
  C --> D[Entrar con Google]
  D --> E{¿Popup ok?}
  E -- No --> C
  E -- Sí --> F
  B -- Sí --> F[Spinner: abrir 20 listeners]
  F --> G{¿Llegaron los 19 callbacks?}
  G -- Sí --> H[Dashboard]
  G -- "Un listener falla" --> X[Spinner para siempre]
  H --> I{¿Son más de las 21:00 y no se mostró hoy?}
  I -- Sí --> J[Modal Cierre del día]
  I -- No --> K([Usar la app])
  J --> K
  classDef err fill:#93000a,stroke:#ffb4ab,color:#ffdad6
  class X err
```

## 2. Completar un hábito

Código: `toggleHabit`, `App.tsx:585-623`.

```mermaid
flowchart TD
  A([Tocar hábito]) --> B{¿Activo hoy?}
  B -- No --> Z([No pasa nada])
  B -- Sí --> C{¿Ya hecho hoy?}
  C -- No --> D[Calcular racha y multiplicador]
  D --> E["xp = xpValue × mult"]
  C -- Sí --> F["xp = −xpValue (sin multiplicador)"]
  E --> G[writeBatch: fechas + stats]
  F --> G
  G --> H{¿Commit ok?}
  H -- No --> I[Toast: Error al guardar el hábito]
  H -- Sí --> J{¿Era marcar?}
  J -- No --> K([Listo])
  J -- Sí --> L{¿Subió de nivel?}
  L -- Sí --> M[Overlay level up + confetti]
  L -- No --> N["Toast +XP STAT (×mult)"]
  M --> K
  N --> K
```

## 3. Procesar un ítem del Inbox

Código: `procesarInbox`, `App.tsx:1669-1726`; UI en `components/CerebroInbox.tsx`.

```mermaid
flowchart TD
  A([Abrir Cerebro → Inbox]) --> B{¿Hay ítems sin procesar?}
  B -- No --> V[Estado vacío]
  B -- Sí --> C[Elegir un ítem]
  C --> D{¿Qué es?}
  D -- Nota o idea --> E[Crear nota en diario]
  D -- Tarea --> F[Crear tarea once con fecha]
  D -- Misión --> G[Crear misión raíz]
  D -- Persona o grupo --> H{¿Eligió a quién?}
  H -- No --> I[Toast: Elegí una persona]
  H -- Sí --> J[Crear nota + agregar link]
  D -- Descartar --> K[Borrar ítem]
  E --> L[Marcar procesado en el mismo batch]
  F --> L
  G --> L
  J --> L
  L --> M{¿Commit ok?}
  M -- Sí --> N[Toast: Guardado como …]
  M -- No --> O[Toast de error, nada a medias]
```

## 4. Cierre del día

Código: `App.tsx:343-351`, `guardarReflexionCierreDia` `App.tsx:1477-1495`, `components/CierreDia.tsx`.

```mermaid
flowchart TD
  A([Son las 21:00 o más]) --> B{¿Ya se mostró hoy?}
  B -- Sí --> Z([Nada])
  B -- No --> C[Modal: tareas, hábitos y XP del día]
  C --> D{¿Escribió reflexión?}
  D -- No --> E([Cerrar])
  D -- Sí --> F["Guardar nota 'Cierre del día - HOY'"]
  F --> G{¿Ok?}
  G -- Sí --> H[Toast: Reflexión guardada]
  G -- No --> I[Toast de error]
  F -.- W["⚠ HOY es UTC: después de las 21 ART<br/>puede quedar con la fecha de mañana"]
  classDef warn fill:#4d3a00,stroke:#f59e0b,color:#ffe08a
  class W warn
```

## 5. Leer La Gaceta

Código: `components/DiarioEdicion.tsx`, `utils/edicion.ts`.

```mermaid
flowchart TD
  A([Abrir Diario]) --> B{¿Hay caché de hoy?}
  B -- Sí --> C[Mostrar caché]
  B -- No --> D[Mostrar edición de respaldo]
  C --> E[Pedir /api/edicion]
  D --> E
  E --> F{¿Respondió?}
  F -- No --> G[Aviso: Sin conexión]
  F -- Sí --> H[Elegir la mejor edición y guardar caché]
  H --> I[Portada]
  G --> I
  I --> J[Pasar página: swipe, flechas o teclado]
  J --> K{¿Le interesa la nota?}
  K -- Like o dislike --> L[Actualiza tagScores]
  K -- Guardar --> M[Agrega a guardados, máx 300]
  K -- Abrir --> N[Nota original en pestaña nueva]
  L --> J
  M --> J
  N --> J
  J --> O{¿Última página?}
  O -- Sí --> P([Edición terminada])
```

## Objetivo (to-be)

| Flujo | Cambio |
|---|---|
| 1 | La salida "Un listener falla" lleva a una pantalla de error con **Reintentar** y **Cerrar sesión**. |
| 2 | Desmarcar resta el XP que realmente se sumó ese día. |
| 3 | Sin cambios de flujo; agregar **Deshacer** en el toast durante 5 s. |
| 4 | Fecha local; el modal muestra rachas en juego. |
| 5 | Mostrar "Edición parcial" si la edición vino degradada. |
