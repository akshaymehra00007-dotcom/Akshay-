import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0 font-sans">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        let borderClass = 'border-zinc-800 border-l-2 border-l-emerald-500';
        let bgClass = 'bg-[#111113] text-zinc-100';

        if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderClass = 'border-zinc-800 border-l-2 border-l-rose-500';
        } else if (toast.type === 'celebration') {
          icon = <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />;
          borderClass = 'border-amber-500/40 border-l-2 border-l-amber-400 bg-gradient-to-r from-[#111113] to-amber-950/40';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-amber-400 shrink-0" />;
          borderClass = 'border-zinc-800 border-l-2 border-l-amber-500';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${bgClass} ${borderClass}`}
            role="alert"
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <div className="text-xs font-serif italic text-amber-400 tracking-wide truncate">
                  {toast.title}
                </div>
              )}
              <div className="text-xs text-zinc-300 leading-relaxed break-words font-sans mt-0.5">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

