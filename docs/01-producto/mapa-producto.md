# Mapa de producto

> Diagrama ⑧, parte producto. Qué tiene la app y cómo se conectan las partes. La parte de experiencia está en [journeys.md](../02-ux/journeys.md).

## Mapa de módulos

```mermaid
mindmap
  root((miAppEstudio))
    Personaje
      6 stats con XP
      Nivel principal
      Rango E a Monarch
      Clase según stat dominante
      Logros calculados
    Hoy
      Dashboard
      Bitácora
      Rocas semanales
      Cierre del día
    Hacer
      Quests
        Recurrencia diaria, semanal, días hábiles
        Rachas y multiplicador
        Heatmap
      Calendario
        Tareas con recurrencia
        Eventos
        Google Calendar
      Misiones
        Épica, hito, tarea
        Prerequisitos
        Costo que va a Billetera
    Crecer
      Gym
        Rutinas y series
        Timer de descanso
        Mapa muscular
        Comida
      Atributos
        Radar de stats
        Biblioteca por capítulos
        Facultad con materias y exámenes
      Billetera
        Movimientos
        Sueldo esperado
        Presupuestos
        Metas de ahorro
    Pensar
      Segundo Cerebro
        Inbox
        Notas PARA
        Ideas
        Personas y grupos
        Chat con IA
      La Gaceta
        8 páginas por día
        Me gusta y guardados
        Deportes en vivo
```

## El loop central

Lo que hace que la app funcione como juego: cada acción vuelve como progreso visible.

```mermaid
flowchart LR
  A["Hacer algo real<br/>hábito, capítulo, serie, tarea"] --> B["Marcarlo en la app<br/>1 toque"]
  B --> C["XP al stat<br/>× multiplicador de racha"]
  C --> D["Feedback inmediato<br/>toast o level up + confetti"]
  D --> E["Progreso acumulado<br/>nivel, rango, clase, radar"]
  E --> F["Ganas de volver mañana<br/>racha en juego"]
  F --> A
  E -.-> G["Cierre del día<br/>reflexión"]
  G -.-> F
```

## Fuentes de XP (hoy)

| Fuente | Stat | XP | Código |
|---|---|---|---|
| Hábito | el del hábito | `xpValue` (20 por defecto) × 1 / 1,25 / 1,5 / 2 según racha | `App.tsx:597-600` |
| Ejercicio | Fuerza | ±5 | `App.tsx:979` |
| Capítulo | Inteligencia | ± `xpPorCapitulo` | `App.tsx:1218` |
| Tarea de facultad | Inteligencia | ±15 | `App.tsx:1328` |
| Examen con nota | Inteligencia | `round(nota / notaMax × 30)` | `App.tsx:1358-1363` |
| Misión | — | 0 (solo confetti) | `App.tsx:740-743` |
| Persona / grupo | Carisma | 0 (gancho `xpOtorgado` sin usar) | `types.ts:106-107` |

**Brechas del loop:** Salud, Agilidad, Carisma y Fe solo suben con hábitos. Misiones y Segundo Cerebro no dan XP. Ver [roadmap](roadmap.md).
