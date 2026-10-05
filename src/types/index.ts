export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  priority: Priority;
  category: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  reminderMinutes?: number; // 0 = at time, 15, 60, 1440 = 1 day
  notified?: boolean;
  tags: string[];
  subtasks: SubTask[];
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind color class or hex
  icon?: string;
  isDefault?: boolean;
}

export type ViewFilter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export type SortBy = 'dueDate' | 'priority' | 'title' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  search: string;
  view: ViewFilter;
  category: string | null;
  priorities: Priority[];
  tags: string[];
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export interface SyncStatusInfo {
  status: 'synced' | 'syncing' | 'local_only' | 'error' | 'offline';
  lastSyncedAt: number | null;
  syncKey: string;
  autoSync: boolean;
}

export interface UserSettings {
  soundEnabled: boolean;
  pushNotificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  autoSync: boolean;
}
