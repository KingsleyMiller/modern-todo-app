import React, { useState } from 'react';
import {
  X,
  Cloud,
  RefreshCw,
  Smartphone,
  Laptop,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { SyncStatusInfo } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncInfo: SyncStatusInfo;
  onForceSync: () => Promise<void>;
  onChangeSyncKey: (newKey: string) => Promise<void>;
  onGenerateNewKey: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  syncInfo,
  onForceSync,
  onChangeSyncKey,
  onGenerateNewKey,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(syncInfo.syncKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setIsLinking(true);
    setLinkError(null);
    setLinkSuccess(null);

    try {
      await onChangeSyncKey(inputKey.trim().toUpperCase());
      setLinkSuccess(`Successfully connected to Sync Key "${inputKey.trim().toUpperCase()}"!`);
      setInputKey('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to device cloud sync.';
      setLinkError(message);
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cloud className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Cloud Sync & Cross-Device Access
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seamless real-time synchronization between phones, laptops, and tablets
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
          {/* Current Device Sync Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your Cloud Sync Key
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    syncInfo.status === 'offline'
                      ? 'bg-slate-400'
                      : syncInfo.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                <span className="text-xs font-medium capitalize text-slate-700 dark:text-slate-300">
                  {syncInfo.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 rounded-xl font-mono text-base font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                {syncInfo.syncKey}
              </div>
              <button
                onClick={handleCopyKey}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Key'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span>
                {syncInfo.lastSyncedAt
                  ? `Last synced: ${new Date(syncInfo.lastSyncedAt).toLocaleTimeString()}`
                  : 'Ready to sync'}
              </span>
              <button
                onClick={onForceSync}
                disabled={syncInfo.status === 'syncing'}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${syncInfo.status === 'syncing' ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            </div>
          </div>

          {/* Link Another Device Form */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-indigo-500" />
              <span>Connect Another Device</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Have a sync key from your mobile phone or another computer? Enter it below to merge and synchronize your tasks instantly.
            </p>

            <form onSubmit={handleLinkDevice} className="flex gap-2">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                placeholder="e.g. TASK-9X42A"
                className="flex-1 text-sm font-mono uppercase px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-medium"
              />
              <button
                type="submit"
                disabled={!inputKey.trim() || isLinking}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isLinking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>Link Device</span>
              </button>
            </form>

            {linkSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{linkSuccess}</span>
              </div>
            )}

            {linkError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{linkError}</span>
              </div>
            )}
          </div>

          {/* Offline-First Architecture Highlight */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed">
              <span className="font-semibold block mb-0.5">Offline-First & Conflict-Free</span>
              Your changes are saved locally immediately, even without internet. When you reconnect, TaskFlow automatically performs bidirectional timestamp reconciliation (Last-Write-Wins) with the cloud.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
