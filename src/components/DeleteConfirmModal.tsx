import {useEffect} from 'react';
import {AlertTriangle, Loader2, X} from 'lucide-react';
import type {Task} from '../types/task';

interface DeleteConfirmModalProps {
  task: Task | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({
  task,
  deleting,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!task) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, deleting, onCancel]);

  if (!task) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            aria-label="Close confirmation dialog"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <h2 id="delete-dialog-title" className="font-display text-lg font-semibold text-slate-900 mb-2">
          Are you sure you want to delete this task?
        </h2>
        <p id="delete-dialog-description" className="text-sm text-slate-600 leading-relaxed mb-6">
          This will permanently remove{' '}
          <span className="font-medium text-slate-900">&ldquo;{task.title}&rdquo;</span> from your
          workspace. This action cannot be undone.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            <span>{deleting ? 'Deleting...' : 'Delete Task'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
