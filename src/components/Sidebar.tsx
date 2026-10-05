import React, { useState } from 'react';
import {
  Inbox,
  CalendarDays,
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
  FolderPlus,
  Plus,
  Trash2,
  Check,
  X,
  Flame,
  Briefcase,
  User,
  Heart,
  BookOpen,
  ShoppingCart,
  Tag,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { Category, Priority, ViewFilter, SyncStatusInfo } from '../types';

interface SidebarProps {
  currentView: ViewFilter;
  onViewChange: (view: ViewFilter) => void;
  selectedCategory: string | null;
  onCategorySelect: (catId: string | null) => void;
  categories: Category[];
  onAddCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
  selectedPriorities: Priority[];
  onTogglePriority: (p: Priority) => void;
  taskCounts: {
    all: number;
    today: number;
    upcoming: number;
    overdue: number;
    completed: number;
    byCategory: Record<string, number>;
  };
  todayStats: {
    completed: number;
    total: number;
    percentage: number;
  };
  syncInfo: SyncStatusInfo;
  onOpenSyncModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  selectedCategory,
  onCategorySelect,
  categories,
  onAddCategory,
  onDeleteCategory,
  selectedPriorities,
  onTogglePriority,
  taskCounts,
  todayStats,
  syncInfo,
  onOpenSyncModal,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[4]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const id = newCatName.toLowerCase().trim().replace(/\s+/g, '-');
    onAddCategory({
      id,
      name: newCatName.trim(),
      color: newCatColor,
      isDefault: false,
    });
    setNewCatName('');
    setIsAddingCategory(false);
  };

  const getCategoryIcon = (id: string, color: string) => {
    switch (id) {
      case 'urgent': return <Flame className="w-4 h-4 text-red-500" />;
      case 'work': return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'personal': return <User className="w-4 h-4 text-emerald-500" />;
      case 'health': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'study': return <BookOpen className="w-4 h-4 text-purple-500" />;
      case 'shopping': return <ShoppingCart className="w-4 h-4 text-amber-500" />;
      default:
        return (
          <span
            className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
            style={{ backgroundColor: color || '#6366f1' }}
          />
        );
    }
  };

  const navItems: { id: ViewFilter; label: string; icon: React.ReactNode; count: number; badgeColor?: string }[] = [
    { id: 'all', label: 'All Tasks', icon: <Inbox className="w-4 h-4" />, count: taskCounts.all },
    { id: 'today', label: 'Today', icon: <CalendarDays className="w-4 h-4 text-indigo-500" />, count: taskCounts.today },
    { id: 'upcoming', label: 'Upcoming', icon: <CalendarCheck className="w-4 h-4 text-blue-500" />, count: taskCounts.upcoming },
    {
      id: 'overdue',
      label: 'Overdue',
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      count: taskCounts.overdue,
      badgeColor: 'bg-red-500 text-white font-bold',
    },
    { id: 'completed', label: 'Completed', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, count: taskCounts.completed },
  ];

  const priorities: { id: Priority; label: string; dotColor: string }[] = [
    { id: 'urgent', label: 'Urgent', dotColor: 'bg-red-500' },
    { id: 'high', label: 'High', dotColor: 'bg-orange-500' },
    { id: 'medium', label: 'Medium', dotColor: 'bg-amber-500' },
    { id: 'low', label: 'Low', dotColor: 'bg-blue-400' },
  ];

  const content = (
    <div className="flex flex-col h-full py-4 px-3 space-y-6 overflow-y-auto">
      {/* Today's Productivity Progress */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 dark:from-slate-800/80 dark:via-slate-800/40 dark:to-slate-900 border border-indigo-100/60 dark:border-slate-700/60 shadow-xs">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Today's Focus</span>
          </div>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {todayStats.completed} / {todayStats.total} done
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${todayStats.percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>{todayStats.percentage}% completed</span>
          {todayStats.percentage === 100 && todayStats.total > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">🎉 All done!</span>
          )}
        </div>
      </div>

      {/* Navigation Views */}
      <div className="space-y-1">
        <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Views
        </div>
        {navItems.map((item) => {
          const isActive = currentView === item.id && selectedCategory === null;
          return (
            <button
              key={item.id}
              onClick={() => {
                onCategorySelect(null);
                onViewChange(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  item.badgeColor
                    ? item.badgeColor
                    : isActive
                    ? 'bg-indigo-700/60 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Categories Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Categories
          </span>
          <button
            onClick={() => setIsAddingCategory(!isAddingCategory)}
            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Add Category"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Inline Add Category form */}
        {isAddingCategory && (
          <form
            onSubmit={handleCreateCategory}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2 mb-2"
          >
            <input
              type="text"
              autoFocus
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name..."
              className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORY_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setNewCatColor(c)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    newCatColor === c ? 'scale-125 ring-2 ring-indigo-500' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded-md font-medium disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = taskCounts.byCategory[cat.id] || 0;
          return (
            <div key={cat.id} className="group relative flex items-center">
              <button
                onClick={() => {
                  onCategorySelect(isSelected ? null : cat.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {getCategoryIcon(cat.id, cat.color)}
                  <span className="truncate">{cat.name}</span>
                </div>
                <span className="text-xs text-slate-400 group-hover:pr-5 transition-all">
                  {count}
                </span>
              </button>
              {!cat.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCategory(cat.id);
                  }}
                  title="Delete category"
                  className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Priority Filters */}
      <div className="space-y-1.5">
        <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Filter by Priority
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {priorities.map((p) => {
            const isSelected = selectedPriorities.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onTogglePriority(p.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${p.dotColor}`} />
                  <span>{p.label}</span>
                </div>
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cloud Sync info & Pairing device footer */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
        <div
          onClick={onOpenSyncModal}
          className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 hover:bg-indigo-50/70 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
              <span>Cross-Device Sync</span>
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                syncInfo.status === 'offline' ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'
              }`}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Key: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{syncInfo.syncKey}</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {syncInfo.lastSyncedAt
              ? `Synced ${new Date(syncInfo.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Auto-sync active'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md h-[calc(100vh-4rem)] sticky top-16 transition-colors">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-50">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Navigation</span>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
};
