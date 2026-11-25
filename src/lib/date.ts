export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) {
    return 'No due date';
  }

  const datePart = dueDate.slice(0, 10);
  const parts = datePart.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return dueDate;
  }

  const [year, month, day] = parts;
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isTaskOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'Completed') {
    return false;
  }
  const datePart = dueDate.slice(0, 10);
  return datePart < getTodayIsoDate();
}

export function isDueToday(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'Completed') {
    return false;
  }
  return dueDate.slice(0, 10) === getTodayIsoDate();
}
