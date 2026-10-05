import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { FSGrupo, FSPersona, FSEntradaDiario, FSPendiente, FSFechaClave } from '../types';
import { cn } from '../lib/utils';
import { Plus, Trash2, Pencil, Link2, Users } from 'lucide-react';
import { renderMarkdown } from '../utils/markdown';
import { CerebroLayout, CerebroSearch, PanelActions, CerebroVacio, NuevoButton } from './CerebroLayout';
import { PendientesEditor, PendientesList, FechasClaveEditor, FechasClaveList } from './CerebroPendientes';

type FormState = {
  nombre: string; icono: string; descripcion: string; notas: string; tags: string;
  pendientes: FSPendiente[]; fechasClave: FSFechaClave[]; links: string[];
};

const FORM_VACIO: FormState = {
  nombre: '', icono: '', descripcion: '', notas: '', tags: '',
  pendientes: [], fechasClave: [], links: [],
};

interface Props {
  header:        ReactNode;
  grupos:        FSGrupo[];
  personas:      FSPersona[];
  entradas:      FSEntradaDiario[];
  onSave:        (data: Omit<FSGrupo, 'id'>, id?: string) => Promise<void>;
  onDelete:      (id: string) => Promise<void>;
  onSetMiembros: (grupoId: string, personaIds: string[]) => Promise<void>;
}

export function CerebroGrupos({ header, grupos, personas, entradas, onSave, onDelete, onSetMiembros }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing,  setIsEditing]  = useState(false);
  const [showRight,  setShowRight]  = useState(false);
  const [search,     setSearch]     = useState('');
  const [form,       setForm]       = useState<FormState>(FORM_VACIO);
  const [isSaving,   setIsSaving]   = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const list = [...grupos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(g =>
      g.nombre.toLowerCase().includes(q) ||
      (g.descripcion ?? '').toLowerCase().includes(q) ||
      (g.notas ?? '').toLowerCase().includes(q)
    );
  }, [grupos, search]);

  const selected = useMemo(
    () => grupos.find(g => g.id === selectedId) ?? null,
    [grupos, selectedId]
  );

  // La membresía vive en persona.grupos, así que los miembros se derivan.
  const miembros = useMemo(
    () => selected
      ? personas.filter(p => p.grupos?.includes(selected.id))
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      : [],
    [personas, selected]
  );

  const notasDeSelected = useMemo(
    () => (selected?.links ?? []).map(id => entradas.find(e => e.id === id)).filter(Boolean) as FSEntradaDiario[],
    [selected, entradas]
  );

  const contarMiembros = (grupoId: string) =>
    personas.filter(p => p.grupos?.includes(grupoId)).length;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openGrupo(id: string) {
    setSelectedId(id); setIsEditing(false); setShowRight(true);
  }

  function openNuevo() {
    setSelectedId(null); setForm(FORM_VACIO); setIsEditing(true); setShowRight(true);
  }

  function openEditar(g: FSGrupo) {
    setForm({
      nombre:      g.nombre,
      icono:       g.icono ?? '',
      descripcion: g.descripcion ?? '',
      notas:       g.notas ?? '',
      tags:        (g.tags ?? []).join(', '),
      pendientes:  g.pendientes ?? [],
      fechasClave: g.fechasClave ?? [],
      links:       g.links ?? [],
    });
    setIsEditing(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) return;
    setIsSaving(true);
    try {
      // Arrays siempre presentes — ver el comentario en CerebroPersonas.
      const data: Omit<FSGrupo, 'id'> = {
        nombre:      form.nombre.trim(),
        icono:       form.icono.trim(),
        descripcion: form.descripcion.trim(),
        notas:       form.notas.trim(),
        tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
        pendientes:  form.pendientes,
        fechasClave: form.fechasClave,
        links:       form.links,
      };
      await onSave(data, selectedId ?? undefined);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar este grupo? Las personas no se borran, solo dejan de pertenecer.')) return;
    await onDelete(id);
    if (selectedId === id) { setSelectedId(null); setShowRight(false); }
  }

  function cancelEdit() {
    setIsEditing(false);
    if (!selected) setShowRight(false);
  }

  async function toggleMiembro(personaId: string) {
    if (!selected) return;
    const actuales = personas.filter(p => p.grupos?.includes(selected.id)).map(p => p.id);
    const next = actuales.includes(personaId)
      ? actuales.filter(x => x !== personaId)
      : [...actuales, personaId];
    await onSetMiembros(selected.id, next);
  }

  function toggleLink(id: string) {
    setForm(f => ({
      ...f,
      links: f.links.includes(id) ? f.links.filter(x => x !== id) : [...f.links, id],
    }));
  }

  // ── Panel izquierdo ────────────────────────────────────────────────────────

  const left = (
    <>
      <CerebroSearch value={search} onChange={setSearch} placeholder="Buscar grupos..." />

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 text-sm mt-10 px-4">
            {grupos.length === 0 ? 'Aún no hay grupos.' : 'Sin resultados.'}
          </p>
        ) : filtered.map(g => {
          const n = contarMiembros(g.id);
          const debe = (g.pendientes ?? []).filter(x => !x.saldado).length;
          return (
            <button key={g.id} onClick={() => openGrupo(g.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                selectedId === g.id && 'bg-blue-50 dark:bg-blue-900/20 border-l-[3px] border-l-blue-500'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg shrink-0">{g.icono || '👥'}</span>
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate flex-1">
                  {g.nombre}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1 ml-7">
                <span className="px-1.5 py-0.5 rounded bg-slate-500 text-white text-[10px] font-bold">
                  {n} {n === 1 ? 'miembro' : 'miembros'}
                </span>
                {debe > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold">
                    {debe} pendiente{debe > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <NuevoButton onClick={openNuevo} label="Nuevo grupo" icon={<Plus className="w-4 h-4" />} />
    </>
  );

  // ── Panel derecho ──────────────────────────────────────────────────────────

  const right = (
    <>
      {!selected && !isEditing && (
        <CerebroVacio
          icono="👥"
          titulo="Grupos"
          texto="Familia, gym, laburo, la banda. Agrupan personas y además tienen sus propias notas y pendientes."
          cta={
            <button onClick={openNuevo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Crear primer grupo
            </button>
          }
        />
      )}

      {selected && !isEditing && (
        <div className="flex flex-col h-full">
          <PanelActions onBack={() => setShowRight(false)}>
            <button onClick={() => openEditar(selected)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Pencil className="w-4 h-4" /> Editar
            </button>
            <button onClick={() => handleDelete(selected.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </PanelActions>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selected.icono || '👥'}</span>
              <div className="min-w-0">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white truncate">
                  {selected.nombre}
                </h1>
                {selected.descripcion && (
                  <p className="text-sm text-slate-400">{selected.descripcion}</p>
                )}
              </div>
            </div>

            {(selected.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(selected.tags ?? []).map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <Bloque titulo={<><Users className="w-3.5 h-3.5 inline" /> Miembros ({miembros.length})</>}>
              {personas.length === 0 ? (
                <p className="text-sm text-slate-400">Primero agregá personas en la sección Personas.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {personas
                    .slice()
                    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
                    .map(p => {
                      const esMiembro = p.grupos?.includes(selected.id) ?? false;
                      return (
                        <button key={p.id} onClick={() => toggleMiembro(p.id)}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                            esMiembro
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          )}
                        >
                          {esMiembro ? '✓ ' : ''}{p.avatar ?? '👤'} {p.nombre}
                        </button>
                      );
                    })}
                </div>
              )}
            </Bloque>

            {(selected.pendientes ?? []).length > 0 && (
              <Bloque titulo="Pendientes del grupo">
                <PendientesList pendientes={selected.pendientes ?? []} />
              </Bloque>
            )}

            {(selected.fechasClave ?? []).length > 0 && (
              <Bloque titulo="Fechas clave">
                <FechasClaveList fechas={selected.fechasClave ?? []} />
              </Bloque>
            )}

            {selected.notas && (
              <Bloque titulo="Notas del grupo">
                <div
                  className="prose-sm text-slate-700 dark:text-slate-300"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.notas) }}
                />
              </Bloque>
            )}

            {notasDeSelected.length > 0 && (
              <Bloque titulo={<><Link2 className="w-3.5 h-3.5 inline" /> Notas relacionadas</>}>
                <div className="flex flex-wrap gap-2">
                  {notasDeSelected.map(n => (
                    <span key={n.id} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                      🔗 {n.titulo || 'Sin título'}
                    </span>
                  ))}
                </div>
              </Bloque>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="flex flex-col h-full">
          <PanelActions
            onBack={() => setShowRight(false)}
            title={selected ? 'Editar grupo' : 'Nuevo grupo'}
          >
            <button onClick={cancelEdit}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >Cancelar</button>
            <button onClick={handleSave} disabled={!form.nombre.trim() || isSaving}
              className="px-4 py-1.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >{isSaving ? 'Guardando...' : selected ? 'Actualizar' : 'Crear'}</button>
          </PanelActions>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="flex gap-2">
              <input
                className="w-16 text-center text-2xl px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="👥"
                maxLength={4}
                value={form.icono}
                onChange={e => setForm(f => ({ ...f, icono: e.target.value }))}
              />
              <input
                className="flex-1 text-2xl font-black bg-transparent outline-none border-b-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 pb-2 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors"
                placeholder="Nombre del grupo"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            <Campo label="Descripción">
              <input
                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                placeholder="ej: los del gym de la mañana"
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              />
            </Campo>

            {selected && (
              <p className="text-[11px] text-slate-400">
                Los miembros se editan desde la ficha del grupo, no acá.
              </p>
            )}

            <Campo label="Pendientes del grupo">
              <PendientesEditor
                pendientes={form.pendientes}
                onChange={next => setForm(f => ({ ...f, pendientes: next }))}
              />
            </Campo>

            <Campo label="Fechas clave">
              <FechasClaveEditor
                fechas={form.fechasClave}
                onChange={next => setForm(f => ({ ...f, fechasClave: next }))}
              />
            </Campo>

            <Campo label="Tags">
              <input
                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                placeholder="ej: gym, finde"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              />
            </Campo>

            <Campo label={<>Notas <span className="normal-case font-normal text-slate-400">(Markdown)</span></>}>
              <textarea
                className="w-full px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none placeholder:text-slate-400"
                style={{ minHeight: '140px' }}
                placeholder="Historia del grupo, acuerdos, lo que sea..."
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              />
            </Campo>

            {entradas.length > 0 && (
              <Campo label="Notas relacionadas">
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {entradas.map(n => (
                    <button key={n.id} onClick={() => toggleLink(n.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                        form.links.includes(n.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      )}
                    >
                      {form.links.includes(n.id) ? '✓ ' : ''}{n.titulo || 'Sin título'}
                    </button>
                  ))}
                </div>
              </Campo>
            )}
          </div>
        </div>
      )}
    </>
  );

  return <CerebroLayout header={header} showRight={showRight} left={left} right={right} />;
}

function Bloque({ titulo, children }: { titulo: ReactNode; children: ReactNode }) {
  return (
    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 first:pt-0 first:border-t-0">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{titulo}</p>
      {children}
    </div>
  );
}

function Campo({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}
