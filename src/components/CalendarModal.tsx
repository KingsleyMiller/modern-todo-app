import React, { useState, useRef } from 'react';
import {
  X,
  Calendar,
  Download,
  Upload,
  Copy,
  Check,
  ExternalLink,
  Info,
  CalendarPlus,
  RefreshCw,
  Globe
} from 'lucide-react';
import { Task } from '../types';
import { downloadIcsFile, parseIcsToTasks, getGoogleCalendarUrl, getOutlookCalendarUrl } from '../utils/calendar';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  syncKey: string;
  onImportTasks: (imported: Partial<Task>[]) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  tasks,
  syncKey,
  onImportTasks,
}) => {
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'subscribe' | 'export' | 'import'>('subscribe');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const subscriptionUrl = `${origin}/api/calendar/${syncKey}.ics`;
  const upcomingTasks = tasks.filter((t) => !t.completed && !t.deleted && t.dueDate);

  const handleCopyFeed = () => {
    navigator.clipboard.writeText(subscriptionUrl);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2500);
  };

  const handleDownloadAllIcs = () => {
    downloadIcsFile(tasks, `taskflow-${syncKey.toLowerCase()}.ics`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseIcsToTasks(text);
        if (parsed.length === 0) {
          setImportStatus('No valid events found in the .ics file.');
          return;
        }
        onImportTasks(parsed);
        setImportStatus(`Successfully imported ${parsed.length} task${parsed.length === 1 ? '' : 's'} from calendar!`);
      } catch (err) {
        setImportStatus('Failed to parse .ics file. Please verify format.');
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

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                External Calendar Integration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sync TaskFlow with Google Calendar, Apple Calendar, and Outlook
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-2 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={() => setActiveTab('subscribe')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'subscribe'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Live Calendar Feed (Auto-Sync)
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Export & Web Links
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Import .ics
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {activeTab === 'subscribe' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
                <div className="flex items-center gap-2 mb-2 text-indigo-900 dark:text-indigo-200 font-semibold text-sm">
                  <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Real-Time Calendar Subscription URL</span>
                </div>
                <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mb-3 leading-relaxed">
                  Subscribe to this live RFC 5545 feed in your favorite calendar app. When you create or update tasks in TaskFlow, your calendar updates automatically!
                </p>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <input
                    type="text"
                    readOnly
                    value={subscriptionUrl}
                    className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 bg-transparent outline-none truncate select-all"
                  />
                  <button
                    onClick={handleCopyFeed}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
                  >
                    {copiedFeed ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  How to Subscribe in your Calendar App:
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      📅 Google Calendar
                    </span>
                    <ol className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                      <li>Open Google Calendar web</li>
                      <li>Click <strong>+</strong> next to "Other calendars"</li>
                      <li>Select <strong>From URL</strong></li>
                      <li>Paste the copied URL & click <strong>Add calendar</strong></li>
                    </ol>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      🍎 Apple Calendar
                    </span>
                    <ol className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                      <li>Open Calendar app on Mac/iOS</li>
                      <li>Go to <strong>File &gt; New Calendar Subscription</strong></li>
                      <li>Paste the copied URL</li>
                      <li>Set Auto-refresh to <strong>Every 15 min</strong></li>
                    </ol>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      📬 Microsoft Outlook
                    </span>
                    <ol className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                      <li>Open Outlook Calendar</li>
                      <li>Click <strong>Add calendar</strong></li>
                      <li>Choose <strong>Subscribe from web</strong></li>
                      <li>Paste the URL and click <strong>Import</strong></li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Download .ics File
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Export all current tasks ({tasks.length}) with due dates, alarms, and priorities into a standard iCal file.
                  </p>
                </div>
                <button
                  onClick={handleDownloadAllIcs}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .ics</span>
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                  1-Click Web Calendar Links for Upcoming Tasks:
                </h4>
                {upcomingTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No tasks with due dates right now.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {upcomingTasks.slice(0, 8).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{task.title}</span>
                          <span className="block text-[11px] text-slate-400">Due: {task.dueDate} {task.dueTime || ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <a
                            href={getGoogleCalendarUrl(task)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-medium inline-flex items-center gap-1"
                          >
                            <span>Google</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a
                            href={getOutlookCalendarUrl(task)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-medium inline-flex items-center gap-1"
                          >
                            <span>Outlook</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-center transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".ics,text/calendar"
                  onChange={handleFileChange}
                  className="hidden"
                  id="ics-file-input"
                />
                <label
                  htmlFor="ics-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Upload className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Upload .ics Calendar File
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    Drag and drop or browse to import events from Google Calendar, Apple Calendar, or Outlook directly into your task list.
                  </p>
                </label>
              </div>

              {importStatus && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{importStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
