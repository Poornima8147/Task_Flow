import React, {useEffect, useRef, useState} from 'react';
import {AlertCircle, CheckCircle2, Clock, Loader2, X} from 'lucide-react';
import type {Task, TaskFormData, TaskStatus} from '../types/task';

interface TaskModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  saving: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (formData: TaskFormData) => Promise<void>;
}

export function TaskModal({
  isOpen,
  editingTask,
  saving,
  submitError,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [validationError, setValidationError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description ?? '');
      setDueDate(editingTask.due_date ? editingTask.due_date.slice(0, 10) : '');
      setStatus(editingTask.status);
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setStatus('Pending');
    }
    setValidationError(null);

    const timer = window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [isOpen, editingTask]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setValidationError('Task title is required.');
      titleInputRef.current?.focus();
      return;
    }

    if (trimmedTitle.length > 200) {
      setValidationError('Task title must be 200 characters or fewer.');
      return;
    }

    setValidationError(null);
    await onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      due_date: dueDate,
      status,
    });
  };

  const activeError = validationError || submitError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="task-modal-title" className="font-display text-lg font-semibold text-slate-900">
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          {activeError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{activeError}</span>
            </div>
          )}

          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 mb-1.5">
              Task Title <span className="text-red-600">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="task-title"
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g., Finalize quarterly roadmap presentation"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add helpful notes, checklist details, or context..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-due-date" className="block text-sm font-medium text-slate-700 mb-1.5">
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 tabular-nums focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors"
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Status</span>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl" role="group" aria-label="Task status">
                <button
                  type="button"
                  onClick={() => setStatus('Pending')}
                  className={`inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    status === 'Pending'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pending</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Completed')}
                  className={`inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    status === 'Completed'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Completed</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>{saving ? 'Saving...' : 'Save Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
