# Reglas de Firestore

> Decisión: [ADR-0006](../08-decisiones/ADR-0006-firestore-rules.md). Esta página es la **propuesta**; el archivo real `firestore.rules` se crea en la fase P0 del [roadmap](../01-producto/roadmap.md).

## Hoy (as-is)

- **No hay `firestore.rules` en el repo** ni en su historial de git. `firebase.json` solo tiene `hosting` (sin bloque `firestore`).
- Las reglas que protegen la base viven **solo en la consola de Firebase** y nadie puede revisarlas desde el código.
- La app lee y escribe todo desde el navegador (`front/src/App.tsx`), así que **las reglas son la única defensa**.
- El agente Gmail usa el Admin SDK, que **saltea las reglas** (`docs/INBOX_AGENTE.md`).

**Primer paso (15 min):** Firebase Console → Firestore → Reglas → copiar el contenido a `firestore.rules` en la raíz y agregar a `firebase.json`:

```json
{ "firestore": { "rules": "firestore.rules" } }
```

Si las reglas actuales son `allow read, write: if request.auth != null` o de "modo de prueba", **cualquier cuenta de Google** puede leer los datos de Gastón (personas con teléfono, finanzas, notas). Es el riesgo más alto del proyecto.

## Objetivo (to-be): reglas propuestas

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helpers ────────────────────────────────────────────────
    function esDueno(uid) {
      return request.auth != null && request.auth.uid == uid;
    }
    function texto(v, max) { return v is string && v.size() > 0 && v.size() <= max; }
    function fecha(v) { return v is string && v.matches('^[0-9]{4}-[0-9]{2}-[0-9]{2}$'); }
    function statKey(v) {
      return v in ['fuerza', 'salud', 'inteligencia', 'agilidad', 'carisma', 'fe'];
    }

    match /usuarios/{uid} {

      // stats/main: solo los 6 stats, cada uno { xp: number }
      match /stats/{docId} {
        allow read: if esDueno(uid);
        allow write: if esDueno(uid) && docId == 'main'
          && request.resource.data.keys().hasOnly(
               ['fuerza', 'salud', 'inteligencia', 'agilidad', 'carisma', 'fe']);
      }

      match /habitos/{id} {
        allow read, delete: if esDueno(uid);
        allow create, update: if esDueno(uid)
          && texto(request.resource.data.nombre, 120)
          && statKey(request.resource.data.stat)
          && (!('completedDates' in request.resource.data)
              || request.resource.data.completedDates.size() <= 400);
      }

      match /transacciones/{id} {
        allow read, delete: if esDueno(uid);
        allow create, update: if esDueno(uid)
          && request.resource.data.monto is number
          && request.resource.data.monto > 0
          && request.resource.data.tipo in ['ingreso', 'gasto']
          && fecha(request.resource.data.fecha);
      }

      // El cliente solo crea capturas manuales; el agente usa Admin SDK
      match /inbox/{id} {
        allow read, delete: if esDueno(uid);
        allow create: if esDueno(uid) && request.resource.data.origen == 'manual';
        allow update: if esDueno(uid)
          && request.resource.data.diff(resource.data).affectedKeys()
               .hasOnly(['procesado', 'procesadoComo', 'procesadoEn']);
      }

      // Resto de colecciones conocidas: solo dueño, sin validación fina (todavía)
      match /{coleccion}/{id} {
        allow read, write: if esDueno(uid) && coleccion in [
          'eventos', 'tareas', 'misiones', 'rutinas', 'libros', 'materias',
          'diario', 'objetivos_cha', 'sueldos_meta', 'presupuestos',
          'metas_ahorro', 'personas', 'grupos', 'rocas',
          'diario_prefs', 'cerebro_prefs'
        ];
      }
    }

    // Todo lo demás, cerrado
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Por qué la lista de colecciones:** en Firestore, si dos `match` aplican al mismo documento, alcanza con que **uno** permita. Si el comodín `/{coleccion}/{id}` incluyera `habitos`, saltearía la validación de arriba. Por eso el comodín nombra solo las colecciones **sin** reglas propias.

**Opcional — cerrar el registro:** si la app es solo para Gastón, agregar a `esDueno` la condición `request.auth.uid in ['<uid de Gastón>']`. El uid no es secreto (aparece en las rutas), así que puede estar en el repo.

## Plan de tests con el emulador

Herramientas: `firebase-tools` (emulador) + `@firebase/rules-unit-testing` + Vitest.

| # | Caso | Esperado |
|---|---|---|
| 1 | Usuario A lee `usuarios/A/habitos/x` | ✅ permitido |
| 2 | Usuario B lee `usuarios/A/habitos/x` | ❌ denegado |
| 3 | Sin sesión lee cualquier cosa | ❌ denegado |
| 4 | A escribe `stats/main` con una clave `nivel` extra | ❌ denegado |
| 5 | A crea hábito con `stat: 'magia'` | ❌ denegado |
| 6 | A crea transacción con `monto: -5` | ❌ denegado |
| 7 | A crea ítem de inbox con `origen: 'gmail'` | ❌ denegado (solo el agente) |
| 8 | A marca un ítem de inbox como procesado | ✅ permitido |
| 9 | A cambia el `texto` de un ítem de inbox | ❌ denegado |
| 10 | A escribe en `usuarios/A/coleccion_inventada/x` | ❌ denegado |
| 11 | `writeBatch` de `toggleHabit` (hábito + stats) | ✅ permitido |

Scripts propuestos (se agregan en la fase P1):

```bash
npm i -D firebase-tools @firebase/rules-unit-testing
```

```bash
npx firebase emulators:exec --only firestore "vitest run tests/rules"
```

## Acciones

| Prioridad | Acción |
|---|---|
| **P0** | Copiar las reglas actuales de la consola a `firestore.rules` y revisarlas contra el caso 2 |
| **P0** | Si permiten `request.auth != null` a secas, reemplazarlas ya por la versión con `esDueno` |
| P1 | Validaciones de `stats`, `habitos`, `transacciones`, `inbox` + los 11 tests |
| P1 | Deploy de reglas desde el repo (`firebase deploy --only firestore:rules`) |
| P2 | Validación del resto de colecciones a medida que se migran a `data/` |
