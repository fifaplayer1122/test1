export type TaskPriority = 'very_high' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'done' | 'skipped';

export interface Task {
  id: number;
  title: string;
  priority: TaskPriority;
  notes?: string;
  eta?: string;
  status: TaskStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTaskDto {
  title: string;
  priority: TaskPriority;
  notes?: string;
  eta?: string;
  status?: TaskStatus;
}
