# Diagramas de estado

> Diagrama ②. Los 6 objetos que cambian de estado y en los que un error se nota. Los estados de **pantalla** (vacío, cargando, offline…) están en [estados-y-excepciones.md](../02-ux/estados-y-excepciones.md).

## Hoy (as-is)

### 1. Sesión de la app

Código: `App.tsx:260` y `App.tsx:302-339`; spinners en `App.tsx:1961` y `App.tsx:1971`.

```mermaid
stateDiagram-v2
  state "Colgada (spinner infinito)" as Colgada
  [*] --> VerificandoAuth
  VerificandoAuth --> SinSesion : user null
  VerificandoAuth --> CargandoDatos : user ok
  SinSesion --> CargandoDatos : login con Google ok
  SinSesion --> SinSesion : popup cerrado o error
  CargandoDatos --> Lista : 19 callbacks recibidos
  CargandoDatos --> Colgada : un listener falla por permisos
  Lista --> Lista : snapshots en tiempo real
  Lista --> SinSesion : logout
  note right of Colgada
    Hoy no existe salida.
    onSnapshot no tiene callback de error
  end note
```

### 2. Hábito en el día

Código: `helpers.ts:82-100` (activo/hecho), `App.tsx:585-623` (toggle).

```mermaid
stateDiagram-v2
  [*] --> Inactivo : no toca hoy
  [*] --> Pendiente : activo hoy
  Pendiente --> Hecho : toggle, suma XP x multiplicador
  Hecho --> Pendiente : toggle, resta XP base sin multiplicador
  Hecho --> [*] : cambia el día
  Pendiente --> [*] : cambia el día, la racha se corta
  Inactivo --> [*]
  note right of Hecho
    once_week: Hecho dura toda la semana Lun a Dom
  end note
```

> ⚠️ Asimetría real: al marcar suma `xpValue × multiplicador`, al desmarcar resta `xpValue × 1` (`App.tsx:599`, `mult = yaHecho ? 1 : …`). Marcar y desmarcar con racha ≥ 7 deja XP de más.

### 3. Misión

Código: `toggleMission`, `App.tsx:716-748`; `buildTree`, `helpers.ts:26`.

```mermaid
stateDiagram-v2
  [*] --> Bloqueada : tiene prerequisitos sin completar
  [*] --> Disponible : sin prerequisitos pendientes
  Bloqueada --> Disponible : se completan los prerequisitos
  Disponible --> Completada : toggle
  Completada --> Disponible : toggle
  Completada --> ConfirmandoGasto : tiene costoMonto
  ConfirmandoGasto --> Completada : acepta, crea transacción
  ConfirmandoGasto --> Completada : cancela, no crea nada
  Disponible --> [*] : borrar
  Completada --> [*] : borrar
```

### 4. Ítem del Inbox

Código: `capturarInbox` `App.tsx:1652`, `procesarInbox` `App.tsx:1669`, `borrarInbox` `App.tsx:1661`.

```mermaid
stateDiagram-v2
  [*] --> SinProcesar : captura manual o agente Gmail
  SinProcesar --> Procesado : writeBatch ok
  SinProcesar --> SinProcesar : writeBatch falla, toast de error
  SinProcesar --> [*] : borrar
  Procesado --> [*] : borrar
  state Procesado {
    [*] --> Nota
    [*] --> Idea
    [*] --> Tarea
    [*] --> Mision
    [*] --> NotaDePersona
    [*] --> NotaDeGrupo
  }
```

### 5. Edición de La Gaceta (cliente)

Código: `utils/edicion.ts:222-296`, `components/DiarioEdicion.tsx:208`.

```mermaid
stateDiagram-v2
  state "Sin conexión (muestra caché o seed)" as SinConexion
  [*] --> Inicial
  Inicial --> DesdeCache : hay caché de hoy en localStorage
  Inicial --> Respaldo : no hay caché, usa diarioSeed
  DesdeCache --> Pidiendo
  Respaldo --> Pidiendo
  Pidiendo --> Fresca : 200 y edición completa
  Pidiendo --> Degradada : 200 pero menos de la mitad de las fuentes
  Pidiendo --> SinConexion : error o timeout 30 s
  SinConexion --> Pidiendo : reintento
  Fresca --> Terminada : lee todas las páginas
  Degradada --> Terminada
```

### 6. Token de Google Calendar

Código: `App.tsx:272-299`, `App.tsx:1784-1823`.

```mermaid
stateDiagram-v2
  [*] --> Desconectado
  Desconectado --> Conectado : reauthenticateWithPopup ok
  Conectado --> Desconectado : 401, se borra sin avisar
  Conectado --> Desconectado : pasan 3500 s y se recarga la página
  Conectado --> Desconectado : desconectar en Ajustes
  Conectado --> Desconectado : se cierra la pestaña, sessionStorage se pierde
```

## Objetivo (to-be)

| Objeto | Cambio |
|---|---|
| Sesión | Agregar estado **Error** con "Reintentar" y "Cerrar sesión", alcanzable desde `CargandoDatos` y `Lista`. Contar listeners, no callbacks. |
| Hábito | Desmarcar resta **lo mismo** que sumó (guardar el XP otorgado por fecha en el doc). El cambio de día usa fecha local. |
| Misión | Al borrar una misión, sacarla de los `prerequisitos` de otras (si no, quedan bloqueadas para siempre). |
| Inbox | Sin cambios. Ya es atómico. |
| La Gaceta | Mostrar el estado `Degradada` en la UI ("edición parcial"). |
| Calendar | Estado **Vencido** visible con botón "Reconectar", en vez de desconectar en silencio. |
