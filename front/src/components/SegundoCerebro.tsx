import { useState, useMemo } from 'react';
import type { FSEntradaDiario, EntradaArea } from '../types';
import { cn } from '../lib/utils';
import { Search, Plus, Trash2, Pencil, ChevronLeft, Link2 } from 'lucide-react';

// ─── PARA metadata ────────────────────────────────────────────────────────────

const AREA_META = [
  { id: 'all'       as const, label: 'Todas',     icon: '📋', color: 'bg-slate-500' },
  { id: 'projects'  as const, label: 'Projects',  icon: '🎯', color: 'bg-blue-500'  },
  { id: 'areas'     as const, label: 'Areas',     icon: '🗂️', color: 'bg-purple-500' },
  { id: 'resources' as const, label: 'Resources', icon: '📚', color: 'bg-emerald-500' },
  { id: 'archive'   as const, label: 'Archive',   icon: '📦', color: 'bg-slate-400'  },
];

// ─── Markdown renderer (inline, sin dependencias) ─────────────────────────────

function inlineMd(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.12);border-radius:3px;padding:1px 5px;font-family:monospace;font-size:0.87em">$1</code>');
}

function renderMarkdown(raw: string): string {
  const lines = raw.split('\n');
  let html = '';
  let inList = false;

  const flushList = () => { if (inList) { html += '</ul>'; inList = false; } };

  for (const line of lines) {
    if (line.startsWith('### ')) {
      flushList();
      html += `<h3 style="font-size:1.05em;font-weight:700;margin:.9em 0 .2em">${inlineMd(line.slice(4))}</h3>`;
    } else if (line.startsWith('## ')) {
      flushList();
      html += `<h2 style="font-size:1.25em;font-weight:800;margin:1.1em 0 .25em">${inlineMd(line.slice(3))}</h2>`;
    } else if (line.startsWith('# ')) {
      flushList();
      html += `<h1 style="font-size:1.5em;font-weight:900;margin:1.3em 0 .3em">${inlineMd(line.slice(2))}</h1>`;
    } else if (line.startsWith('- ')) {
      if (!inList) { html += '<ul style="list-style:disc;padding-left:1.4em;margin:.4em 0">'; inList = true; }
      html += `<li style="margin:.15em 0">${inlineMd(line.slice(2))}</li>`;
    } else if (line.trim() === '') {
      flushList();
      html += '<br/>';
    } else {
      flushList();
      html += `<p style="margin:.4em 0;line-height:1.75">${inlineMd(line)}</p>`;
    }
  }
  flushList();
  return html;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function areaColor(area?: EntradaArea): string {
  return AREA_META.find(a => a.id === area)?.color ?? 'bg-slate-400';
}
function areaLabel(area?: EntradaArea): string {
  return AREA_META.find(a => a.id === area)?.label ?? '';
}
function areaIcon(area?: EntradaArea): string {
  return AREA_META.find(a => a.id === area)?.icon ?? '';
}

function shortDate(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SegundoCerebroProps {
  entradas: FSEntradaDiario[];
  onSave:   (data: Omit<FSEntradaDiario, 'id'>, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SegundoCerebro({ entradas, onSave, onDelete }: SegundoCerebroProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing,  setIsEditing]  = useState(false);
  const [showRight,  setShowRight]  = useState(false);
  const [search,     setSearch]     = useState('');
  const [areaFilter, setAreaFilter] = useState<EntradaArea | 'all'>('all');
  const [tagFilter,  setTagFilter]  = useState<string | null>(null);
  const [form, setForm] = useState<{
    titulo: string; contenido: string; tags: string;
    area: EntradaArea | ''; links: string[];
  }>({ titulo: '', contenido: '', tags: '', area: '', links: [] });
  const [isSaving, setIsSaving] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────

  const sorted = useMemo(() =>
    [...entradas].sort((a, b) => {
      const ta = a.updatedAt ?? a.fecha;
      const tb = b.updatedAt ?? b.fecha;
      return tb > ta ? 1 : tb < ta ? -1 : 0;
    }), [entradas]);

  const filtered = useMemo(() => {
    let list = sorted;
    if (areaFilter !== 'all') list = list.filter(e => e.area === areaFilter);
    if (tagFilter)            list = list.filter(e => e.tags?.includes(tagFilter) ?? false);
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
    entradas.forEach(e => e.tags?.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [entradas]);

  const selectedNote = useMemo(
    () => entradas.find(e => e.id === selectedId) ?? null,
    [entradas, selectedId]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openNote(id: string) {
    setSelectedId(id);
    setIsEditing(false);
    setShowRight(true);
  }

  function openNewNote() {
    setSelectedId(null);
    setForm({ titulo: '', contenido: '', tags: '', area: '', links: [] });
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
      const data: Omit<FSEntradaDiario, 'id'> = {
        fecha:     selectedNote?.fecha ?? today,
        updatedAt: today,
        contenido: form.contenido.trim(),
        ...(form.titulo.trim() ? { titulo: form.titulo.trim() } : {}),
        ...(tags.length > 0    ? { tags }                       : {}),
        ...(form.area          ? { area: form.area as EntradaArea } : {}),
        ...(form.links.length  ? { links: form.links }          : {}),
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
      style={{ height: 'calc(100vh - 11rem)', minHeight: '520px' }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <div className={cn(
        'flex flex-col border-r border-slate-200 dark:border-slate-700 shrink-0',
        'w-full md:w-72 lg:w-80',
        showRight ? 'hidden md:flex' : 'flex'
      )}>
        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Buscar notas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Area filter */}
        <div className="flex gap-1 p-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          {AREA_META.map(a => (
            <button key={a.id}
              onClick={() => { setAreaFilter(a.id as EntradaArea | 'all'); setTagFilter(null); }}
              className={cn(
                'shrink-0 px-2 py-1 rounded-md text-xs font-semibold transition-all',
                areaFilter === a.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >{a.icon} {a.label}</button>
          ))}
        </div>

        {/* Tag pills */}
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

        {/* Note list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm mt-10 px-4">
              {entradas.length === 0 ? 'Aún no hay notas.' : 'Sin resultados.'}
            </p>
          ) : filtered.map(note => (
            <button key={note.id} onClick={() => openNote(note.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                selectedId === note.id && 'bg-blue-50 dark:bg-blue-900/20 border-l-[3px] border-l-blue-500'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                  {note.titulo || 'Sin título'}
                </span>
                <span className="text-xs text-slate-400 shrink-0">{shortDate(note.updatedAt ?? note.fecha)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {note.contenido.slice(0, 70)}
              </p>
              {note.area && (
                <span className={cn('inline-block mt-1 px-1.5 py-0.5 rounded text-white text-[10px] font-bold', areaColor(note.area))}>
                  {areaIcon(note.area)} {areaLabel(note.area)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* New note button */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={openNewNote}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
          >
            <Plus className="w-4 h-4" /> Nueva nota
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
      <div className={cn(
        'flex-1 flex-col overflow-y-auto',
        showRight ? 'flex' : 'hidden md:flex'
      )}>

        {/* A) Empty state */}
        {!selectedNote && !isEditing && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <span className="text-6xl">🧠</span>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Segundo Cerebro</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Capturá ideas, notas de estudio, recursos y proyectos con soporte Markdown, tags y carpetas PARA.
            </p>
            <button onClick={openNewNote}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Crear primera nota
            </button>
          </div>
        )}

        {/* B) View mode */}
        {selectedNote && !isEditing && (
          <div className="flex flex-col h-full">
            {/* Actions bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowRight(false)}
                className="md:hidden flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 mr-2"
              >
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>
              <div className="flex-1" />
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
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                {selectedNote.titulo || 'Sin título'}
              </h1>

              {/* Meta: area + tags + date */}
              <div className="flex flex-wrap items-center gap-2 mb-5 text-sm">
                {selectedNote.area && (
                  <span className={cn('px-2 py-0.5 rounded text-white text-xs font-bold', areaColor(selectedNote.area))}>
                    {areaIcon(selectedNote.area)} {areaLabel(selectedNote.area)}
                  </span>
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

              {/* Markdown content */}
              <div
                className="prose-sm text-slate-700 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedNote.contenido) }}
              />

              {/* Related notes */}
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
            </div>
          </div>
        )}

        {/* C) Edit mode */}
        {isEditing && (
          <div className="flex flex-col h-full">
            {/* Edit actions bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowRight(false)}
                className="md:hidden flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 flex-1">
                {selectedNote ? 'Editar nota' : 'Nueva nota'}
              </span>
              <button onClick={cancelEdit}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >Cancelar</button>
              <button onClick={handleSave} disabled={!form.contenido.trim() || isSaving}
                className="px-4 py-1.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
              >{isSaving ? 'Guardando...' : selectedNote ? 'Actualizar' : 'Crear'}</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Título */}
              <input
                className="w-full text-2xl font-black bg-transparent outline-none border-b-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 pb-2 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors"
                placeholder="Título (opcional)"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              />

              {/* Área PARA */}
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
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tags</label>
                <input
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                  placeholder="ej: filosofía, ia, productividad"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                />
              </div>

              {/* Contenido Markdown */}
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

              {/* Related notes */}
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
      </div>
    </div>
  );
}
