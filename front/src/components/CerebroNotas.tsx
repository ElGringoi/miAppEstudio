import { useState, useMemo } from 'react';
import type { FSEntradaDiario, EntradaArea, FSPersona } from '../types';
import { cn } from '../lib/utils';
import { Plus, Trash2, Pencil, Link2, X } from 'lucide-react';
import { AREA_META } from '../utils/constants';
import { renderMarkdown } from '../utils/markdown';
import { shortDate } from '../utils/helpers';
import { CerebroLayout, CerebroSearch, PanelActions, CerebroVacio, NuevoButton } from './CerebroLayout';

const areaMeta  = (area?: EntradaArea) => AREA_META.find(a => a.id === area);
const areaColor = (area?: EntradaArea) => areaMeta(area)?.color ?? 'bg-slate-400';
const areaLabel = (area?: EntradaArea) => areaMeta(area)?.label ?? '';
const areaIcon  = (area?: EntradaArea) => areaMeta(area)?.icon  ?? '';

interface CerebroNotasProps {
  modo:     'notas' | 'ideas';
  header:   React.ReactNode;
  entradas: FSEntradaDiario[];
  personas: FSPersona[];
  onSave:   (data: Omit<FSEntradaDiario, 'id'>, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function CerebroNotas({ modo, header, entradas, personas, onSave, onDelete }: CerebroNotasProps) {
  const esIdeas = modo === 'ideas';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing,  setIsEditing]  = useState(false);
  const [showRight,  setShowRight]  = useState(false);
  const [search,     setSearch]     = useState('');
  const [areaFilter, setAreaFilter] = useState<EntradaArea | null>(null);
  const [tagFilter,  setTagFilter]  = useState<string | null>(null);
  const [form, setForm] = useState<{
    titulo: string; contenido: string; tags: string;
    area: EntradaArea | ''; links: string[];
  }>({ titulo: '', contenido: '', tags: '', area: '', links: [] });
  const [isSaving, setIsSaving] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────

  // En Ideas la sección ya es el filtro: solo las notas de 'projects'.
  const base = useMemo(
    () => esIdeas ? entradas.filter(e => e.area === 'projects') : entradas,
    [entradas, esIdeas]
  );

  const sorted = useMemo(() =>
    [...base].sort((a, b) => {
      const ta = a.updatedAt ?? a.fecha;
      const tb = b.updatedAt ?? b.fecha;
      return tb > ta ? 1 : tb < ta ? -1 : 0;
    }), [base]);

  const filtered = useMemo(() => {
    let list = sorted;
    if (areaFilter) list = list.filter(e => e.area === areaFilter);
    if (tagFilter)  list = list.filter(e => e.tags?.includes(tagFilter) ?? false);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.titulo ?? '').toLowerCase().includes(q) ||
        e.contenido.toLowerCase().includes(q) ||
        (e.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [sorted, areaFilter, tagFilter, search]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    base.forEach(e => e.tags?.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [base]);

  const selectedNote = useMemo(
    () => entradas.find(e => e.id === selectedId) ?? null,
    [entradas, selectedId]
  );

  // Personas linkeadas a la nota abierta. El link vive en persona.links.
  const personasDeNota = useMemo(
    () => selectedNote ? personas.filter(p => p.links?.includes(selectedNote.id)) : [],
    [personas, selectedNote]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openNote(id: string) {
    setSelectedId(id);
    setIsEditing(false);
    setShowRight(true);
  }

  function openNewNote() {
    setSelectedId(null);
    // En Ideas la nota nueva nace en 'projects', si no desaparecería al guardar.
    setForm({ titulo: '', contenido: '', tags: '', area: esIdeas ? 'projects' : '', links: [] });
    setIsEditing(true);
    setShowRight(true);
  }

  function openEditNote(note: FSEntradaDiario) {
    setForm({
      titulo:    note.titulo ?? '',
      contenido: note.contenido,
      tags:      (note.tags ?? []).join(', '),
      area:      note.area ?? '',
      links:     note.links ?? [],
    });
    setIsEditing(true);
  }

  async function handleSave() {
    if (!form.contenido.trim()) return;
    setIsSaving(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const today = new Date().toISOString().slice(0, 10);
      // Los arrays van siempre, aunque estén vacíos: con updateDoc una key
      // ausente deja el valor viejo, así que omitirlos impide vaciarlos.
      const data: Omit<FSEntradaDiario, 'id'> = {
        fecha:     selectedNote?.fecha ?? today,
        updatedAt: today,
        contenido: form.contenido.trim(),
        titulo:    form.titulo.trim(),
        tags,
        links:     form.links,
        ...(form.area ? { area: form.area as EntradaArea } : {}),
      };
      await onSave(data, selectedId ?? undefined);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta nota?')) return;
    await onDelete(id);
    if (selectedId === id) { setSelectedId(null); setShowRight(false); }
  }

  function cancelEdit() {
    setIsEditing(false);
    if (!selectedNote) setShowRight(false);
  }

  function toggleLink(noteId: string) {
    setForm(f => ({
      ...f,
      links: f.links.includes(noteId)
        ? f.links.filter(l => l !== noteId)
        : [...f.links, noteId],
    }));
  }

  // ── Panel izquierdo ────────────────────────────────────────────────────────

  const left = (
    <>
      <CerebroSearch
        value={search}
        onChange={setSearch}
        placeholder={esIdeas ? 'Buscar ideas...' : 'Buscar notas...'}
      />

      {/* Filtros activos. El de área se activa clickeando el badge de una nota. */}
      {(areaFilter || tagFilter) && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
          {areaFilter && (
            <button onClick={() => setAreaFilter(null)}
              className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-white text-xs font-bold', areaColor(areaFilter))}
            >
              {areaIcon(areaFilter)} {areaLabel(areaFilter)} <X className="w-3 h-3" />
            </button>
          )}
          {tagFilter && (
            <button onClick={() => setTagFilter(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-medium"
            >
              #{tagFilter} <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
          {allTags.map(tag => (
            <button key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium transition-all',
                tagFilter === tag
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
              )}
            >#{tag}</button>
          ))}
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 text-sm mt-10 px-4">
            {base.length === 0
              ? (esIdeas ? 'Aún no hay ideas.' : 'Aún no hay notas.')
              : 'Sin resultados.'}
          </p>
        ) : filtered.map(note => (
          <div key={note.id}
            className={cn(
              'border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
              selectedId === note.id && 'bg-blue-50 dark:bg-blue-900/20 border-l-[3px] border-l-blue-500'
            )}
          >
            <button onClick={() => openNote(note.id)} className="w-full text-left px-4 pt-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                  {note.titulo || 'Sin título'}
                </span>
                <span className="text-xs text-slate-400 shrink-0">{shortDate(note.updatedAt ?? note.fecha)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{note.contenido.slice(0, 70)}</p>
            </button>
            <div className="px-4 pb-3 pt-1">
              {note.area && !esIdeas && (
                <button
                  onClick={() => setAreaFilter(note.area!)}
                  title={`Filtrar por ${areaLabel(note.area)}`}
                  className={cn('inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-bold', areaColor(note.area))}
                >
                  {areaIcon(note.area)} {areaLabel(note.area)}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <NuevoButton
        onClick={openNewNote}
        label={esIdeas ? 'Nueva idea' : 'Nueva nota'}
        icon={<Plus className="w-4 h-4" />}
      />
    </>
  );

  // ── Panel derecho ──────────────────────────────────────────────────────────

  const right = (
    <>
      {!selectedNote && !isEditing && (
        <CerebroVacio
          icono={esIdeas ? '💡' : '📝'}
          titulo={esIdeas ? 'Ideas y proyectos' : 'Tus notas'}
          texto={esIdeas
            ? 'Todo lo que querés arrancar, en un solo lugar. Soporta Markdown, tags y links entre notas.'
            : 'Capturá ideas, notas de estudio y recursos con soporte Markdown, tags y links entre notas.'}
          cta={
            <button onClick={openNewNote}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> {esIdeas ? 'Crear primera idea' : 'Crear primera nota'}
            </button>
          }
        />
      )}

      {selectedNote && !isEditing && (
        <div className="flex flex-col h-full">
          <PanelActions onBack={() => setShowRight(false)}>
            <button onClick={() => openEditNote(selectedNote)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Pencil className="w-4 h-4" /> Editar
            </button>
            <button onClick={() => handleDelete(selectedNote.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </PanelActions>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
              {selectedNote.titulo || 'Sin título'}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mb-5 text-sm">
              {selectedNote.area && (
                <button
                  onClick={() => { setAreaFilter(selectedNote.area!); setShowRight(false); }}
                  className={cn('px-2 py-0.5 rounded text-white text-xs font-bold', areaColor(selectedNote.area))}
                >
                  {areaIcon(selectedNote.area)} {areaLabel(selectedNote.area)}
                </button>
              )}
              {(selectedNote.tags ?? []).map(tag => (
                <button key={tag} onClick={() => { setTagFilter(tag); setShowRight(false); }}
                  className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                >#{tag}</button>
              ))}
              <span className="ml-auto text-slate-400 text-xs">
                {shortDate(selectedNote.updatedAt ?? selectedNote.fecha)}
              </span>
            </div>

            <div
              className="prose-sm text-slate-700 dark:text-slate-300"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedNote.contenido) }}
            />

            {(selectedNote.links ?? []).length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5" /> Notas relacionadas
                </p>
                <div className="flex flex-wrap gap-2">
                  {(selectedNote.links ?? []).map(linkId => {
                    const linked = entradas.find(e => e.id === linkId);
                    if (!linked) return null;
                    return (
                      <button key={linkId} onClick={() => openNote(linkId)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        🔗 {linked.titulo || 'Sin título'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {personasDeNota.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  👤 Personas relacionadas
                </p>
                <div className="flex flex-wrap gap-2">
                  {personasDeNota.map(p => (
                    <span key={p.id}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                    >
                      {p.avatar ?? '👤'} {p.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="flex flex-col h-full">
          <PanelActions
            onBack={() => setShowRight(false)}
            title={selectedNote ? 'Editar nota' : (esIdeas ? 'Nueva idea' : 'Nueva nota')}
          >
            <button onClick={cancelEdit}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >Cancelar</button>
            <button onClick={handleSave} disabled={!form.contenido.trim() || isSaving}
              className="px-4 py-1.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >{isSaving ? 'Guardando...' : selectedNote ? 'Actualizar' : 'Crear'}</button>
          </PanelActions>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <input
              className="w-full text-2xl font-black bg-transparent outline-none border-b-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 pb-2 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors"
              placeholder="Título (opcional)"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            />

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Área</label>
              <div className="flex flex-wrap gap-1.5">
                {AREA_META.filter(a => a.id !== 'all').map(a => (
                  <button key={a.id}
                    onClick={() => setForm(f => ({ ...f, area: f.area === a.id ? '' : a.id as EntradaArea }))}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                      form.area === a.id ? cn(a.color, 'text-white') : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >{a.icon} {a.label}</button>
                ))}
              </div>
              {esIdeas && form.area !== 'projects' && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
                  Si le sacás el área Ideas, la nota deja de aparecer en esta sección.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tags</label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                placeholder="ej: filosofía, ia, productividad"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Contenido <span className="normal-case font-normal text-slate-400">(Markdown: **bold**, _em_, `code`, # Heading, - lista)</span>
              </label>
              <textarea
                className="w-full px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none placeholder:text-slate-400"
                style={{ minHeight: '220px' }}
                placeholder="Escribí tu nota en Markdown..."
                value={form.contenido}
                onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
              />
            </div>

            {entradas.filter(e => e.id !== selectedId).length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Notas relacionadas
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {entradas.filter(e => e.id !== selectedId).map(note => (
                    <button key={note.id}
                      onClick={() => toggleLink(note.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                        form.links.includes(note.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      )}
                    >
                      {form.links.includes(note.id) ? '✓ ' : ''}{note.titulo || 'Sin título'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return <CerebroLayout header={header} showRight={showRight} left={left} right={right} />;
}
