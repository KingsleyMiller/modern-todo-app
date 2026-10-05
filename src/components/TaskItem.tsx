import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  Calendar,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  CheckCircle2,
  Circle,
  Tag,
  ListCheck
} from 'lucide-react';
import { Task, Category, Priority } from '../types';
import { getGoogleCalendarUrl, getOutlookCalendarUrl } from '../utils/calendar';
import { soundFX } from '../utils/sound';

interface TaskItemProps {
  task: Task;
  category?: Category;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  category,
  onToggleComplete,
  onEdit,
  onDelete,
  onToggleSubtask,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleCompleteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.completed) {
      // Fire confetti burst
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899'],
      });
      soundFX.playComplete();
    }
    onToggleComplete(task.id);
  };

  // Due date status evaluation
  const getDueStatus = () => {
    if (!task.dueDate) return null;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const isToday = task.dueDate === todayStr;
    const isPast = task.dueDate < todayStr && !task.completed;

    let timeLabel = '';
    if (task.dueTime) {
      const [h, m] = task.dueTime.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedH = h % 12 || 12;
      const formattedM = m < 10 ? `0${m}` : m;
      timeLabel = ` at ${formattedH}:${formattedM} ${ampm}`;
    }

    if (isToday) {
      return {
        label: `Today${timeLabel}`,
        className: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60 font-semibold',
        isOverdue: false,
      };
    }
    if (isPast) {
      return {
        label: `Overdue (${task.dueDate}${timeLabel})`,
        className: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/60 font-bold',
        isOverdue: true,
      };
    }

    // Format future date
    try {
      const d = new Date(task.dueDate + 'T00:00:00');
      const formatted = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return {
        label: `${formatted}${timeLabel}`,
        className: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        isOverdue: false,
      };
    } catch {
      return {
        label: `${task.dueDate}${timeLabel}`,
        className: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
        isOverdue: false,
      };
    }
  };

  const dueInfo = getDueStatus();

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800/60">
            <Flame className="w-3 h-3 fill-red-500" /> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Low
          </span>
        );
    }
  };

  const completedSubtasksCount = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const googleCalUrl = task.dueDate ? getGoogleCalendarUrl(task) : '';

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 ${
        task.completed
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 opacity-75'
          : dueInfo?.isOverdue
          ? 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/50 shadow-xs hover:border-red-300'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/90 shadow-xs hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-md'
      }`}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Custom Animated Checkbox */}
        <button
          onClick={handleCompleteToggle}
          aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
          className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
            task.completed
              ? 'bg-emerald-500 text-white shadow-xs shadow-emerald-500/30 ring-2 ring-emerald-500/20'
              : 'border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
          }`}
        >
          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Category Pill */}
            {category && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${category.color}15`,
                  color: category.color,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </span>
            )}

            {/* Priority Badge */}
            {getPriorityBadge(task.priority)}

            {/* Due Date & Time Badge */}
            {dueInfo && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border ${dueInfo.className}`}
              >
                <Calendar className="w-3 h-3" />
                <span>{dueInfo.label}</span>
              </span>
            )}

            {/* Subtask count */}
            {totalSubtasks > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md transition-colors"
              >
                <ListCheck className="w-3 h-3" />
                <span>
                  {completedSubtasksCount}/{totalSubtasks}
                </span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => onEdit(task)}
            className={`text-sm sm:text-base font-semibold cursor-pointer transition-colors ${
              task.completed
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            {task.title}
          </h3>

          {/* Description Preview */}
          {task.description && (
            <p
              onClick={() => onEdit(task)}
              className={`text-xs mt-1 cursor-pointer line-clamp-2 ${
                task.completed ? 'text-slate-400/80' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {task.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons & Google Calendar shortcut */}
        <div className="flex items-center gap-1">
          {/* Direct Google Calendar Link */}
          {googleCalUrl && (
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Add to Google Calendar"
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors hidden sm:inline-flex"
            >
              <Calendar className="w-4 h-4" />
            </a>
          )}

          {/* Edit Button */}
          <button
            onClick={() => onEdit(task)}
            title="Edit task"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(task.id)}
            title="Delete task"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Subtasks Checklist */}
      {isExpanded && totalSubtasks > 0 && (
        <div className="px-4 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 rounded-b-2xl">
          <div className="space-y-1.5 mt-2">
            {task.subtasks.map((st) => (
              <div
                key={st.id}
                onClick={() => onToggleSubtask(task.id, st.id)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors text-xs"
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                    st.completed
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {st.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span
                  className={
                    st.completed
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-700 dark:text-slate-300'
                  }
                >
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
