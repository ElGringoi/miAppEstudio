import { useState } from 'react';
import { Check } from 'lucide-react';
import { Modal, ModalHeader } from './Modal';

interface CierreDiaProps {
  open: boolean;
  onClose: () => void;
  tareasCompletadas: number;
  habitosCompletados: number;
  xpGanado: number;
  onGuardarReflexion: (reflexion: string) => Promise<void>;
}

export function CierreDia({
  open,
  onClose,
  tareasCompletadas,
  habitosCompletados,
  xpGanado,
  onGuardarReflexion,
}: CierreDiaProps) {
  const [reflexion, setReflexion] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (reflexion.trim()) {
      setGuardando(true);
      try {
        await onGuardarReflexion(reflexion);
        setReflexion('');
        onClose();
      } finally {
        setGuardando(false);
      }
    } else {
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg p-6">
      <ModalHeader title="🎉 Cierre del día" onClose={onClose} />

      <div className="space-y-6">
        {/* Resumen de estadísticas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tareasCompletadas}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Tareas
            </div>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {habitosCompletados}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Hábitos
            </div>
          </div>
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              +{xpGanado}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              XP
            </div>
          </div>
        </div>

        {/* Reflexión */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            ¿Cómo salió el día?
          </label>
          <textarea
            className="w-full px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Nota breve de cómo te sentiste, qué aprendiste, qué no salió..."
            style={{ minHeight: '120px' }}
            value={reflexion}
            onChange={e => setReflexion(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">
            Se guardará en tu diario (opcional)
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={guardando}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Posponer
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
          >
            <Check className="w-4 h-4" />
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
