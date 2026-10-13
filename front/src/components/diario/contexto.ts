// Contexto del Diario: preferencias y acciones que necesitan todas las piezas.

import { createContext, useContext } from 'react';
import type { ArticuloEdicion, ArticuloGuardado, DiarioReaction, FSDiarioPrefs } from '../../types';

export interface DiarioAcciones {
  prefs:     FSDiarioPrefs;
  terminos:  string[];     // temas favoritos, para resaltar en las bajadas
  onReact:   (artId: string, reaction: DiarioReaction, tags: string[]) => void;
  onGuardar: (art: ArticuloEdicion | ArticuloGuardado) => void;
}

export const DiarioContexto = createContext<DiarioAcciones | null>(null);

export function useDiario(): DiarioAcciones {
  const ctx = useContext(DiarioContexto);
  if (!ctx) throw new Error('useDiario fuera de DiarioContexto');
  return ctx;
}
