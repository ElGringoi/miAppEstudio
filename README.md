# miAppEstudio · Questflow

Web app de productividad y estudio con gamificación RPG: cada hábito, capítulo, serie o tarea suma XP a uno de 6 stats, y el personaje sube de nivel, de rango (E → Monarch) y de clase.

**Módulos:** Dashboard · Calendario (+ Google Calendar) · Gym · Atributos (Biblioteca y Facultad) · Quests · Misiones · Billetera · La Gaceta (diario con noticias en vivo) · Segundo Cerebro (inbox, notas, personas, chat con IA) · Ajustes.

Producción: <https://mi-app-estudio-gamma.vercel.app>

## Arrancar

```bash
npm install
```

```bash
cp .env.local.example .env.local
```

Completar `.env.local` con la config web de Firebase, y después:

```bash
npm run dev
```

Abre en <http://localhost:5173>. El chat del Segundo Cerebro necesita `GROQ_API_KEY` en Vercel; en local responde con búsqueda propia.

| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo (incluye `/api/edicion`) |
| `npm run build` | `tsc -b` + build de producción |
| `npm run lint` | ESLint |
| `npm run docs:site` | genera `docs/site/index.html` con toda la documentación y los diagramas |

## Stack

React 19 · Vite 8 · TypeScript 6 · Tailwind CSS v4 · Motion · Firebase Auth + Firestore (desde el cliente) · funciones serverless en Vercel (`api/`).

## Documentación

Toda la planificación (producto, UX, design system, arquitectura, seguridad, calidad, operaciones y decisiones) está en [`docs/`](docs/README.md).

- Agentes de IA: leer primero [`docs/CONTRATO-AGENTES.md`](docs/CONTRATO-AGENTES.md) y [`CLAUDE.md`](CLAUDE.md).
- Qué sigue: [`docs/01-producto/roadmap.md`](docs/01-producto/roadmap.md).
