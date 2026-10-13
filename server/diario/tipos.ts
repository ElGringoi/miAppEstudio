// Tipos de la edición diaria. Los usa la función de Vercel (api/edicion.ts)
// y el cliente (front/src/types.ts los reexporta). Sin dependencias de Node.

export type SeccionId =
  | 'argentina'
  | 'contexto'
  | 'tecnologia'
  | 'internacional'
  | 'deportes'
  | 'ciencia'
  | 'filosofia'
  | 'cultura';

export interface ArticuloEdicion {
  id:        string;
  titulo:    string;
  bajada:    string;
  url:       string;
  fuente:    string;
  fuenteId:  string;
  fecha:     string;          // ISO
  imagen?:   string;
  seccion:   SeccionId;
  tags:      string[];
  idioma:    'es' | 'en';
  palabras?: number;          // largo del texto completo, si el feed lo trae
  texto?:    string[];        // párrafos completos (solo ensayos del seed)
}

export type DeporteId = 'futbol' | 'f1' | 'ufc' | 'tenis';

export interface Competidor {
  nombre:    string;
  abrev?:    string;
  escudo?:   string;
  marcador?: string;
  ganador?:  boolean;
}

export interface EncuentroDeportivo {
  id:          string;
  deporte:     DeporteId;
  competencia: string;
  fecha:       string;        // ISO
  estado:      'pre' | 'in' | 'post';
  titulo:      string;        // "Boca vs River" o "GP de Singapur"
  local?:      Competidor;
  visitante?:  Competidor;
  detalle?:    string;        // "Ganó Verstappen · 1:42:00.785"
  url?:        string;
}

export interface DeportesEdicion {
  resultados: EncuentroDeportivo[];
  proximos:   EncuentroDeportivo[];
}

export interface EdicionDiaria {
  fecha:        string;       // YYYY-MM-DD en hora de Argentina
  generadaEn:   string;       // ISO
  secciones:    Record<SeccionId, ArticuloEdicion[]>;
  deportes:     DeportesEdicion;
  fuentesOk:    number;
  fuentesTotal: number;
  origen?:      'red' | 'respaldo';
}
