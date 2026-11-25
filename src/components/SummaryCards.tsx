import {CheckCircle2, Clock, ListTodo} from 'lucide-react';

interface SummaryCardsProps {
  total: number;
  pending: number;
  completed: number;
  loading: boolean;
}

export function SummaryCards({total, pending, completed, loading}: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Tasks',
      value: total,
      icon: ListTodo,
      iconBg: 'bg-sky-50 text-sky-600',
      description: 'All saved tasks in workspace',
    },
    {
      label: 'Pending Tasks',
      value: pending,
      icon: Clock,
      iconBg: 'bg-amber-50 text-amber-600',
      description: 'Awaiting completion',
    },
    {
      label: 'Completed Tasks',
      value: completed,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      description: 'Finished and archived',
    },
  ];

  return (
    <section aria-label="Task summary" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 transition-shadow duration-150 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1.5">{card.label}</p>
                {loading ? (
                  <div className="h-9 w-16 bg-slate-100 rounded-lg animate-pulse" />
                ) : (
                  <p className="font-display text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {card.value}
                  </p>
                )}
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">{card.description}</p>
          </div>
        );
      })}
    </section>
  );
}
