import {AlertCircle, CheckCircle2, X} from 'lucide-react';
import type {ToastMessage} from '../types/task';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({toasts, onDismiss}: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg bg-white transition-all duration-150 ${
              isSuccess ? 'border-emerald-200 text-slate-900' : 'border-red-200 text-slate-900'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
