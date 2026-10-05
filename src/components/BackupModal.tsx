import React, { useState, useRef } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  HardDrive,
  Trash2,
  Check,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { Task, Category } from '../types';
import { exportBackupJson } from '../utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  categories: Category[];
  syncKey: string;
  onRestoreBackup: (tasks: Task[], categories: Category[]) => void;
  onClearAllData: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  tasks,
  categories,
  syncKey,
  onRestoreBackup,
  onClearAllData,
}) => {
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const approximateSize = Math.round(
    (JSON.stringify(tasks).length + JSON.stringify(categories).length) / 1024
  );

  const handleExport = () => {
    exportBackupJson(tasks, categories, syncKey);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (!data || !Array.isArray(data.tasks)) {
          setRestoreStatus('Invalid backup file format: tasks array missing.');
          return;
        }

        const restoredTasks: Task[] = data.tasks;
        const restoredCategories: Category[] = Array.isArray(data.categories) ? data.categories : categories;

        onRestoreBackup(restoredTasks, restoredCategories);
        setRestoreStatus(`Successfully restored ${restoredTasks.length} tasks from backup!`);
      } catch (err) {
        setRestoreStatus('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Database className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Local Storage & Backup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Secure offline storage and exportable snapshots
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

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Storage stats */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Tasks Stored</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{tasks.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Categories</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{categories.length}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Local Size</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">~{approximateSize} KB</span>
            </div>
          </div>

          {/* Export JSON button */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Export JSON Backup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Save an encrypted/structured snapshot of your tasks, checklist items, and tags to your device.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex-shrink-0 ml-3"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Restore JSON */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Restore from Backup File
            </h3>
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                id="json-backup-input"
              />
              <label
                htmlFor="json-backup-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
              >
                <Upload className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Select JSON Backup File
                </span>
                <span className="text-[11px] text-slate-400">Restores tasks and categories</span>
              </label>
            </div>

            {restoreStatus && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>{restoreStatus}</span>
              </div>
            )}
          </div>

          {/* Reset All Data Option */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            {showConfirmReset ? (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Are you sure? This deletes all local and cloud tasks!</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearAllData();
                      setShowConfirmReset(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700"
                  >
                    Yes, Delete Everything
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset & Clear All Local Data</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
