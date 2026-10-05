import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Calendar,
  Cloud,
  Search,
  Sparkles,
  Inbox,
  Flame,
  ChevronDown,
  Layers,
  CalendarDays,
  Smartphone,
  CheckCheck
} from 'lucide-react';
import {
  Task,
  Category,
  Priority,
  ViewFilter,
  SortBy,
  SortOrder,
  SyncStatusInfo,
  UserSettings,
} from './types';
import {
  loadStoredTasks,
  saveStoredTasks,
  loadStoredCategories,
  saveStoredCategories,
  loadStoredSettings,
  saveStoredSettings,
  getStoredSyncKey,
  setStoredSyncKey,
  generateId,
  generateSyncKey,
  syncWithCloud,
} from './utils/storage';
import { checkUpcomingDeadlines } from './utils/notifications';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TaskItem } from './components/TaskItem';
import { TaskModal } from './components/TaskModal';
import { CalendarModal } from './components/CalendarModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { BackupModal } from './components/BackupModal';
import { NotificationModal } from './components/NotificationModal';
import { NotificationToast, ToastMessage } from './components/NotificationToast';

export default function App() {
  // Core state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<UserSettings>(loadStoredSettings());
  const [syncKey, setSyncKey] = useState<string>('DEFAULT');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'local_only' | 'error' | 'offline'>('local_only');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<ViewFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // In-app Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize theme
  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDark) root.classList.add('dark');
        else root.classList.remove('dark');
      }
    };
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Load initial local data & setup online listeners
  useEffect(() => {
    const storedTasks = loadStoredTasks();
    const storedCats = loadStoredCategories();
    const storedKey = getStoredSyncKey();

    setTasks(storedTasks);
    setCategories(storedCats);
    setSyncKey(storedKey);
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      addToast({ type: 'success', title: 'Back Online', description: 'Reconnected to cloud sync.' });
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      addToast({ type: 'info', title: 'Offline Mode', description: 'Changes saved locally.' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync with cloud
    if (navigator.onLine) {
      setSyncStatus('syncing');
      syncWithCloud(storedKey, storedTasks, storedCats).then((res) => {
        if (res && res.success) {
          setTasks(res.tasks);
          setCategories(res.categories);
          saveStoredTasks(res.tasks);
          saveStoredCategories(res.categories);
          setLastSyncedAt(res.lastUpdated);
          setSyncStatus('synced');
        } else {
          setSyncStatus('local_only');
        }
      });
    } else {
      setSyncStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Save tasks to localStorage on change and debounced push to cloud
  useEffect(() => {
    if (tasks.length === 0 && categories.length === 0) return;
    saveStoredTasks(tasks);
    saveStoredCategories(categories);

    if (!isOnline) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('syncing');
    const timer = setTimeout(() => {
      syncWithCloud(syncKey, tasks, categories).then((res) => {
        if (res && res.success) {
          setLastSyncedAt(res.lastUpdated);
          setSyncStatus('synced');
        } else {
          setSyncStatus(isOnline ? 'synced' : 'offline');
        }
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [tasks, categories, syncKey, isOnline]);

  // Periodic deadline notifications check (every 25 seconds)
  useEffect(() => {
    const runCheck = () => {
      if (!settings.pushNotificationsEnabled) return;
      const alerts = checkUpcomingDeadlines(
        tasks,
        (taskId) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, notified: true } : t))
          );
        },
        settings.soundEnabled
      );

      for (const alert of alerts) {
        addToast({
          type: 'alert',
          title: alert.title,
          description: alert.body,
        });
      }
    };

    runCheck();
    const interval = setInterval(runCheck, 25000);
    return () => clearInterval(interval);
  }, [tasks, settings.pushNotificationsEnabled, settings.soundEnabled, addToast]);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search, N for new task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      } else if (e.key === 'n' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setTaskToEdit(null);
        setIsTaskModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update settings helper
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev: UserSettings) => {
      const updated: UserSettings = { ...prev, ...newSettings };
      saveStoredSettings(updated);
      return updated;
    });
  };

  // Task Mutations
  const handleSaveTask = (taskData: Partial<Task>) => {
    const now = new Date().toISOString();
    if (taskToEdit) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskToEdit.id
            ? { ...t, ...taskData, updatedAt: now }
            : t
        )
      );
      addToast({ type: 'success', title: 'Task Updated', description: taskData.title });
    } else {
      const newTask: Task = {
        id: generateId(),
        title: taskData.title || 'Untitled Task',
        description: taskData.description,
        completed: false,
        priority: taskData.priority || 'medium',
        category: taskData.category || 'personal',
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,
        reminderMinutes: taskData.reminderMinutes,
        tags: taskData.tags || [],
        subtasks: taskData.subtasks || [],
        notified: false,
        createdAt: now,
        updatedAt: now,
      };
      setTasks((prev) => [newTask, ...prev]);
      addToast({ type: 'success', title: 'Task Created', description: newTask.title });
    }
    setTaskToEdit(null);
  };

  const handleToggleComplete = (id: string) => {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? now : undefined,
              updatedAt: now,
            }
          : t
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    const now = new Date().toISOString();
    // Soft delete for tombstone cloud synchronization
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, deleted: true, updatedAt: now } : t))
    );
    addToast({ type: 'info', title: 'Task Deleted' });
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedSubs = t.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks: updatedSubs, updatedAt: now };
      })
    );
  };

  const handleAddCategory = (category: Category) => {
    setCategories((prev) => [...prev, category]);
    addToast({ type: 'success', title: 'Category Created', description: category.name });
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    if (selectedCategory === catId) setSelectedCategory(null);
  };

  // Sync actions
  const handleForceSync = async () => {
    setSyncStatus('syncing');
    const res = await syncWithCloud(syncKey, tasks, categories);
    if (res && res.success) {
      setTasks(res.tasks);
      setCategories(res.categories);
      saveStoredTasks(res.tasks);
      saveStoredCategories(res.categories);
      setLastSyncedAt(res.lastUpdated);
      setSyncStatus('synced');
      addToast({ type: 'success', title: 'Cloud Synchronized', description: 'All tasks up-to-date.' });
    } else {
      setSyncStatus(isOnline ? 'error' : 'offline');
      addToast({ type: 'warning', title: 'Sync Warning', description: 'Could not reach sync server.' });
    }
  };

  const handleChangeSyncKey = async (newKey: string) => {
    setSyncKey(newKey);
    setStoredSyncKey(newKey);
    setSyncStatus('syncing');
    const res = await syncWithCloud(newKey, tasks, categories);
    if (res && res.success) {
      setTasks(res.tasks);
      setCategories(res.categories);
      saveStoredTasks(res.tasks);
      saveStoredCategories(res.categories);
      setLastSyncedAt(res.lastUpdated);
      setSyncStatus('synced');
    }
  };

  const handleGenerateNewKey = () => {
    const newK = generateSyncKey();
    handleChangeSyncKey(newK);
  };

  // Calendar .ics Import
  const handleImportTasksFromCalendar = (imported: Partial<Task>[]) => {
    const now = new Date().toISOString();
    const formatted: Task[] = imported.map((imp) => ({
      id: generateId(),
      title: imp.title || 'Imported Task',
      description: imp.description,
      completed: false,
      priority: imp.priority || 'medium',
      category: imp.category || 'personal',
      dueDate: imp.dueDate,
      dueTime: imp.dueTime,
      tags: imp.tags || ['calendar'],
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    }));

    setTasks((prev) => [...formatted, ...prev]);
    addToast({
      type: 'success',
      title: 'Import Successful',
      description: `Added ${formatted.length} tasks from calendar.`,
    });
  };

  // Local Storage Restore & Reset
  const handleRestoreBackup = (restoredTasks: Task[], restoredCats: Category[]) => {
    setTasks(restoredTasks);
    setCategories(restoredCats);
    saveStoredTasks(restoredTasks);
    saveStoredCategories(restoredCats);
    addToast({
      type: 'success',
      title: 'Backup Restored',
      description: `${restoredTasks.length} tasks restored.`,
    });
  };

  const handleClearAllData = () => {
    const empty: Task[] = [];
    setTasks(empty);
    saveStoredTasks(empty);
    addToast({ type: 'info', title: 'All tasks deleted.' });
  };

  // Priority toggling
  const handleTogglePriorityFilter = (priority: Priority) => {
    setSelectedPriorities((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
  };

  // Stats calculation
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const activeTasks = useMemo(() => tasks.filter((t) => !t.deleted), [tasks]);

  const taskCounts = useMemo(() => {
    const counts = {
      all: 0,
      today: 0,
      upcoming: 0,
      overdue: 0,
      completed: 0,
      byCategory: {} as Record<string, number>,
    };

    for (const t of activeTasks) {
      counts.all++;
      if (t.completed) {
        counts.completed++;
      } else {
        if (t.dueDate) {
          if (t.dueDate === todayStr) counts.today++;
          else if (t.dueDate > todayStr) counts.upcoming++;
          else if (t.dueDate < todayStr) counts.overdue++;
        }
      }

      if (t.category) {
        counts.byCategory[t.category] = (counts.byCategory[t.category] || 0) + 1;
      }
    }

    return counts;
  }, [activeTasks, todayStr]);

  const todayStats = useMemo(() => {
    const todayTasks = activeTasks.filter((t) => t.dueDate === todayStr);
    const completedToday = todayTasks.filter((t) => t.completed).length;
    const totalToday = todayTasks.length;
    const percentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
    return { completed: completedToday, total: totalToday, percentage };
  }, [activeTasks, todayStr]);

  // Filtering & Sorting
  const filteredTasks = useMemo(() => {
    return activeTasks.filter((task) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesCategory = task.category.toLowerCase().includes(q);
        const matchesTags = task.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesTags) {
          return false;
        }
      }

      // 2. View filter
      if (currentView === 'today') {
        if (task.dueDate !== todayStr) return false;
      } else if (currentView === 'upcoming') {
        if (!task.dueDate || task.dueDate <= todayStr || task.completed) return false;
      } else if (currentView === 'overdue') {
        if (!task.dueDate || task.dueDate >= todayStr || task.completed) return false;
      } else if (currentView === 'completed') {
        if (!task.completed) return false;
      }

      // 3. Category Filter
      if (selectedCategory && task.category !== selectedCategory) {
        return false;
      }

      // 4. Priority Filter
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(task.priority)) {
        return false;
      }

      return true;
    });
  }, [activeTasks, searchQuery, currentView, todayStr, selectedCategory, selectedPriorities]);

  // Sorting
  const sortedTasks = useMemo(() => {
    const priorityWeights: Record<Priority, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return [...filteredTasks].sort((a, b) => {
      // Incomplete tasks always float above completed tasks
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      let diff = 0;
      if (sortBy === 'priority') {
        diff = priorityWeights[b.priority] - priorityWeights[a.priority];
      } else if (sortBy === 'dueDate') {
        const aDate = a.dueDate ? `${a.dueDate} ${a.dueTime || '23:59'}` : '9999-99-99';
        const bDate = b.dueDate ? `${b.dueDate} ${b.dueTime || '23:59'}` : '9999-99-99';
        diff = aDate.localeCompare(bDate);
      } else if (sortBy === 'title') {
        diff = a.title.localeCompare(b.title);
      } else if (sortBy === 'createdAt') {
        diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return sortOrder === 'asc' ? diff : -diff;
    });
  }, [filteredTasks, sortBy, sortOrder]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) {
      map.set(c.id, c);
    }
    return map;
  }, [categories]);

  const syncInfo: SyncStatusInfo = {
    status: !isOnline ? 'offline' : syncStatus,
    lastSyncedAt,
    syncKey,
    autoSync: settings.autoSync,
  };

  const getViewTitle = () => {
    if (selectedCategory) {
      const cat = categoryMap.get(selectedCategory);
      return cat ? `Category: ${cat.name}` : 'Filtered Category';
    }
    switch (currentView) {
      case 'today': return "Today's Schedule";
      case 'upcoming': return 'Upcoming Tasks';
      case 'overdue': return 'Overdue Tasks';
      case 'completed': return 'Completed Tasks';
      default: return 'All Tasks';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        syncInfo={syncInfo}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenNewTaskModal={() => {
          setTaskToEdit(null);
          setIsTaskModalOpen(true);
        }}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        unreadAlertCount={taskCounts.overdue + taskCounts.today}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Responsive Sidebar */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          categories={categories}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          selectedPriorities={selectedPriorities}
          onTogglePriority={handleTogglePriorityFilter}
          taskCounts={taskCounts}
          todayStats={todayStats}
          syncInfo={syncInfo}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Dashboard */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-4xl pb-24 md:pb-12">
          {/* View Header & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {getViewTitle()}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {sortedTasks.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentView === 'today'
                  ? `${todayStats.completed} of ${todayStats.total} tasks completed today`
                  : 'Organize, schedule, and sync across all devices'}
              </p>
            </div>

            {/* Sort Dropdowns & Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort By Dropdown */}
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="bg-transparent text-slate-700 dark:text-slate-200 font-medium py-1 px-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="title">Alphabetical</option>
                  <option value="createdAt">Created Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={`Sort Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                  className="px-1.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 font-semibold"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {/* Add Task Button (Mobile/Tablet visible) */}
              <button
                onClick={() => {
                  setTaskToEdit(null);
                  setIsTaskModalOpen(true);
                }}
                className="inline-flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Active Filter Badges */}
          {(selectedCategory || selectedPriorities.length > 0 || searchQuery) && (
            <div className="flex items-center gap-1.5 flex-wrap mb-4 pb-2 border-b border-slate-200 dark:border-slate-800/80 text-xs">
              <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Filters:</span>

              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-medium">
                  Category: {categoryMap.get(selectedCategory)?.name || selectedCategory}
                  <button onClick={() => setSelectedCategory(null)} className="hover:text-red-500 ml-1">×</button>
                </span>
              )}

              {selectedPriorities.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                >
                  Priority: {p}
                  <button onClick={() => handleTogglePriorityFilter(p)} className="hover:text-red-500 ml-1">×</button>
                </span>
              ))}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 font-medium">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-red-500 ml-1">×</button>
                </span>
              )}

              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedPriorities([]);
                  setSearchQuery('');
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Task List */}
          {sortedTasks.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/40">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
                <CheckCheck className="w-7 h-7 stroke-[2]" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {searchQuery
                  ? 'No tasks matched your search'
                  : currentView === 'completed'
                  ? 'No completed tasks yet'
                  : 'All clear! No tasks in this view'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                {searchQuery
                  ? 'Try searching with different keywords or clear your active filters.'
                  : 'Add a new task with due date, priority, and subtasks to keep your day on track.'}
              </p>
              <button
                onClick={() => {
                  setTaskToEdit(null);
                  setIsTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create a Task</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  category={categoryMap.get(task.category)}
                  onToggleComplete={handleToggleComplete}
                  onEdit={(t) => {
                    setTaskToEdit(t);
                    setIsTaskModalOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                  onToggleSubtask={handleToggleSubtask}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Button (FAB) for Mobile */}
      <button
        onClick={() => {
          setTaskToEdit(null);
          setIsTaskModalOpen(true);
        }}
        className="fixed bottom-6 right-6 md:hidden z-30 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        aria-label="Add New Task"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        categories={categories}
        onSave={handleSaveTask}
        onAddCategory={handleAddCategory}
      />

      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        tasks={activeTasks}
        syncKey={syncKey}
        onImportTasks={handleImportTasksFromCalendar}
      />

      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncInfo={syncInfo}
        onForceSync={handleForceSync}
        onChangeSyncKey={handleChangeSyncKey}
        onGenerateNewKey={handleGenerateNewKey}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        tasks={activeTasks}
        categories={categories}
        syncKey={syncKey}
        onRestoreBackup={handleRestoreBackup}
        onClearAllData={handleClearAllData}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        tasks={activeTasks}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenTask={(task) => {
          setTaskToEdit(task);
          setIsTaskModalOpen(true);
        }}
      />

      {/* In-App Toasts */}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
