import {useCallback, useEffect, useMemo, useState} from 'react';
import type {Session, SupabaseClient} from '@supabase/supabase-js';
import {
  AlertCircle,
  ArrowUpDown,
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import {AuthScreen} from './components/AuthScreen';
import {ConfigRequiredScreen} from './components/ConfigRequiredScreen';
import {DeleteConfirmModal} from './components/DeleteConfirmModal';
import {EmptyState} from './components/EmptyState';
import {Sidebar} from './components/Sidebar';
import {SummaryCards} from './components/SummaryCards';
import {TaskCard} from './components/TaskCard';
import {TaskModal} from './components/TaskModal';
import {ToastContainer} from './components/ToastContainer';
import {getSupabaseClient, resetSupabaseClientCache} from './supabase.js';
import type {
  NavSection,
  SortOption,
  Task,
  TaskFormData,
  TaskStatus,
  ToastMessage,
} from './types/task';

function formatSupabaseError(error: unknown, fallback: string): string {
  const errObj = error as {message?: string; code?: string} | null;
  const raw = (errObj?.message || '').trim();
  const lower = raw.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('load failed')) {
    return 'Unable to reach your Supabase database. Please check your connection and try again.';
  }

  return raw || fallback;
}

export default function App() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [configChecked, setConfigChecked] = useState(false);
  const [retryingConfig, setRetryingConfig] = useState(false);

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [statusFilter, setStatusFilter] = useState<'All' | TaskStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('due_asc');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [savingTask, setSavingTask] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, {id, type, message}]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const initializeSupabase = useCallback(async () => {
    setRetryingConfig(true);
    try {
      const client = await getSupabaseClient();
      setSupabase(client);
      if (!client) {
        setAuthLoading(false);
      }
    } finally {
      setConfigChecked(true);
      setRetryingConfig(false);
    }
  }, []);

  useEffect(() => {
    void initializeSupabase();
  }, [initializeSupabase]);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    setAuthLoading(true);

    supabase.auth
      .getSession()
      .then(({data, error}) => {
        if (!active) return;
        if (error) {
          addToast('error', error.message);
        }
        setSession(data.session ?? null);
        setAuthLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setAuthLoading(false);
      });

    const {data: authListener} = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession ?? null);
      if (!nextSession) {
        setTasks([]);
        setFetchError(null);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase, addToast]);

  const fetchTasks = useCallback(async () => {
    if (!supabase || !session?.user) return;

    setTasksLoading(true);
    setFetchError(null);

    try {
      const {data, error} = await supabase
        .from('tasks')
        .select('id, user_id, title, description, due_date, status, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', {ascending: false});

      if (error) {
        setFetchError(formatSupabaseError(error, 'Unable to load tasks from Supabase.'));
      } else {
        setTasks((data as Task[]) ?? []);
      }
    } catch (err) {
      setFetchError(formatSupabaseError(err, 'Network error while connecting to Supabase.'));
    } finally {
      setTasksLoading(false);
    }
  }, [supabase, session?.user]);

  useEffect(() => {
    if (supabase && session?.user) {
      void fetchTasks();
    }
  }, [supabase, session?.user, fetchTasks]);

  const handleSelectSection = (section: NavSection) => {
    setActiveSection(section);
    if (section === 'pending') {
      setStatusFilter('Pending');
    } else if (section === 'completed') {
      setStatusFilter('Completed');
    } else {
      setStatusFilter('All');
    }
  };

  const handleFilterChange = (nextStatus: 'All' | TaskStatus) => {
    setStatusFilter(nextStatus);
    if (activeSection !== 'dashboard') {
      if (nextStatus === 'Pending') setActiveSection('pending');
      else if (nextStatus === 'Completed') setActiveSection('completed');
      else setActiveSection('all');
    }
  };

  const counts = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    return {total, pending, completed};
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      if (statusFilter !== 'All' && task.status !== statusFilter) {
        return false;
      }

      if (query) {
        const titleMatch = task.title.toLowerCase().includes(query);
        const descMatch = (task.description ?? '').toLowerCase().includes(query);
        return titleMatch || descMatch;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'created_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      const aDate = a.due_date ? a.due_date.slice(0, 10) : null;
      const bDate = b.due_date ? b.due_date.slice(0, 10) : null;

      if (!aDate && !bDate) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (!aDate) return 1;
      if (!bDate) return -1;

      if (sortBy === 'due_asc') {
        return aDate.localeCompare(bDate);
      }
      return bDate.localeCompare(aDate);
    });
  }, [tasks, statusFilter, searchQuery, sortBy]);

  const openCreateModal = () => {
    setEditingTask(null);
    setModalError(null);
    setTaskModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setModalError(null);
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (formData: TaskFormData) => {
    if (!supabase || !session?.user) return;

    setSavingTask(true);
    setModalError(null);
    try {
      if (editingTask) {
        const {data, error} = await supabase
          .from('tasks')
          .update({
            title: formData.title,
            description: formData.description || null,
            due_date: formData.due_date || null,
            status: formData.status,
          })
          .eq('id', editingTask.id)
          .eq('user_id', session.user.id)
          .select('id')
          .maybeSingle();

        if (error) {
          const message = formatSupabaseError(error, 'Failed to update task.');
          setModalError(message);
          addToast('error', message);
          return;
        }

        if (!data) {
          const message = 'Task could not be updated. It may no longer exist or access was denied.';
          setModalError(message);
          addToast('error', message);
          return;
        }

        await fetchTasks();
        setTaskModalOpen(false);
        setEditingTask(null);
        addToast('success', 'Task updated successfully.');
      } else {
        const {data, error} = await supabase
          .from('tasks')
          .insert({
            user_id: session.user.id,
            title: formData.title,
            description: formData.description || null,
            due_date: formData.due_date || null,
            status: formData.status,
          })
          .select('id')
          .single();

        if (error || !data) {
          const message = formatSupabaseError(error, 'Failed to create task.');
          setModalError(message);
          addToast('error', message);
          return;
        }

        await fetchTasks();
        setTaskModalOpen(false);
        addToast('success', 'Task created successfully.');
      }
    } catch (err) {
      const message = formatSupabaseError(err, 'An unexpected error occurred while saving the task.');
      setModalError(message);
      addToast('error', message);
    } finally {
      setSavingTask(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    if (!supabase || !session?.user) return;

    const nextStatus: TaskStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    setTogglingTaskId(task.id);

    try {
      const {data, error} = await supabase
        .from('tasks')
        .update({status: nextStatus})
        .eq('id', task.id)
        .eq('user_id', session.user.id)
        .select('id')
        .maybeSingle();

      if (error) {
        addToast('error', error.message || 'Failed to update task status.');
        return;
      }

      if (!data) {
        addToast('error', 'Task status could not be updated. Please refresh and try again.');
        return;
      }

      await fetchTasks();
      addToast('success', `Task marked as ${nextStatus}.`);
    } catch {
      addToast('error', 'Unable to update task status.');
    } finally {
      setTogglingTaskId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!supabase || !session?.user || !deletingTask) return;

    setDeletingLoading(true);
    try {
      const {data, error} = await supabase
        .from('tasks')
        .delete()
        .eq('id', deletingTask.id)
        .eq('user_id', session.user.id)
        .select('id')
        .maybeSingle();

      if (error) {
        addToast('error', error.message || 'Failed to delete task.');
        return;
      }

      if (!data) {
        addToast('error', 'Task could not be deleted. It may have already been removed.');
        return;
      }

      await fetchTasks();
      setDeletingTask(null);
      addToast('success', 'Task deleted successfully.');
    } catch {
      addToast('error', 'Unable to delete task.');
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    const {error} = await supabase.auth.signOut();
    if (error) {
      addToast('error', error.message);
    }
  };

  const handleRetryConfig = async () => {
    resetSupabaseClientCache();
    await initializeSupabase();
  };

  if (!configChecked || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="w-7 h-7 animate-spin text-sky-600" aria-hidden="true" />
        <p className="text-sm font-medium">Loading TaskFlow...</p>
      </div>
    );
  }

  if (!supabase) {
    return <ConfigRequiredScreen onRetry={handleRetryConfig} retrying={retryingConfig} />;
  }

  if (!session) {
    return (
      <>
        <AuthScreen supabase={supabase} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  const sectionLabels: Record<NavSection, string> = {
    dashboard: 'Dashboard',
    all: 'All Tasks',
    pending: 'Pending Tasks',
    completed: 'Completed Tasks',
  };

  const hasFilters = Boolean(searchQuery.trim()) || statusFilter !== 'All';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        counts={counts}
        userEmail={session.user.email ?? null}
        onSignOut={handleSignOut}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
              <span className="font-medium text-slate-500 hidden sm:inline whitespace-nowrap">
                TaskFlow
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {sectionLabels[activeSection]}
              </span>
            </nav>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-sm font-medium shadow-xs transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>+ Add New Task</span>
          </button>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                Manage Your Tasks
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Organize priorities, track due dates, and keep your work moving forward.
              </p>
            </div>
          </div>

          {activeSection === 'dashboard' && (
            <SummaryCards
              total={counts.total}
              pending={counts.pending}
              completed={counts.completed}
              loading={tasksLoading && tasks.length === 0}
            />
          )}

          <section aria-label="Task controls" className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
              <div className="relative flex-1 min-w-0">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks by title or description..."
                  aria-label="Search tasks"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search query"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                <div
                  className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
                  role="group"
                  aria-label="Filter tasks by status"
                >
                  {(['All', 'Pending', 'Completed'] as const).map((status) => {
                    const isSelected = statusFilter === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleFilterChange(status)}
                        aria-pressed={isSelected}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-white text-sky-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>

                <div className="relative flex items-center">
                  <ArrowUpDown
                    className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none"
                    aria-hidden="true"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="Sort tasks"
                    className="appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-8 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors cursor-pointer"
                  >
                    <option value="due_asc">Due Date: Earliest First</option>
                    <option value="due_desc">Due Date: Latest First</option>
                    <option value="created_desc">Recently Created</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {fetchError && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
                <div>
                  <p className="font-medium">Could not sync with Supabase</p>
                  <p className="text-xs text-red-700 mt-0.5">{fetchError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void fetchTasks()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-red-200 text-xs font-medium text-red-700 hover:bg-red-100/60 transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <section aria-label="Task list" className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display text-sm font-semibold text-slate-700">
                {sectionLabels[activeSection]}
              </h2>
              <span className="text-xs text-slate-500 tabular-nums">
                {filteredAndSortedTasks.length}{' '}
                {filteredAndSortedTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            {tasksLoading && tasks.length === 0 ? (
              <div className="space-y-3" aria-label="Loading tasks">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-2.5">
                        <div className="h-4 bg-slate-100 rounded w-1/3" />
                        <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                        <div className="h-3 bg-slate-100 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAndSortedTasks.length === 0 ? (
              <EmptyState
                hasFilters={hasFilters}
                sectionLabel={sectionLabels[activeSection]}
                onAddNew={openCreateModal}
                onResetFilters={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  if (activeSection === 'pending' || activeSection === 'completed') {
                    setActiveSection('all');
                  }
                }}
              />
            ) : (
              <div className="space-y-3">
                {filteredAndSortedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isToggling={togglingTaskId === task.id}
                    onToggleStatus={handleToggleStatus}
                    onEdit={openEditModal}
                    onDelete={setDeletingTask}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <TaskModal
        isOpen={taskModalOpen}
        editingTask={editingTask}
        saving={savingTask}
        submitError={modalError}
        onClose={() => {
          if (!savingTask) {
            setTaskModalOpen(false);
            setEditingTask(null);
            setModalError(null);
          }
        }}
        onSubmit={handleSaveTask}
      />

      <DeleteConfirmModal
        task={deletingTask}
        deleting={deletingLoading}
        onCancel={() => {
          if (!deletingLoading) {
            setDeletingTask(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
