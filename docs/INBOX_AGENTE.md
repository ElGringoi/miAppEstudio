# Inbox de QUESTFLOW — cómo escribe un agente

El Inbox es una sección del Segundo Cerebro. Ahí aparece todo lo que entra sin
clasificar, y el usuario después decide si cada cosa es una nota, una idea, una
tarea, una misión, o algo de una persona o un grupo.

Un agente externo (el que trae mensajes recientes, o el que lee Gmail) entrega
cosas al Inbox **escribiendo documentos en Firestore**. La app no tiene backend
ni API: escuchar esa colección es todo lo que hace falta, y lo nuevo aparece en
la app en tiempo real.

## Dónde está la app

| | |
|---|---|
| Producción | https://mi-app-estudio-gamma.vercel.app |
| Repo | https://github.com/ElGringoi/miAppEstudio |
| Base de datos | Cloud Firestore del proyecto Firebase de la app (el project id está en la variable `VITE_FIREBASE_PROJECT_ID` de Vercel) |
| Colección | `usuarios/{uid}/inbox` |

`{uid}` es el uid de Firebase Auth del usuario. Se ve en Firebase Console →
Authentication → Users.

## Cómo autenticarse

Con una **service account** del proyecto Firebase (Firebase Console → Project
settings → Service accounts → Generate new private key) y el Admin SDK. El
Admin SDK no pasa por las reglas de seguridad, así que no hace falta tocarlas.

**La clave de la service account es una credencial con acceso total a la base.**
Va en los secrets del agente, nunca en un repo. Este repo es público.

## Formato del documento

```ts
{
  texto:      string;   // obligatorio: el contenido
  origen:     'agente' | 'gmail';   // 'manual' lo usa solo la app
  recibidoEn: string;   // ISO 8601 con hora, ej. "2026-10-06T14:32:00-03:00"
  procesado:  false;

  // opcionales — omitirlos si no hay dato, NUNCA mandar null ni undefined
  titulo?:    string;   // ej. el asunto del mail
  remitente?: string;   // ej. "Martín (WhatsApp)" o "facturas@banco.com"
  url?:       string;   // link al original (el mail en Gmail, el mensaje, etc.)
}
```

La app ordena por `recibidoEn`, de más nuevo a más viejo. Los campos
`procesado`, `procesadoComo` y `procesadoEn` los maneja la app: el agente solo
crea documentos con `procesado: false` y no los modifica después.

Para no duplicar un mensaje que ya entregaste, usá un id de documento estable
derivado del original (por ejemplo `gmail-<messageId>`) y escribí con `set`:
si ya existe, se pisa con el mismo contenido en vez de crear otro.

## Ejemplo (Node, Admin SDK)

```js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore();

await db.doc(`usuarios/${process.env.QUESTFLOW_UID}/inbox/gmail-${mensaje.id}`).set({
  texto:      mensaje.cuerpo,
  titulo:     mensaje.asunto,
  remitente:  mensaje.de,
  url:        `https://mail.google.com/mail/u/0/#inbox/${mensaje.id}`,
  origen:     'gmail',
  recibidoEn: new Date(mensaje.fecha).toISOString(),
  procesado:  false,
});
```

Si cambia el tipo `FSInboxItem` en `front/src/types.ts`, hay que actualizar este
archivo.
