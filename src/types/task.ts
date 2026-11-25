export type TaskStatus = 'Pending' | 'Completed';

export type NavSection = 'dashboard' | 'all' | 'pending' | 'completed';

export type SortOption = 'due_asc' | 'due_desc' | 'created_desc';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  created_at: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  due_date: string;
  status: TaskStatus;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}
