# Casos de uso

> Diagrama ⑦. Mermaid no tiene diagrama UML de casos de uso: se dibuja con un flowchart (actores a los costados, casos de uso dentro del límite del sistema).

## Diagrama

```mermaid
flowchart LR
  G(["👤 Gastón"])
  AG(["🤖 Agente Gmail"])
  GO(["Google<br/>Auth + Calendar"])
  GQ(["Groq LLM"])
  NEWS(["Medios RSS<br/>ESPN, Jolpica"])

  subgraph SYS["miAppEstudio"]
    direction TB
    UC1(["Iniciar sesión con Google"])
    UC2(["Ver el día en el Dashboard"])
    UC3(["Completar un hábito y ganar XP"])
    UC4(["Gestionar tareas y eventos"])
    UC5(["Ver agenda con Google Calendar"])
    UC6(["Registrar entrenamiento"])
    UC7(["Leer un libro por capítulos"])
    UC8(["Gestionar materias, tareas y exámenes"])
    UC9(["Planificar misiones con prerequisitos"])
    UC10(["Registrar gastos y presupuestos"])
    UC11(["Leer La Gaceta del día"])
    UC12(["Procesar el Inbox"])
    UC13(["Gestionar notas, personas y grupos"])
    UC14(["Preguntarle al Segundo Cerebro"])
    UC15(["Cerrar el día con reflexión"])
    UC16(["Exportar datos"])
  end

  G --- UC1 & UC2 & UC3 & UC4 & UC5 & UC6 & UC7 & UC8
  G --- UC9 & UC10 & UC11 & UC12 & UC13 & UC14 & UC15 & UC16
  UC1 --- GO
  UC5 --- GO
  UC14 --- GQ
  UC11 --- NEWS
  AG --- UC12

  UC3 -.->|include| XP(["Sumar XP al stat"])
  UC6 -.->|include| XP
  UC7 -.->|include| XP
  UC8 -.->|include| XP
  UC9 -.->|"extend: misión con costo"| UC10
  UC12 -.->|extend| UC4
  UC12 -.->|extend| UC9
  UC12 -.->|extend| UC13
```

## Detalle

| ID | Caso de uso | Actor | Disparador | Resultado | Pantalla |
|---|---|---|---|---|---|
| UC1 | Iniciar sesión | Gastón, Google | abrir la app sin sesión | sesión + datos cargados | `LoginScreen` |
| UC2 | Ver el día | Gastón | abrir la app | hábitos, agenda, misiones y rocas de hoy | `dashboard` |
| UC3 | Completar hábito | Gastón | tocar un hábito activo | `completedDates` + XP × racha | `habits`, `dashboard` |
| UC4 | Tareas y eventos | Gastón | botón "+" en Calendario | tarea con recurrencia o evento | `calendar` |
| UC5 | Google Calendar | Gastón, Google | Ajustes → Conectar | eventos de Google junto a los propios | `settings`, `calendar` |
| UC6 | Entrenamiento | Gastón | marcar ejercicio / series | +5 XP Fuerza, `setsLog` | `gym` |
| UC7 | Libro por capítulos | Gastón | marcar capítulo leído | +`xpPorCapitulo` Inteligencia | `attributes` → Biblioteca |
| UC8 | Facultad | Gastón | completar tarea o cargar nota | +15 XP o `nota/notaMax × 30` | `attributes` → Facultad |
| UC9 | Misiones | Gastón | crear / completar misión | árbol actualizado; bloqueo por prerequisitos | `missions` |
| UC10 | Billetera | Gastón | cargar movimiento | transacción, presupuesto, meta | `billetera` |
| UC11 | La Gaceta | Gastón, Medios | abrir Diario | edición de hoy rankeada por gustos | `diario` |
| UC12 | Procesar Inbox | Gastón, Agente | ítem nuevo en Inbox | ítem convertido en nota, tarea, misión… | `cerebro` → Inbox |
| UC13 | Notas y personas | Gastón | crear / editar | notas PARA, personas con pendientes y fechas | `cerebro` |
| UC14 | Chat | Gastón, Groq | escribir pregunta | respuesta con contexto propio | `cerebro` → Chat |
| UC15 | Cierre del día | Gastón | después de las 21:00 | reflexión guardada como nota | modal `CierreDia` |
| UC16 | Exportar | Gastón | Ajustes → Exportar | JSON descargado (hoy: solo 5 colecciones) | `settings` |

Criterios de aceptación de cada uno: [criterios-aceptacion.md](../06-calidad/criterios-aceptacion.md).
