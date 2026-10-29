import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { FSPersona, FSGrupo, FSRelacion, FSEntradaDiario, FSPendiente, FSFechaClave, FSSpark, FSConexion } from '../types';
import { cn } from '../lib/utils';
import { Plus, Trash2, Pencil, Link2, Phone, Mail, Settings2 } from 'lucide-react';
import { RELACION_COLORES } from '../utils/constants';
import { renderMarkdown } from '../utils/markdown';
import { proximaOcurrencia } from '../utils/helpers';
import { CerebroLayout, CerebroSearch, PanelActions, CerebroVacio, NuevoButton, FilaAcciones } from './CerebroLayout';
import { PendientesEditor, PendientesList, FechasClaveEditor, FechasClaveList } from './CerebroPendientes';
import { hoyLocal } from '../utils/fecha';

// Usa proximaOcurrencia (fecha de Argentina): el cumpleaños de hoy da 0 días, no 365.
function getCumpleanoProximo(fechasClave?: FSFechaClave[]) {
  if (!fechasClave) return null;
  const cumples = fechasClave.filter(f => f.tipo === 'cumple');
  if (cumples.length === 0) return null;

  const proximosConDias = cumples.map(f => {
    const prox = proximaOcurrencia(f.fecha, true)!;
    return { f, dias: prox.dias, fecha: new Date(prox.iso + 'T00:00:00') };
  });

  const prox = proximosConDias.sort((a, b) => a.dias - b.dias)[0];
  return prox && prox.dias <= 30 ? prox : null;
}

type FormState = {
  nombre: string; apodo: string; avatar: string; relacion: string;
  comoLaConoci: string; dondeLaConoci: string; telefono: string; email: string;
  notas: string; tags: string;
  pendientes: FSPendiente[]; fechasClave: FSFechaClave[];
  sparks: FSSpark[]; conexiones: FSConexion[];
  links: string[]; grupos: string[];
};

const FORM_VACIO: FormState = {
  nombre: '', apodo: '', avatar: '', relacion: '',
  comoLaConoci: '', dondeLaConoci: '', telefono: '', email: '',
  notas: '', tags: '', pendientes: [], fechasClave: [], sparks: [], conexiones: [], links: [], grupos: [],
};

interface Props {
  header:   ReactNode;
  personas: FSPersona[];
  grupos:   FSGrupo[];
  entradas: FSEntradaDiario[];
  onSave:   (data: Omit<FSPersona, 'id'>, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  /** Guarda solo los pendientes o las fechas, desde la ficha, sin pasar por el formulario. */
  onPatch:  (id: string, campos: Pick<FSPersona, 'pendientes' | 'fechasClave'>) => Promise<void>;
  relaciones: FSRelacion[];
  onGuardarRelaciones: (lista: FSRelacion[]) => Promise<void>;
}

export function CerebroPersonas({ header, personas, grupos, entradas, onSave, onDelete, onPatch, relaciones, onGuardarRelaciones }: Props) {
  const relMeta = (r?: string) => relaciones.find(x => x.id === r);
  const [editandoRel, setEditandoRel] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing,  setIsEditing]  = useState(false);
  const [showRight,  setShowRight]  = useState(false);
  const [search,     setSearch]     = useState('');
  const [relFilter,  setRelFilter]  = useState<string | null>(null);
  const [form,       setForm]       = useState<FormState>(FORM_VACIO);
  const [isSaving,   setIsSaving]   = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...personas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    if (relFilter) list = list.filter(p => p.relacion === relFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.apodo ?? '').toLowerCase().includes(q) ||
        (p.notas ?? '').toLowerCase().includes(q) ||
        (p.comoLaConoci ?? '').toLowerCase().includes(q) ||
        (p.tags ?? []).some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [personas, relFilter, search]);

  // Solo las relaciones que alguien está usando.
  const relacionesEnUso = useMemo(() => {
    const s = new Set(personas.map(p => p.relacion).filter(Boolean) as string[]);
    return relaciones.filter(r => s.has(r.id));
  }, [personas, relaciones]);

  const selected = useMemo(
    () => personas.find(p => p.id === selectedId) ?? null,
    [personas, selectedId]
  );

  // Render defensivo: un grupo puede haber sido borrado desde otra pestaña.
  const gruposDeSelected = useMemo(
    () => (selected?.grupos ?? []).map(id => grupos.find(g => g.id === id)).filter(Boolean) as FSGrupo[],
    [selected, grupos]
  );

  const notasDeSelected = useMemo(
    () => (selected?.links ?? []).map(id => entradas.find(e => e.id === id)).filter(Boolean) as FSEntradaDiario[],
    [selected, entradas]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openPersona(id: string) {
    setSelectedId(id); setIsEditing(false); setShowRight(true);
  }

  function openNueva() {
    setSelectedId(null); setForm(FORM_VACIO); setIsEditing(true); setShowRight(true);
  }

  function openEditar(p: FSPersona) {
    setForm({
      nombre:        p.nombre,
      apodo:         p.apodo ?? '',
      avatar:        p.avatar ?? '',
      relacion:      p.relacion ?? '',
      comoLaConoci:  p.comoLaConoci ?? '',
      dondeLaConoci: p.dondeLaConoci ?? '',
      telefono:      p.telefono ?? '',
      email:         p.email ?? '',
      notas:         p.notas ?? '',
      tags:          (p.tags ?? []).join(', '),
      pendientes:    p.pendientes ?? [],
      fechasClave:   p.fechasClave ?? [],
      sparks:        p.sparks ?? [],
      conexiones:    p.conexiones ?? [],
      links:         p.links ?? [],
      grupos:        p.grupos ?? [],
    });
    setIsEditing(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) return;
    setIsSaving(true);
    try {
      // Los arrays van siempre, aunque estén vacíos: con updateDoc una key
      // ausente deja el valor viejo, así que omitirlos impide vaciarlos.
      // Los escalares vacíos van como '' y App.tsx los convierte en deleteField.
      const data: Omit<FSPersona, 'id'> = {
        nombre:        form.nombre.trim(),
        apodo:         form.apodo.trim(),
        avatar:        form.avatar.trim(),
        relacion:      form.relacion.trim(),
        comoLaConoci:  form.comoLaConoci.trim(),
        dondeLaConoci: form.dondeLaConoci.trim(),
        telefono:      form.telefono.trim(),
        email:         form.email.trim(),
        notas:         form.notas.trim(),
        tags:          form.tags.split(',').map(t => t.trim()).filter(Boolean),
        pendientes:    form.pendientes,
        fechasClave:   form.fechasClave,
        sparks:        form.sparks,
        conexiones:    form.conexiones,
        links:         form.links,
        grupos:        form.grupos,
      };
      await onSave(data, selectedId ?? undefined);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta persona?')) return;
    await onDelete(id);
    if (selectedId === id) { setSelectedId(null); setShowRight(false); }
  }

  function cancelEdit() {
    setIsEditing(false);
    if (!selected) setShowRight(false);
  }

  function toggleEnArray(campo: 'links' | 'grupos', id: string) {
    setForm(f => ({
      ...f,
      [campo]: f[campo].includes(id) ? f[campo].filter(x => x !== id) : [...f[campo], id],
    }));
  }

  // ── Panel izquierdo ────────────────────────────────────────────────────────

  const left = (
    <>
      <CerebroSearch value={search} onChange={setSearch} placeholder="Buscar personas..." />

      {relacionesEnUso.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
          {relacionesEnUso.map(r => (
            <button key={r.id}
              onClick={() => setRelFilter(relFilter === r.id ? null : r.id)}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium transition-all',
                relFilter === r.id
                  ? cn(r.color, 'text-white')
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >{r.icon} {r.label}</button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 text-sm mt-10 px-4">
            {personas.length === 0 ? 'Aún no hay personas.' : 'Sin resultados.'}
          </p>
        ) : filtered.map(p => {
          // La fecha clave más próxima, para el badge de la lista.
          const prox = (p.fechasClave ?? [])
            .map(f => ({ f, o: proximaOcurrencia(f.fecha, f.anual) }))
            .filter(x => x.o && x.o.dias <= 30)
            .sort((a, b) => a.o!.dias - b.o!.dias)[0];
          const debe = (p.pendientes ?? []).filter(x => !x.saldado).length;

          return (
            <div key={p.id}
              className={cn(
                'group flex items-start gap-1 pr-2 border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                selectedId === p.id && 'bg-blue-50 dark:bg-blue-900/20 border-l-[3px] border-l-blue-500'
              )}
            >
            <button onClick={() => openPersona(p.id)} className="flex-1 min-w-0 text-left pl-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-lg shrink-0">{p.avatar || '👤'}</span>
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate flex-1">
                  {p.nombre}{p.apodo ? ` (${p.apodo})` : ''}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1 ml-7">
                {relMeta(p.relacion) && (
                  <span className={cn('px-1.5 py-0.5 rounded text-white text-[10px] font-bold', relMeta(p.relacion)!.color)}>
                    {relMeta(p.relacion)!.icon} {relMeta(p.relacion)!.label}
                  </span>
                )}
                {debe > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold">
                    {debe} pendiente{debe > 1 ? 's' : ''}
                  </span>
                )}
                {prox && (
                  <span className="px-1.5 py-0.5 rounded bg-pink-500 text-white text-[10px] font-bold">
                    🎂 {prox.o!.dias === 0 ? 'hoy' : `en ${prox.o!.dias}d`}
                  </span>
                )}
              </div>
            </button>
            <div className="pt-2.5">
              <FilaAcciones
                onEdit={() => { setSelectedId(p.id); setShowRight(true); openEditar(p); }}
                onDelete={() => handleDelete(p.id)}
              />
            </div>
            </div>
          );
        })}
      </div>

      <NuevoButton onClick={openNueva} label="Nueva persona" icon={<Plus className="w-4 h-4" />} />
    </>
  );

  // ── Panel derecho ──────────────────────────────────────────────────────────

  const right = (
    <>
      {!selected && !isEditing && (
        <CerebroVacio
          icono="👤"
          titulo="Personas"
          texto="Quién es cada uno, cómo lo conociste, qué se deben y las fechas que no querés olvidar."
          cta={
            <button onClick={openNueva}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Agregar primera persona
            </button>
          }
        />
      )}

      {selected && !isEditing && (() => {
        const cumpleProx = getCumpleanoProximo(selected.fechasClave);
        const otrosFechas = (selected.fechasClave ?? []).filter(f => f.tipo !== 'cumple');

        return (
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

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* HEADER: Avatar grande, nombre, apodo */}
              <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                <span className="text-7xl">{selected.avatar || '👤'}</span>
                <div className="text-center">
                  <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                    {selected.nombre}
                  </h1>
                  {selected.apodo && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">"{selected.apodo}"</p>
                  )}
                </div>
              </div>

              {/* CUMPLEAÑOS PRÓXIMO */}
              {cumpleProx && (
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
                  <span className="text-xl">🎂</span>
                  <div className="text-center flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Cumpleaños en {cumpleProx.dias === 0 ? 'hoy' : `${cumpleProx.dias} días`}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-200">REGALO PENDIENTE</p>
                  </div>
                </div>
              )}

              {/* BOTONES DE ACCIÓN */}
              <div className="grid grid-cols-3 gap-2">
                <button className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="text-lg">📝</span>
                  <span className="text-[10px]">Nota Rápida</span>
                </button>
                <button className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="text-lg">💬</span>
                  <span className="text-[10px]">Chat</span>
                </button>
                <button className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="text-lg">📍</span>
                  <span className="text-[10px]">Touch</span>
                </button>
              </div>

              {/* DATOS CRUCIALES / SALVAVIDAS */}
              <Bloque titulo="🛡️ Datos cruciales / salvavidas">
                <div className="space-y-3">
                  {relMeta(selected.relacion) && (
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2.5 py-1 rounded text-white text-xs font-bold', relMeta(selected.relacion)!.color)}>
                        {relMeta(selected.relacion)!.icon} {relMeta(selected.relacion)!.label}
                      </span>
                    </div>
                  )}
                  {!relMeta(selected.relacion) && selected.relacion && (
                    <div>
                      <span className="px-2.5 py-1 rounded bg-slate-600 text-white text-xs font-bold">
                        {selected.relacion}
                      </span>
                    </div>
                  )}

                  {(selected.comoLaConoci || selected.dondeLaConoci) && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      <span className="font-semibold">Cómo nos conocimos:</span> {selected.comoLaConoci}
                      {selected.comoLaConoci && selected.dondeLaConoci && ' · '}
                      {selected.dondeLaConoci && <span className="italic">{selected.dondeLaConoci}</span>}
                    </p>
                  )}

                  {(selected.telefono || selected.email) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selected.telefono && (
                        <a href={`tel:${selected.telefono}`}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Phone className="w-3 h-3" /> {selected.telefono}
                        </a>
                      )}
                      {selected.email && (
                        <a href={`mailto:${selected.email}`}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Mail className="w-3 h-3" /> {selected.email}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </Bloque>

              {/* SPARKS DE CONVERSACIÓN */}
              {(selected.sparks ?? []).length > 0 && (
                <Bloque titulo="✨ Sparks de conversación & rompehuelos">
                  <div className="space-y-2">
                    {selected.sparks!.map(s => (
                      <div key={s.id} className="flex gap-2 text-sm">
                        <span className="text-base">{s.tipo === 'pasion' ? '💡' : '❓'}</span>
                        <p className="text-slate-600 dark:text-slate-400">{s.contenido}</p>
                      </div>
                    ))}
                  </div>
                </Bloque>
              )}

              {/* TAGS SINÁPTICOS & GUSTOS */}
              {(selected.tags ?? []).length > 0 && (
                <Bloque titulo="🏷️ Tags sinápticos & gustos">
                  <div className="flex flex-wrap gap-2">
                    {selected.tags!.map(t => (
                      <span key={t} className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                </Bloque>
              )}

              {/* HISTORIAL DE CONEXIONES */}
              {(selected.conexiones ?? []).length > 0 && (
                <Bloque titulo="🔗 Historial de conexiones">
                  <div className="space-y-2">
                    {[...selected.conexiones!].reverse().map(c => (
                      <div key={c.id} className="text-xs text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{c.fecha} · {c.tipo}</p>
                        {c.notas && <p className="mt-1 italic">{c.notas}</p>}
                      </div>
                    ))}
                  </div>
                </Bloque>
              )}

              {/* PENDIENTES */}
              {(selected.pendientes ?? []).length > 0 && (
                <Bloque titulo="📌 Pendientes">
                  <PendientesList pendientes={selected.pendientes ?? []}
                    onChange={next => onPatch(selected.id, { pendientes: next })} />
                </Bloque>
              )}

              {/* FECHAS CLAVE (sin cumpleaños) */}
              {otrosFechas.length > 0 && (
                <Bloque titulo="📅 Otras fechas clave">
                  <FechasClaveList fechas={otrosFechas}
                    onChange={next => onPatch(selected.id, { fechasClave: [...(selected.fechasClave ?? []).filter(f => f.tipo === 'cumple'), ...next] })} />
                </Bloque>
              )}

              {/* NOTAS */}
              {selected.notas && (
                <Bloque titulo="📖 Notas">
                  <div
                    className="prose-sm text-slate-700 dark:text-slate-300"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.notas) }}
                  />
                </Bloque>
              )}

              {/* GRUPOS */}
              {gruposDeSelected.length > 0 && (
                <Bloque titulo="👥 Grupos">
                  <div className="flex flex-wrap gap-2">
                    {gruposDeSelected.map(g => (
                      <span key={g.id} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium">
                        {g.icono ?? '👥'} {g.nombre}
                      </span>
                    ))}
                  </div>
                </Bloque>
              )}

              {/* NOTAS RELACIONADAS */}
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
        );
      })()}

      {isEditing && (
        <div className="flex flex-col h-full">
          <PanelActions
            onBack={() => setShowRight(false)}
            title={selected ? 'Editar persona' : 'Nueva persona'}
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
                placeholder="👤"
                maxLength={4}
                value={form.avatar}
                onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
              />
              <input
                className="flex-1 text-2xl font-black bg-transparent outline-none border-b-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 pb-2 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors"
                placeholder="Nombre"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            <Campo label="Apodo">
              <Input value={form.apodo} onChange={v => setForm(f => ({ ...f, apodo: v }))} placeholder="ej: Marce" />
            </Campo>

            <Campo label={
              <span className="flex items-center justify-between">
                Relación
                {!editandoRel && (
                  <button type="button" onClick={() => setEditandoRel(true)}
                    className="flex items-center gap-1 normal-case tracking-normal font-semibold text-primary hover:underline">
                    <Settings2 className="w-3.5 h-3.5" /> Editar tipos
                  </button>
                )}
              </span>
            }>
              {editandoRel && (
                <RelacionesEditor
                  relaciones={relaciones}
                  personas={personas}
                  onCancelar={() => setEditandoRel(false)}
                  onGuardar={async lista => { await onGuardarRelaciones(lista); setEditandoRel(false); }}
                />
              )}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {relaciones.map(r => (
                  <button key={r.id}
                    onClick={() => setForm(f => ({ ...f, relacion: f.relacion === r.id ? '' : r.id }))}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                      form.relacion === r.id ? cn(r.color, 'text-white ring-2 ring-white/70') : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                  >{r.icon} {r.label}</button>
                ))}
              </div>
              <Input value={form.relacion} onChange={v => setForm(f => ({ ...f, relacion: v }))} placeholder="o escribí otra" />
            </Campo>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label="Cómo la conocí">
                <Input value={form.comoLaConoci} onChange={v => setForm(f => ({ ...f, comoLaConoci: v }))} placeholder="ej: por el laburo" />
              </Campo>
              <Campo label="Dónde">
                <Input value={form.dondeLaConoci} onChange={v => setForm(f => ({ ...f, dondeLaConoci: v }))} placeholder="ej: Buenos Aires" />
              </Campo>
              <Campo label="Teléfono">
                <Input value={form.telefono} onChange={v => setForm(f => ({ ...f, telefono: v }))} placeholder="+54 9 11..." />
              </Campo>
              <Campo label="Email">
                <Input value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="mail@ejemplo.com" />
              </Campo>
            </div>

            <Campo label="Pendientes / deudas">
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

            <Campo label="✨ Sparks de conversación">
              <SparkEditor
                sparks={form.sparks}
                onChange={next => setForm(f => ({ ...f, sparks: next }))}
              />
            </Campo>

            <Campo label="🔗 Historial de conexiones">
              <ConexionEditor
                conexiones={form.conexiones}
                onChange={next => setForm(f => ({ ...f, conexiones: next }))}
              />
            </Campo>

            <Campo label="Tags">
              <Input value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="ej: gym, facultad" />
            </Campo>

            <Campo label={<>Notas <span className="normal-case font-normal text-slate-400">(Markdown)</span></>}>
              <textarea
                className="w-full px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none placeholder:text-slate-400"
                style={{ minHeight: '140px' }}
                placeholder="De qué hablamos, qué le gusta, lo que no quiero olvidar..."
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              />
            </Campo>

            {grupos.length > 0 && (
              <Campo label="Grupos">
                <div className="flex flex-wrap gap-1.5">
                  {grupos.map(g => (
                    <button key={g.id} onClick={() => toggleEnArray('grupos', g.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                        form.grupos.includes(g.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      )}
                    >
                      {form.grupos.includes(g.id) ? '✓ ' : ''}{g.icono ?? '👥'} {g.nombre}
                    </button>
                  ))}
                </div>
              </Campo>
            )}

            {entradas.length > 0 && (
              <Campo label="Notas relacionadas">
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {entradas.map(n => (
                    <button key={n.id} onClick={() => toggleEnArray('links', n.id)}
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

// ─── Piezas chicas de layout ──────────────────────────────────────────────────

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

function Input({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <input
      className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function SparkEditor({ sparks, onChange }: {
  sparks: FSSpark[]; onChange: (s: FSSpark[]) => void;
}) {
  const [newTipo, setNewTipo] = useState<'pasion' | 'pregunta'>('pasion');
  const [newContenido, setNewContenido] = useState('');

  const addSpark = () => {
    if (!newContenido.trim()) return;
    onChange([...sparks, {
      id: `spark_${Date.now()}`,
      tipo: newTipo,
      contenido: newContenido.trim(),
    }]);
    setNewContenido('');
  };

  const removeSpark = (id: string) => {
    onChange(sparks.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => setNewTipo('pasion')}
          className={cn('px-2 py-1 rounded text-xs font-medium', newTipo === 'pasion' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800')}
        >
          💡 Pasión
        </button>
        <button
          onClick={() => setNewTipo('pregunta')}
          className={cn('px-2 py-1 rounded text-xs font-medium', newTipo === 'pregunta' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800')}
        >
          ❓ Pregunta
        </button>
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={newTipo === 'pasion' ? 'Ej: tipografía, café' : 'Ej: ¿Cómo va el proyecto?'}
          value={newContenido}
          onChange={e => setNewContenido(e.target.value)}
        />
        <button
          onClick={addSpark}
          disabled={!newContenido.trim()}
          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {sparks.map(s => (
          <div key={s.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-slate-100 dark:bg-slate-800">
            <span className="text-xs text-slate-700 dark:text-slate-300">
              <span className="mr-1">{s.tipo === 'pasion' ? '💡' : '❓'}</span>
              {s.contenido}
            </span>
            <button
              onClick={() => removeSpark(s.id)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConexionEditor({ conexiones, onChange }: {
  conexiones: FSConexion[]; onChange: (c: FSConexion[]) => void;
}) {
  const [newFecha, setNewFecha] = useState(hoyLocal());
  const [newTipo, setNewTipo] = useState<'visita' | 'llamada' | 'mensaje' | 'encuentro'>('encuentro');
  const [newNotas, setNewNotas] = useState('');

  const addConexion = () => {
    onChange([...conexiones, {
      id: `conn_${Date.now()}`,
      fecha: newFecha,
      tipo: newTipo,
      notas: newNotas.trim(),
    }]);
    setNewNotas('');
  };

  const removeConexion = (id: string) => {
    onChange(conexiones.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={newFecha}
          onChange={e => setNewFecha(e.target.value)}
        />
        <select
          className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={newTipo}
          onChange={e => setNewTipo(e.target.value as FSConexion['tipo'])}
        >
          <option value="encuentro">Encuentro</option>
          <option value="llamada">Llamada</option>
          <option value="mensaje">Mensaje</option>
          <option value="visita">Visita</option>
        </select>
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Notas (opcional)"
          value={newNotas}
          onChange={e => setNewNotas(e.target.value)}
        />
        <button
          onClick={addConexion}
          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {[...conexiones].reverse().map(c => (
          <div key={c.id} className="flex items-start justify-between gap-2 px-2 py-1.5 rounded bg-slate-100 dark:bg-slate-800">
            <div className="text-xs text-slate-700 dark:text-slate-300 flex-1 min-w-0">
              <p className="font-semibold">{c.fecha} · {c.tipo}</p>
              {c.notas && <p className="italic truncate">{c.notas}</p>}
            </div>
            <button
              onClick={() => removeConexion(c.id)}
              className="text-red-500 hover:text-red-700 transition-colors shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function slug(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'relacion';
}

/**
 * Edita la lista de tipos de relación. Renombrar mantiene el id, así las
 * personas que ya la tienen siguen asociadas. Borrar un tipo en uso deja a
 * esas personas con el id como texto libre.
 */
function RelacionesEditor({ relaciones, personas, onGuardar, onCancelar }: {
  relaciones: FSRelacion[];
  personas:   FSPersona[];
  onGuardar:  (lista: FSRelacion[]) => Promise<void>;
  onCancelar: () => void;
}) {
  const [draft, setDraft]   = useState<FSRelacion[]>(relaciones);
  const [nuevo, setNuevo]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const usos = (id: string) => personas.filter(p => p.relacion === id).length;
  const patch = (id: string, campos: Partial<FSRelacion>) =>
    setDraft(d => d.map(r => r.id === id ? { ...r, ...campos } : r));

  function agregar() {
    const label = nuevo.trim();
    if (!label) return;
    let id = slug(label);
    for (let i = 2; draft.some(r => r.id === id); i++) id = `${slug(label)}-${i}`;
    const color = RELACION_COLORES[draft.length % RELACION_COLORES.length];
    setDraft(d => [...d, { id, label, icon: '👤', color }]);
    setNuevo('');
  }

  async function guardar() {
    const lista = draft.map(r => ({ ...r, label: r.label.trim(), icon: r.icon.trim() || '👤' })).filter(r => r.label);
    setSaving(true);
    setError(null);
    try {
      await onGuardar(lista);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
      setSaving(false);
    }
  }

  return (
    <div className="mb-3 p-3 rounded-lg bg-surface-container-high space-y-2">
      {draft.map(r => {
        const n = usos(r.id);
        return (
          <div key={r.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-surface-container-lowest">
            <input value={r.icon} onChange={e => patch(r.id, { icon: e.target.value })} aria-label="Emoji"
              className="w-10 px-1 py-1.5 rounded-md bg-surface-container-high text-center text-sm outline-none focus:ring-2 focus:ring-primary" />
            <input value={r.label} onChange={e => patch(r.id, { label: e.target.value })} aria-label="Nombre"
              className="flex-1 min-w-[8rem] px-2 py-1.5 rounded-md bg-surface-container-high text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary" />
            <div className="flex flex-wrap gap-1">
              {RELACION_COLORES.map(c => (
                <button key={c} type="button" onClick={() => patch(r.id, { color: c })} aria-label={`Color ${c}`}
                  className={cn('w-4 h-4 rounded-full', c, r.color === c && 'ring-2 ring-offset-1 ring-offset-surface-container-lowest ring-on-surface')} />
              ))}
            </div>
            <span className="w-16 text-right font-label text-[10px] text-on-surface-variant tabular-nums">{n > 0 && `${n} persona${n > 1 ? 's' : ''}`}</span>
            <button type="button" onClick={() => setDraft(d => d.filter(x => x.id !== r.id))}
              aria-label={`Borrar ${r.label}`} title={n > 0 ? `Lo usan ${n} persona(s): les queda "${r.id}" como texto` : 'Borrar'}
              className="p-1.5 rounded-md text-outline hover:text-error hover:bg-error-container/30 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      <div className="flex gap-2">
        <input value={nuevo} onChange={e => setNuevo(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }}
          placeholder="Nuevo tipo, ej: Primo, Mejor amigo"
          className="flex-1 px-3 py-2 rounded-lg bg-surface-container-lowest text-sm text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-primary" />
        <button type="button" onClick={agregar} disabled={!nuevo.trim()}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary-container hover:opacity-90 text-white text-xs font-bold disabled:opacity-40">
          <Plus className="w-3.5 h-3.5" /> Agregar
        </button>
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancelar} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-highest">
          Cancelar
        </button>
        <button type="button" onClick={guardar} disabled={saving}
          className="px-3 py-1.5 rounded-lg bg-primary-container hover:opacity-90 text-white text-xs font-bold disabled:opacity-50">
          {saving ? 'Guardando…' : 'Guardar tipos'}
        </button>
      </div>
    </div>
  );
}
