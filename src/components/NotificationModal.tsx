import React, { useState } from 'react';
import {
  X,
  Bell,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  Play
} from 'lucide-react';
import { Task, UserSettings } from '../types';
import {
  getNotificationPermission,
  requestNotificationPermission,
  NotificationPermissionState
} from '../utils/notifications';
import { soundFX } from '../utils/sound';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onOpenTask: (task: Task) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  tasks,
  settings,
  onUpdateSettings,
  onOpenTask,
}) => {
  const [permission, setPermission] = useState<NotificationPermissionState>(getNotificationPermission());

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    if (granted) {
      soundFX.playAlert();
    }
  };

  const handleTestSound = () => {
    soundFX.playAlert();
  };

  // Find tasks due within 24 hours or overdue
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const upcomingAlertTasks = tasks.filter((t) => {
    if (t.completed || t.deleted || !t.dueDate) return false;
    return t.dueDate <= todayStr;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Bell className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Deadline Reminders & Push Alerts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Never miss an urgent task or upcoming due date
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Permission card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Browser Push Notifications
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  permission === 'granted'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : permission === 'denied'
                    ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                }`}
              >
                {permission === 'granted'
                  ? 'Enabled'
                  : permission === 'denied'
                  ? 'Blocked in Browser'
                  : 'Action Needed'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              TaskFlow dispatches push alerts when your tasks are approaching due time, even if you are in another tab.
            </p>

            {permission !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Browser Push Notifications</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Push notifications are active and ready!</span>
              </div>
            )}
          </div>

          {/* Sound settings */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div>
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-indigo-500" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Audio Sound Alerts
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Play synthesized chime when completing tasks or receiving deadline warnings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestSound}
                title="Test sound"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Current Deadlines Watchlist */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Upcoming / Overdue Deadlines ({upcomingAlertTasks.length})</span>
            </h3>

            {upcomingAlertTasks.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No pressing deadlines due today or overdue. You're in good shape!
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {upcomingAlertTasks.map((t) => {
                  const isOverdue = t.dueDate! < todayStr;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        onClose();
                        onOpenTask(t);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isOverdue
                          ? 'border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40'
                          : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {t.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isOverdue ? 'Overdue!' : 'Due Today'} {t.dueTime ? `at ${t.dueTime}` : ''}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                          t.priority === 'urgent'
                            ? 'bg-red-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
