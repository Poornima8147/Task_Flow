import {ClipboardList, Plus, SearchX} from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
  sectionLabel: string;
  onAddNew: () => void;
  onResetFilters: () => void;
}

export function EmptyState({
  hasFilters,
  sectionLabel,
  onAddNew,
  onResetFilters,
}: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-14 text-center shadow-xs">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-5">
        {hasFilters ? (
          <SearchX className="w-7 h-7" aria-hidden="true" />
        ) : (
          <ClipboardList className="w-7 h-7" aria-hidden="true" />
        )}
      </div>

      <h3 className="font-display text-lg font-semibold text-slate-900 mb-2">
        {hasFilters ? 'No matching tasks found' : `No ${sectionLabel.toLowerCase()} yet`}
      </h3>
      <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-6">
        {hasFilters
          ? 'Try adjusting your search query or status filter to locate the tasks you are looking for.'
          : 'Create your first task to start organizing deadlines, tracking progress, and staying focused.'}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {hasFilters ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Clear Filters
          </button>
        ) : null}

        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add New Task</span>
        </button>
      </div>
    </div>
  );
}
