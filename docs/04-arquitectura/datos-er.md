# Modelo de datos (entidad-relación)

> Diagrama ③. Todo vive bajo `usuarios/{uid}/` en Firestore. Fuente: `front/src/types.ts` y los listeners de `front/src/App.tsx:304-339`.

## Hoy (as-is)

### Inventario

**17 colecciones + 3 documentos únicos**, todos bajo `usuarios/{uid}/`:

| Ruta | Tipo TS | Escribe | Nota |
|---|---|---|---|
| `stats/main` | `FSStatsDoc` | App.tsx (con `increment`) | `{ fuerza: { xp }, salud: { xp }, … }` |
| `habitos` | `FSHabito` | App.tsx | `completedDates` recortado a 90 días |
| `tareas` | `FSTarea` | App.tsx, inbox | `completedDates` por fecha |
| `eventos` | `FSEvento` | App.tsx | `detalle` y `origen` opcionales |
| `misiones` | `FSMision` | App.tsx, inbox | lista plana con `parentId` + `orden` |
| `rocas` | `FSRoca` | App.tsx | prioridades semanales |
| `rutinas` | `FSRutina` | App.tsx | ejercicios embebidos |
| `libros` | `FSLibro` | App.tsx | capítulos embebidos |
| `materias` | `FSMateria` | App.tsx | materiales, tareas y exámenes embebidos |
| `diario` | `FSEntradaDiario` | App.tsx, inbox | notas del Segundo Cerebro (no es La Gaceta) |
| `personas` | `FSPersona` | App.tsx | `grupos[]` es la fuente de verdad de la membresía |
| `grupos` | `FSGrupo` | App.tsx | |
| `inbox` | `FSInboxItem` | App.tsx, **agente Gmail** (Admin SDK) | ids `gmail-<id>` para el agente |
| `objetivos_cha` | `FSObjetivoCHA` | **nadie** (solo se lee) | resto de una versión vieja |
| `transacciones` | `FSTransaccion` | App.tsx, misiones con costo | |
| `sueldos_meta` | `FSSueldoMeta` | App.tsx | id `{YYYY-MM}_{moneda}` |
| `presupuestos` | `FSPresupuesto` | App.tsx | |
| `metas_ahorro` | `FSMetaAhorro` | App.tsx | `montoActual` con `increment` |
| `diario_prefs/main` | `FSDiarioPrefs` | App.tsx (`merge: true`) | reacciones, tagScores, guardados |
| `cerebro_prefs/main` | `{ relaciones: FSRelacion[] }` | App.tsx (`merge: true`) | si no existe se usa `RELACION_META` |

`FSLogro` existe en `types.ts:158` pero **no se guarda**: los logros se calculan en cada render.

### Núcleo RPG: stats, hábitos, tareas, misiones

```mermaid
erDiagram
  USUARIO ||--|| STATS : "stats/main"
  USUARIO ||--o{ HABITO : tiene
  USUARIO ||--o{ TAREA : tiene
  USUARIO ||--o{ EVENTO : tiene
  USUARIO ||--o{ MISION : tiene
  USUARIO ||--o{ ROCA : tiene
  HABITO }o--|| STATS : "suma XP a stat"
  MISION |o--o{ MISION : "parentId (árbol)"
  MISION }o--o{ MISION : "prerequisitos[]"
  ROCA }o--o{ TAREA : "linkedTareaIds[]"
  ROCA }o--o{ MISION : "linkedMisionIds[]"

  STATS {
    int fuerza_xp
    int salud_xp
    int inteligencia_xp
    int agilidad_xp
    int carisma_xp
    int fe_xp
  }
  HABITO {
    string id PK
    string nombre
    string stat FK "FSStatKey"
    string recurrence "daily, weekdays, once_week, weekly"
    int[] diasSemana
    int xpValue "default 20"
    string[] completedDates "ultimos 90 dias"
    string fechaCompletado "legacy"
  }
  TAREA {
    string id PK
    string titulo
    string hora
    string recurrence "once, daily, weekly"
    int weekday
    string date
    string color
    string[] completedDates
    string detalle
    string origen
  }
  EVENTO {
    string id PK
    string titulo
    string fecha
    string hora
    string detalle
    string origen
  }
  MISION {
    string id PK
    string titulo
    bool completada
    string parentId FK "null = raíz"
    int orden
    string prioridad "baja, media, alta, urgente"
    string[] tags
    string[] prerequisitos FK
    float costoMonto
    string costoMoneda
  }
  ROCA {
    string id PK
    string titulo
    int progreso
    int meta
    string semana
    string[] linkedTareaIds FK
    string[] linkedMisionIds FK
  }
```

### Estudio y Gym (arrays embebidos)

```mermaid
erDiagram
  USUARIO ||--o{ RUTINA : tiene
  USUARIO ||--o{ LIBRO : tiene
  USUARIO ||--o{ MATERIA : tiene
  RUTINA ||--|{ EJERCICIO : "embebido"
  EJERCICIO ||--o{ SET_LOG : "embebido"
  LIBRO ||--|{ CAPITULO : "embebido"
  MATERIA ||--o{ MATERIAL : "embebido"
  MATERIA ||--o{ TAREA_FAC : "embebido"
  MATERIA ||--o{ EXAMEN : "embebido"

  RUTINA {
    string id PK
    string nombre
    int[] diasSemana
    int orden
    int semana
  }
  EJERCICIO {
    string id
    string nombre
    int series
    string reps
    string mediaUrl
    string lastCompletedDate
    int restTimerSecs
  }
  SET_LOG {
    float peso
    int reps
    bool done
  }
  LIBRO {
    string id PK
    string titulo
    string autor
    string estado "leyendo, leido, pendiente"
    int xpPorCapitulo
  }
  CAPITULO {
    string id
    int numero
    bool leido
    string notas
  }
  MATERIA {
    string id PK
    string nombre
    string color
  }
  MATERIAL {
    string id
    string tipo "nota, video, enlace"
    string url
  }
  TAREA_FAC {
    string id
    string titulo
    bool completada
  }
  EXAMEN {
    string id
    string titulo
    float nota
    float notaMax
  }
```

### Segundo Cerebro

```mermaid
erDiagram
  USUARIO ||--o{ ENTRADA_DIARIO : tiene
  USUARIO ||--o{ PERSONA : tiene
  USUARIO ||--o{ GRUPO : tiene
  USUARIO ||--o{ INBOX_ITEM : recibe
  USUARIO ||--o| CEREBRO_PREFS : "cerebro_prefs/main"
  CEREBRO_PREFS ||--o{ RELACION : "embebido"
  PERSONA }o--o| RELACION : "relacion (id o texto)"
  PERSONA }o--o{ GRUPO : "grupos[] fuente de verdad"
  PERSONA }o--o{ ENTRADA_DIARIO : "links[]"
  GRUPO }o--o{ ENTRADA_DIARIO : "links[]"
  PERSONA ||--o{ PENDIENTE : "embebido"
  PERSONA ||--o{ FECHA_CLAVE : "embebido"
  PERSONA ||--o{ SPARK : "embebido"
  PERSONA ||--o{ CONEXION : "embebido"
  INBOX_ITEM }o--o| ENTRADA_DIARIO : "se procesa como nota o idea"

  ENTRADA_DIARIO {
    string id PK
    string fecha
    string titulo
    string contenido "markdown"
    string[] tags
    string area "PARA"
    string[] links
  }
  PERSONA {
    string id PK
    string nombre
    string apodo
    string relacion FK
    string telefono "dato personal"
    string email "dato personal"
    string[] grupos FK
    string[] links FK
    int xpOtorgado
  }
  GRUPO {
    string id PK
    string nombre
    string icono
    string color
    string[] links FK
  }
  INBOX_ITEM {
    string id PK
    string texto
    string origen "manual, agente, gmail"
    string remitente
    string recibidoEn
    bool procesado
    string procesadoComo "nota, idea, tarea, mision, persona, grupo"
  }
  RELACION {
    string id
    string label
    string icon
    string color
  }
  PENDIENTE {
    string direccion "le_debo, me_debe"
    float monto
    bool saldado
  }
```

### Billetera y Diario (La Gaceta)

```mermaid
erDiagram
  USUARIO ||--o{ TRANSACCION : registra
  USUARIO ||--o{ SUELDO_META : define
  USUARIO ||--o{ PRESUPUESTO : define
  USUARIO ||--o{ META_AHORRO : define
  USUARIO ||--o| DIARIO_PREFS : "diario_prefs/main"
  MISION_CON_COSTO }o--o| TRANSACCION : "al completar, crea gasto"

  TRANSACCION {
    string id PK
    string descripcion
    float monto
    string tipo "ingreso, gasto"
    string categoria
    string fecha
    string moneda
  }
  SUELDO_META {
    string id PK "YYYY-MM_moneda"
    string mes
    float montoEsperado
  }
  PRESUPUESTO {
    string id PK
    string mes
    string categoria
    float monto
  }
  META_AHORRO {
    string id PK
    string nombre
    float montoObjetivo
    float montoActual
    string fechaLimite
  }
  DIARIO_PREFS {
    map reactions "artId a like o dislike"
    map tagScores "tag a puntaje"
    map guardados "max 300"
    string[] deportes
    string[] equipos
    string edicionTerminada
  }
```

### Problemas del modelo

1. **Sin validación de esquema.** Los docs se castean con `as FSHabito` (`App.tsx:310`); un campo mal escrito no se detecta.
2. **Referencias sin integridad.** Borrar una misión no limpia los `prerequisitos` ni los `linkedMisionIds` que la apuntan.
3. **Arrays embebidos que crecen.** `setsLog`, `capitulos` y `materiales` viven dentro del doc padre; Firestore corta en 1 MiB por documento.
4. **Colección muerta.** `objetivos_cha` se lee y nunca se escribe.
5. **Fechas como `string` UTC** (`constants.tsx:6-7`), ver [ADR-0007](../08-decisiones/ADR-0007-fecha-local.md).

## Objetivo (to-be)

- **Esquema validado en un solo lugar.** Cada colección tiene un conversor `withConverter` en `data/` que valida al leer y al escribir.
- **Campo `schemaVersion`** en cada doc nuevo, para migrar sin romper datos viejos.
- **Limpieza de referencias** al borrar: misiones (prerequisitos, rocas), notas (links de personas y grupos). Va en el mismo `writeBatch`, como ya hace `deleteGrupo` (`App.tsx:1744-1760`).
- **Sacar `objetivos_cha`** o darle una pantalla que lo escriba.
- **`setsLog` a subcolección** si un ejercicio supera unas 200 series registradas.
- **Las reglas de Firestore** validan los mismos tipos (ver [firestore-rules.md](../05-seguridad/firestore-rules.md)).
