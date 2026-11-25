import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {formatDueDate, isDueToday, isTaskOverdue} from '../lib/date';
import type {Task} from '../types/task';

interface TaskCardProps {
  task: Task;
  isToggling: boolean;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({
  task,
  isToggling,
  onToggleStatus,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isCompleted = task.status === 'Completed';
  const overdue = isTaskOverdue(task.due_date, task.status);
  const dueToday = isDueToday(task.due_date, task.status);

  return (
    <article
      className={`group rounded-2xl border bg-white p-5 shadow-xs transition-all duration-150 hover:shadow-sm ${
        isCompleted
          ? 'border-slate-200/80 bg-slate-50/40'
          : 'border-slate-200 hover:border-sky-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onToggleStatus(task)}
            disabled={isToggling}
            aria-label={isCompleted ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as completed`}
            className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1 ${
              isCompleted
                ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                : 'border-slate-300 bg-white text-transparent hover:border-sky-500 hover:bg-sky-50'
            }`}
          >
            {isToggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" aria-hidden="true" />
            ) : (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <h3
              className={`font-display text-base font-semibold leading-snug break-words ${
                isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p
                className={`mt-1.5 text-sm leading-relaxed break-words ${
                  isCompleted ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {task.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 font-medium tabular-nums ${
                  overdue
                    ? 'text-red-600'
                    : dueToday
                      ? 'text-amber-600'
                      : 'text-slate-500'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {task.due_date ? formatDueDate(task.due_date) : 'No due date'}
                  {overdue ? ' (Overdue)' : dueToday ? ' (Today)' : ''}
                </span>
              </span>

              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>

              <span
                className={`inline-flex items-center gap-1.5 font-medium ${
                  isCompleted ? 'text-emerald-700' : 'text-sky-700'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>{task.status}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 pl-9 sm:pl-0">
          <button
            type="button"
            onClick={() => onToggleStatus(task)}
            disabled={isToggling}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
              isCompleted
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
            }`}
          >
            {isCompleted ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Mark Pending</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Complete</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit "${task.title}"`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(task)}
            aria-label={`Delete "${task.title}"`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
