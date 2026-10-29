import { AlertTriangle, LogOut, RefreshCw } from 'lucide-react';

// Qué decirle al usuario según el código de error de Firestore.
const MENSAJES: Record<string, string> = {
  'permission-denied': 'No hay permiso para leer tus datos. Suele pasar después de un cambio en las reglas de Firestore.',
  'resource-exhausted': 'Se llegó al límite diario de lecturas de Firestore. Probá de nuevo más tarde.',
  'unavailable': 'No hay conexión con Firestore. Revisá internet y probá de nuevo.',
  'unauthenticated': 'Tu sesión se venció. Cerrá sesión y volvé a entrar.',
};

interface ErrorCargaProps {
  codigo: string;
  onReintentar: () => void;
  onCerrarSesion: () => void;
  /** Banner arriba de la app (los datos ya habían cargado) en vez de pantalla completa. */
  banner?: boolean;
}

export function ErrorCarga({ codigo, onReintentar, onCerrarSesion, banner = false }: ErrorCargaProps) {
  const mensaje = MENSAJES[codigo] ?? 'No se pudieron cargar tus datos. Probá de nuevo.';

  if (banner) {
    return (
      <div role="alert" className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,560px)] flex items-center gap-3 rounded-2xl bg-surface-container-highest px-4 py-3 shadow-lg">
        <AlertTriangle className="w-5 h-5 shrink-0 text-error" aria-hidden="true" />
        <p className="flex-1 text-sm text-on-surface">{mensaje}</p>
        <button type="button" onClick={onReintentar}
          className="min-h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface flex items-center justify-center px-4">
      <div role="alert" className="w-full max-w-sm rounded-3xl bg-surface-container p-6 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-error-container/40">
          <AlertTriangle className="w-7 h-7 text-error" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-bold text-on-surface">No se pudieron cargar tus datos</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{mensaje}</p>
        <p className="mt-1 font-label text-xs text-outline">Código: {codigo}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" onClick={onReintentar}
            className="min-h-11 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Reintentar
          </button>
          <button type="button" onClick={onCerrarSesion}
            className="min-h-11 flex items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 text-sm font-bold text-on-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <LogOut className="w-4 h-4" aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
