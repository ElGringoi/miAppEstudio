# Diagrama de clases

> Diagrama ⑥. La app no usa clases: son tipos de TypeScript + funciones. El diagrama muestra **tipos como clases** y **módulos de funciones como clases estáticas**.

## Hoy (as-is)

### Tipos de dominio (`front/src/types.ts`)

```mermaid
classDiagram
  direction LR
  class FSStatsDoc {
    +map stat_a_xp
  }
  class FSHabito {
    +string id
    +string nombre
    +FSStatKey stat
    +HabitRecurrence recurrence
    +number[] diasSemana
    +number xpValue
    +string[] completedDates
  }
  class FSTarea {
    +string id
    +string titulo
    +once_daily_weekly recurrence
    +number weekday
    +string date
    +string[] completedDates
  }
  class FSMision {
    +string id
    +string titulo
    +boolean completada
    +string parentId
    +number orden
    +MisionPrioridad prioridad
    +string[] prerequisitos
    +number costoMonto
  }
  class MissionNode {
    <<vista>>
    +epic_milestone_task type
    +number progress
    +boolean bloqueada
    +MissionNode[] children
  }
  class FSRutina {
    +string nombre
    +number[] diasSemana
  }
  class FSEjercicio {
    +string nombre
    +number restTimerSecs
    +string lastCompletedDate
  }
  class SetLog {
    +number peso
    +number reps
    +boolean done
  }
  class FSLibro {
    +EstadoLibro estado
    +number xpPorCapitulo
  }
  class FSCapitulo {
    +number numero
    +boolean leido
  }
  class FSMateria {
    +string nombre
    +string color
  }
  class FSPersona {
    +string nombre
    +string relacion
    +string[] grupos
    +string[] links
  }
  class FSGrupo {
    +string nombre
    +string[] links
  }
  class FSEntradaDiario {
    +string contenido
    +EntradaArea area
    +string[] tags
  }
  class FSInboxItem {
    +InboxOrigen origen
    +boolean procesado
    +InboxDestino procesadoComo
  }

  FSHabito --> FSStatsDoc : suma XP
  FSMision --> FSMision : parentId
  FSMision ..> MissionNode : buildTree()
  FSRutina *-- FSEjercicio
  FSEjercicio *-- SetLog
  FSLibro *-- FSCapitulo
  FSMateria *-- FSMaterial
  FSMateria *-- FSTareaFac
  FSMateria *-- FSExamen
  FSPersona o-- FSGrupo : grupos[]
  FSPersona --> FSEntradaDiario : links[]
  FSGrupo --> FSEntradaDiario : links[]
  FSInboxItem ..> FSEntradaDiario : procesa
  FSInboxItem ..> FSTarea : procesa
  FSInboxItem ..> FSMision : procesa
```

### Módulos de lógica

```mermaid
classDiagram
  class helpers_ts {
    <<modulo>>
    +xpLevel(totalXp) level
    +calcMainLevel(stats) level
    +rankFromLevel(level) string
    +assignClass(stats) string
    +calcStreak(dates, recurrence) number
    +streakMultiplier(streak) number
    +isHabitActiveToday(h) boolean
    +isHabitDoneToday(h) boolean
    +buildTree(misiones) MissionNode
  }
  class constants_tsx {
    <<modulo>>
    +HOY string
    +getToday() string
    +STAT_META
    +RANK_META
    +CLASS_META
  }
  class edicion_ts {
    <<modulo>>
    +pedirEdicion() EdicionDiaria
    +leerEdicionCache() EdicionDiaria
    +elegirEdicion(actual, nueva)
    +rankear(lista, prefs)
    +armarSeleccion(edicion, prefs)
  }
  class App_tsx {
    <<componente>>
    +useState x88
    +onSnapshot x20
    +toggleHabit()
    +toggleMission()
    +procesarInbox()
    +connectGCal()
    +otros 60 handlers
  }
  App_tsx ..> helpers_ts
  App_tsx ..> constants_tsx
  App_tsx ..> edicion_ts
  helpers_ts ..> constants_tsx
```

Reglas que viven en `helpers.ts` (verificadas):

| Regla | Función | Línea |
|---|---|---|
| Cada nivel cuesta 100 XP más que el anterior | `xpLevel` | `helpers.ts:6` |
| Nivel principal = piso del promedio de los 6 stats | `calcMainLevel` | `helpers.ts:160` |
| Rango cada 10 niveles: E, D, C, B, A, S, SS, Monarch | `rankFromLevel` | `helpers.ts:174` |
| Clase según el stat más alto | `assignClass` | `helpers.ts:186` |
| Multiplicador de racha 1,25 / 1,5 / 2,0 a los 7 / 14 / 30 | `streakMultiplier` | `helpers.ts:220` |

## Objetivo (to-be)

Las reglas pasan a `domain/` como funciones puras con tests. El acceso a Firestore pasa a `data/` con un repositorio por colección. Las pantallas solo llaman hooks.

```mermaid
classDiagram
  class Repositorio~T~ {
    <<interface>>
    +escuchar(uid, onData, onError) Unsubscribe
    +crear(uid, datos) id
    +actualizar(uid, id, cambios)
    +borrar(uid, id)
  }
  class HabitosRepo
  class MisionesRepo
  class StatsRepo {
    +sumarXp(batch, stat, delta)
  }
  Repositorio~T~ <|.. HabitosRepo
  Repositorio~T~ <|.. MisionesRepo

  class MotorXp {
    <<domain>>
    +xpLevel(xp)
    +nivelPrincipal(stats)
    +rango(nivel)
    +clase(stats)
    +xpDeHabito(habito, racha)
  }
  class Recurrencia {
    <<domain>>
    +activoHoy(habito, hoy)
    +hechoHoy(habito, hoy)
    +racha(fechas, tipo)
  }
  class Fecha {
    <<domain>>
    +hoyLocal() string
    +semanaActual(hoy)
  }
  class CasoCompletarHabito {
    <<casoDeUso>>
    +ejecutar(uid, habitoId)
  }
  class useHabitos {
    <<hook>>
    +habitos
    +estado cargando_listo_error
    +completar(id)
  }

  CasoCompletarHabito --> HabitosRepo
  CasoCompletarHabito --> StatsRepo
  CasoCompletarHabito --> MotorXp
  CasoCompletarHabito --> Recurrencia
  Recurrencia --> Fecha
  useHabitos --> HabitosRepo
  useHabitos --> CasoCompletarHabito
```

Regla: `domain/` no importa nada de React ni de Firebase. Así se testea con Vitest sin emulador.
