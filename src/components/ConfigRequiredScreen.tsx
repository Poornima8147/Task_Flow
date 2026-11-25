import {CheckSquare, Database, RefreshCw} from 'lucide-react';

interface ConfigRequiredScreenProps {
  onRetry: () => void;
  retrying: boolean;
}

export function ConfigRequiredScreen({onRetry, retrying}: ConfigRequiredScreenProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
            <CheckSquare className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
            TaskFlow
          </span>
        </div>

        <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mb-4">
          <Database className="w-5 h-5" aria-hidden="true" />
        </div>

        <h1 className="font-display text-xl font-semibold text-slate-900 mb-2">
          Connect Your Supabase Project
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-5">
          TaskFlow stores and syncs all tasks directly with your Supabase PostgreSQL{' '}
          <code className="font-mono text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
            public.tasks
          </code>{' '}
          table. Add your Supabase environment variables to connect.
        </p>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-6 space-y-2.5 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Required Environment Variables</p>
          <ul className="space-y-1.5 text-xs font-mono text-slate-700 break-all">
            <li>VITE_SUPABASE_URL — https://clxsjsheuxffzzhxychy.supabase.co</li>
            <li>VITE_SUPABASE_ANON_KEY — Your Supabase publishable key</li>
          </ul>
          <p className="text-xs text-slate-500 pt-1">
            Add these in your environment Secrets panel, then click Retry Connection below.
          </p>
        </div>

        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{retrying ? 'Checking connection...' : 'Retry Connection'}</span>
        </button>
      </div>
    </div>
  );
}
