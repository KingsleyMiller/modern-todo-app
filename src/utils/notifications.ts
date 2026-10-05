import { Task } from '../types';
import { soundFX } from './sound';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
}

/**
 * Checks tasks for upcoming deadlines and fires notifications
 */
export function checkUpcomingDeadlines(
  tasks: Task[],
  onTaskNotified: (taskId: string) => void,
  soundEnabled = true
): { title: string; body: string; taskId: string }[] {
  const alerts: { title: string; body: string; taskId: string }[] = [];
  const now = new Date();

  for (const task of tasks) {
    if (task.completed || task.deleted || !task.dueDate || task.notified) {
      continue;
    }

    // Determine target deadline timestamp
    let deadline: Date;
    if (task.dueTime) {
      const [h, m] = task.dueTime.split(':').map(Number);
      deadline = new Date(task.dueDate);
      deadline.setHours(h || 0, m || 0, 0, 0);
    } else {
      deadline = new Date(task.dueDate);
      deadline.setHours(23, 59, 59, 999);
    }

    const diffMinutes = Math.round((deadline.getTime() - now.getTime()) / (60 * 1000));
    const reminderThreshold = task.reminderMinutes !== undefined ? task.reminderMinutes : 60; // default 60 mins before

    // If within window (e.g. within reminderThreshold and not yet more than 60 mins overdue)
    const isDueSoon = diffMinutes <= reminderThreshold && diffMinutes >= -30;

    if (isDueSoon) {
      let body = '';
      if (diffMinutes > 0) {
        body = `Due in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}! Priority: ${task.priority.toUpperCase()}`;
      } else if (diffMinutes === 0) {
        body = `Due RIGHT NOW! Priority: ${task.priority.toUpperCase()}`;
      } else {
        body = `Deadline passed ${Math.abs(diffMinutes)} mins ago!`;
      }

      alerts.push({
        title: `Task Reminder: ${task.title}`,
        body,
        taskId: task.id,
      });

      // Dispatch Web Notification if granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`Reminder: ${task.title}`, {
            body,
            icon: '/favicon.ico',
            tag: `task-${task.id}`,
          });
        } catch {
          // ignore
        }
      }

      onTaskNotified(task.id);
    }
  }

  if (alerts.length > 0 && soundEnabled) {
    soundFX.playAlert();
  }

  return alerts;
}
