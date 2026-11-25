import {
  CheckCircle2,
  CheckSquare,
  Clock,
  LayoutDashboard,
  ListTodo,
  LogOut,
  X,
} from 'lucide-react';
import type {NavSection} from '../types/task';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  counts: {
    total: number;
    pending: number;
    completed: number;
  };
  userEmail: string | null;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeSection,
  onSelectSection,
  counts,
  userEmail,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: NavSection;
    label: string;
    icon: typeof LayoutDashboard;
    count?: number;
  }> = [
    {id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard},
    {id: 'all', label: 'All Tasks', icon: ListTodo, count: counts.total},
    {id: 'pending', label: 'Pending Tasks', icon: Clock, count: counts.pending},
    {id: 'completed', label: 'Completed Tasks', icon: CheckCircle2, count: counts.completed},
  ];

  const handleNavClick = (section: NavSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shrink-0">
            <CheckSquare className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            TaskFlow
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isActive
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-400'}`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.count === 'number' && (
                <span
                  className={`font-mono text-xs tabular-nums shrink-0 ${
                    isActive ? 'text-sky-700 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {userEmail && (
        <div className="p-4 border-t border-slate-100 shrink-0 space-y-3">
          <div className="px-1">
            <p className="text-xs text-slate-400 mb-0.5">Signed in as</p>
            <p className="text-sm font-medium text-slate-800 truncate" title={userEmail}>
              {userEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <LogOut className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:shrink-0">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 flex h-full shadow-xl">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
}
