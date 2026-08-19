import { useState } from 'react';
import type { FSEntradaDiario, FSPersona, FSGrupo } from '../types';
import { cn } from '../lib/utils';
import { CEREBRO_SECCIONES } from '../utils/constants';
import { CerebroNotas } from './CerebroNotas';
import { CerebroPersonas } from './CerebroPersonas';
import { CerebroGrupos } from './CerebroGrupos';
import { CerebroChat } from './CerebroChat';

type Seccion = typeof CEREBRO_SECCIONES[number]['id'];

interface SegundoCerebroProps {
  entradas:        FSEntradaDiario[];
  onSave:          (data: Omit<FSEntradaDiario, 'id'>, id?: string) => Promise<void>;
  onDelete:        (id: string) => Promise<void>;
  personas:        FSPersona[];
  grupos:          FSGrupo[];
  onSavePersona:   (data: Omit<FSPersona, 'id'>, id?: string) => Promise<void>;
  onDeletePersona: (id: string) => Promise<void>;
  onSaveGrupo:     (data: Omit<FSGrupo, 'id'>, id?: string) => Promise<void>;
  onDeleteGrupo:   (id: string) => Promise<void>;
  onSetMiembros:   (grupoId: string, personaIds: string[]) => Promise<void>;
}

/**
 * Shell del Segundo Cerebro: solo sabe qué sección está activa y reparte props.
 *
 * Cada sección se monta y desmonta al cambiar de pill, así que su estado
 * (selección, edición, showRight) se resetea solo. Eso es deliberado: si no,
 * al volver a Notas desde Personas en mobile aterrizarías en un detalle vacío
 * con la lista escondida.
 */
export function SegundoCerebro(props: SegundoCerebroProps) {
  const [seccion, setSeccion] = useState<Seccion>('notas');

  // La franja va adentro del contenedor de cada sección: la altura de la caja
  // es fija (calc(100vh - 11rem)) y si la franja quedara afuera se pasaría del
  // viewport, con scroll doble en mobile.
  const header = (
    <div className="flex gap-1 p-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto shrink-0">
      {CEREBRO_SECCIONES.map(s => (
        <button key={s.id}
          onClick={() => setSeccion(s.id)}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
            seccion === s.id
              ? 'bg-blue-600 text-white'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >{s.icon} {s.label}</button>
      ))}
    </div>
  );

  if (seccion === 'personas') return (
    <CerebroPersonas
      header={header}
      personas={props.personas}
      grupos={props.grupos}
      entradas={props.entradas}
      onSave={props.onSavePersona}
      onDelete={props.onDeletePersona}
    />
  );

  if (seccion === 'grupos') return (
    <CerebroGrupos
      header={header}
      grupos={props.grupos}
      personas={props.personas}
      entradas={props.entradas}
      onSave={props.onSaveGrupo}
      onDelete={props.onDeleteGrupo}
      onSetMiembros={props.onSetMiembros}
    />
  );

  if (seccion === 'chat') return <CerebroChat header={header} />;

  return (
    <CerebroNotas
      key={seccion}                    /* fuerza remount al alternar Notas/Ideas */
      modo={seccion === 'ideas' ? 'ideas' : 'notas'}
      header={header}
      entradas={props.entradas}
      personas={props.personas}
      onSave={props.onSave}
      onDelete={props.onDelete}
    />
  );
}
