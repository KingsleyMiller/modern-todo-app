import { Category, Task, UserSettings } from '../types';

const STORAGE_KEYS = {
  TASKS: 'taskflow_tasks_v1',
  CATEGORIES: 'taskflow_categories_v1',
  SYNC_KEY: 'taskflow_synckey_v1',
  THEME: 'taskflow_theme_v1',
  SETTINGS: 'taskflow_settings_v1',
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'urgent', name: 'Urgent', color: '#ef4444', icon: 'Flame', isDefault: true },
  { id: 'work', name: 'Work', color: '#3b82f6', icon: 'Briefcase', isDefault: true },
  { id: 'personal', name: 'Personal', color: '#10b981', icon: 'User', isDefault: true },
  { id: 'health', name: 'Health', color: '#ec4899', icon: 'Heart', isDefault: true },
  { id: 'study', name: 'Study', color: '#8b5cf6', icon: 'BookOpen', isDefault: true },
  { id: 'shopping', name: 'Shopping', color: '#f59e0b', icon: 'ShoppingCart', isDefault: true },
];

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export function generateSyncKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TASK-${code}`;
}

// Generate realistic initial tasks
export function getInitialTasks(): Task[] {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const in3Days = new Date(today);
  in3Days.setDate(in3Days.getDate() + 3);
  const in3DaysStr = in3Days.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return [
    {
      id: generateId(),
      title: 'Review quarterly product roadmap & budget',
      description: 'Align key deliverables with design and engineering leads for Q4.',
      completed: false,
      priority: 'urgent',
      category: 'urgent',
      dueDate: todayStr,
      dueTime: '16:00',
      reminderMinutes: 60,
      tags: ['Work', 'Q4', 'Roadmap'],
      subtasks: [
        { id: generateId(), title: 'Export engineering estimates', completed: true },
        { id: generateId(), title: 'Prepare slide deck for leadership', completed: false },
        { id: generateId(), title: 'Draft hiring forecast', completed: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      title: 'Sync calendar with phone & external devices',
      description: 'Use TaskFlow cloud sync key or live iCal webcal subscription.',
      completed: false,
      priority: 'high',
      category: 'work',
      dueDate: todayStr,
      dueTime: '18:30',
      reminderMinutes: 30,
      tags: ['Calendar', 'Setup'],
      subtasks: [
        { id: generateId(), title: 'Open Calendar settings in TaskFlow', completed: true },
        { id: generateId(), title: 'Test "Add to Google Calendar" button', completed: false },
        { id: generateId(), title: 'Copy live calendar feed into Apple/Outlook', completed: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      title: 'Schedule annual physical & dental checkup',
      description: 'Call Dr. Martinez office to confirm insurance coverage.',
      completed: false,
      priority: 'medium',
      category: 'health',
      dueDate: tomorrowStr,
      dueTime: '10:00',
      reminderMinutes: 1440,
      tags: ['Health', 'Appointment'],
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      title: 'Grocery run: weekly organic produce & coffee beans',
      description: 'Whole Foods or local farmer market for fresh greens and espresso blend.',
      completed: false,
      priority: 'low',
      category: 'personal',
      dueDate: in3DaysStr,
      tags: ['Groceries', 'Personal'],
      subtasks: [
        { id: generateId(), title: 'Almond milk & Greek yogurt', completed: false },
        { id: generateId(), title: 'Spinach, avocados, apples', completed: false },
        { id: generateId(), title: 'Dark roast beans', completed: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      title: 'Finish reading TypeScript Design Patterns chapter 5',
      description: 'Study builder and observer implementations.',
      completed: true,
      completedAt: new Date().toISOString(),
      priority: 'low',
      category: 'study',
      dueDate: yesterdayStr,
      tags: ['Reading', 'Code'],
      subtasks: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function loadStoredTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      const initial = getInitialTasks();
      saveStoredTasks(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading tasks from localStorage:', err);
    return [];
  }
}

export function saveStoredTasks(tasks: Task[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Error saving tasks to localStorage:', err);
  }
}

export function loadStoredCategories(): Category[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      saveStoredCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch (err) {
    console.error('Error loading categories:', err);
    return DEFAULT_CATEGORIES;
  }
}

export function saveStoredCategories(categories: Category[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving categories:', err);
  }
}

export function getStoredSyncKey(): string {
  if (typeof window === 'undefined') return 'DEFAULT';
  let key = localStorage.getItem(STORAGE_KEYS.SYNC_KEY);
  if (!key) {
    key = generateSyncKey();
    localStorage.setItem(STORAGE_KEYS.SYNC_KEY, key);
  }
  return key;
}

export function setStoredSyncKey(key: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SYNC_KEY, key.trim().toUpperCase());
}

export { type UserSettings };

export const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  pushNotificationsEnabled: true,
  theme: 'system',
  autoSync: true,
};

export function loadStoredSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: UserSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

// Backup file generator (Export JSON)
export function exportBackupJson(tasks: Task[], categories: Category[], syncKey: string) {
  const backup = {
    app: 'TaskFlow',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    syncKey,
    taskCount: tasks.length,
    tasks,
    categories,
  };
  const str = JSON.stringify(backup, null, 2);
  const blob = new Blob([str], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Cloud sync API client calls
export async function syncWithCloud(
  syncKey: string,
  localTasks: Task[],
  localCategories: Category[]
): Promise<{ success: boolean; tasks: Task[]; categories: Category[]; lastUpdated: number } | null> {
  try {
    const res = await fetch(`/api/sync/${encodeURIComponent(syncKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: localTasks,
        categories: localCategories,
        clientTimestamp: Date.now(),
      }),
    });

    if (!res.ok) {
      throw new Error(`Sync failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Cloud sync offline or server unreachable:', err);
    return null;
  }
}
