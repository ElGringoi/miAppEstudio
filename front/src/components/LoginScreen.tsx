import { CheckCircle2 } from 'lucide-react';

export const LoginScreen = ({ onLogin }: { onLogin: () => void }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 shadow-xl text-center max-w-sm w-full">
      <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mx-auto mb-6">
        <CheckCircle2 className="w-9 h-9" />
      </div>
      <h1 className="font-black text-2xl tracking-tight mb-1">QUESTFLOW</h1>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Battle Station</p>
      <p className="text-slate-500 text-sm mb-10 leading-relaxed">Tu productividad como un RPG.<br />Completá quests, subí de nivel.</p>
      <button onClick={onLogin}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity=".7" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff" fillOpacity=".5" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity=".9" />
        </svg>
        Continuar con Google
      </button>
    </div>
  </div>
);
