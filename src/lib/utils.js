import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const PRIORITY_CONFIG = {
  very_high: { label: 'Very High', color: 'bg-red-500', border: 'border-l-red-500', dot: 'bg-red-500', order: 0 },
  high:      { label: 'High',      color: 'bg-orange-400', border: 'border-l-orange-400', dot: 'bg-orange-400', order: 1 },
  medium:    { label: 'Medium',    color: 'bg-yellow-400', border: 'border-l-yellow-400', dot: 'bg-yellow-400', order: 2 },
  low:       { label: 'Low',       color: 'bg-green-500', border: 'border-l-green-500', dot: 'bg-green-500', order: 3 },
};

export const STATUS_LABELS = { todo: 'Todo', in_progress: 'In Progress', done: 'Done', skip: 'Skipped' };
