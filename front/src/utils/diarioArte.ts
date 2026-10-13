// Ilustración generada por artículo. El mismo id siempre da la misma imagen,
// así la portada no cambia cada vez que se recarga la app.

export type Forma =
  | { tipo: 'circulo'; x: number; y: number; r: number; color: string; opacidad: number }
  | { tipo: 'rect'; x: number; y: number; w: number; h: number; rot: number; color: string; opacidad: number }
  | { tipo: 'linea'; x1: number; y1: number; x2: number; y2: number; grosor: number; color: string };

export type ArteGenerado = { ancho: number; alto: number; fondo: string; formas: Forma[] };

// Cada paleta: [fondo, ...colores de las formas]
const PALETAS: Record<'general' | 'deporte' | 'entretenimiento', string[][]> = {
  general: [
    ['#e9dfc8', '#1c1a17', '#8b2e2e', '#c9a227', '#4a6b5d'],
    ['#d9e2e0', '#22463f', '#e0a458', '#7a3e3e', '#1c1a17'],
    ['#efe6d2', '#2f3e6b', '#b5523b', '#d8b765', '#1c1a17'],
  ],
  deporte: [
    ['#dfeadb', '#1f5c3a', '#c0392b', '#f4d03f', '#1c1a17'],
    ['#e8e4d8', '#24476b', '#e67e22', '#ffffff', '#1c1a17'],
  ],
  entretenimiento: [
    ['#e6def0', '#4a2c6b', '#e05a7e', '#2aa198', '#1c1a17'],
    ['#1e2a3a', '#f2b134', '#e05a7e', '#4fb3bf', '#f4ecdb'],
  ],
};

// FNV-1a: hash de texto estable entre recargas.
function hashTexto(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// PRNG determinístico (mulberry32): dada una semilla, siempre devuelve la misma secuencia.
function generadorAleatorio(semilla: number): () => number {
  let s = semilla;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function arteDeArticulo(id: string, seccion?: string): ArteGenerado {
  const rnd = generadorAleatorio(hashTexto(id));
  const grupo = seccion === 'deporte' ? 'deporte' : seccion === 'entretenimiento' ? 'entretenimiento' : 'general';
  const paletas = PALETAS[grupo];
  const [fondo, ...colores] = paletas[Math.floor(rnd() * paletas.length)];
  const elegirColor = () => colores[Math.floor(rnd() * colores.length)];

  const ancho = 320;
  const alto = 180;
  const cantidad = 4 + Math.floor(rnd() * 3);
  const formas: Forma[] = [];

  for (let i = 0; i < cantidad; i++) {
    const azar = rnd();
    const color = elegirColor();
    const opacidad = 0.5 + rnd() * 0.5;
    if (azar < 0.4) {
      formas.push({ tipo: 'circulo', x: rnd() * ancho, y: rnd() * alto, r: 20 + rnd() * 90, color, opacidad });
    } else if (azar < 0.8) {
      formas.push({
        tipo: 'rect', x: rnd() * ancho, y: rnd() * alto,
        w: 40 + rnd() * 160, h: 30 + rnd() * 120,
        rot: Math.round(rnd() * 40 - 20), color, opacidad,
      });
    } else {
      formas.push({
        tipo: 'linea', x1: 0, y1: rnd() * alto, x2: ancho, y2: rnd() * alto,
        grosor: 2 + rnd() * 10, color,
      });
    }
  }

  return { ancho, alto, fondo, formas };
}
