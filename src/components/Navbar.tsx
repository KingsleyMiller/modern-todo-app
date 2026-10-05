import React from 'react';
import {
  CheckSquare,
  Search,
  X,
  Cloud,
  CloudOff,
  RefreshCw,
  Bell,
  Calendar,
  Database,
  Sun,
  Moon,
  Laptop,
  Menu,
  Plus
} from 'lucide-react';
import { SyncStatusInfo, UserSettings } from '../types';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  syncInfo: SyncStatusInfo;
  onOpenSyncModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenBackupModal: () => void;
  onOpenNotificationModal: () => void;
  onOpenNewTaskModal: () => void;
  settings: UserSettings;
  onUpdateSettings: (s: Partial<UserSettings>) => void;
  unreadAlertCount: number;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  syncInfo,
  onOpenSyncModal,
  onOpenCalendarModal,
  onOpenBackupModal,
  onOpenNotificationModal,
  onOpenNewTaskModal,
  settings,
  onUpdateSettings,
  unreadAlertCount,
  onToggleMobileSidebar,
}) => {
  const toggleTheme = () => {
    if (settings.theme === 'system') onUpdateSettings({ theme: 'dark' });
    else if (settings.theme === 'dark') onUpdateSettings({ theme: 'light' });
    else onUpdateSettings({ theme: 'system' });
  };

  const getSyncIcon = () => {
    if (syncInfo.status === 'syncing') {
      return <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />;
    }
    if (syncInfo.status === 'offline') {
      return <CloudOff className="w-4 h-4 text-slate-400" />;
    }
    if (syncInfo.status === 'error') {
      return <CloudOff className="w-4 h-4 text-red-500" />;
    }
    return <Cloud className="w-4 h-4 text-emerald-500" />;
  };

  const getSyncLabel = () => {
    if (syncInfo.status === 'syncing') return 'Syncing...';
    if (syncInfo.status === 'offline') return 'Offline';
    if (syncInfo.status === 'error') return 'Sync Error';
    return 'Cloud Synced';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Mobile Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onToggleMobileSidebar}
            aria-label="Open sidebar menu"
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 cursor-pointer select-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="hidden xs:block">
              <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                TaskFlow
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                Cloud
              </span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks, tags, categories..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-transparent focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden lg:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Cloud Sync Button */}
          <button
            onClick={onOpenSyncModal}
            title={`Sync status: ${getSyncLabel()} (Click to open Sync settings)`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            {getSyncIcon()}
            <span className="hidden md:inline">{getSyncLabel()}</span>
          </button>

          {/* External Calendar Hub */}
          <button
            onClick={onOpenCalendarModal}
            title="External Calendar Integration (Google, Outlook, iCal)"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 transition-colors relative"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotificationModal}
            title="Deadlines & Push Notifications"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
              </span>
            )}
          </button>

          {/* Backup & Local Storage */}
          <button
            onClick={onOpenBackupModal}
            title="Backup & Local Storage Security"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 transition-colors hidden sm:flex"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Dark Mode Switcher */}
          <button
            onClick={toggleTheme}
            title={`Current Theme: ${settings.theme} (Click to toggle)`}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            {settings.theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : settings.theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Laptop className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Add Task Primary CTA */}
          <button
            onClick={onOpenNewTaskModal}
            className="hidden sm:inline-flex items-center gap-1.5 ml-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};
