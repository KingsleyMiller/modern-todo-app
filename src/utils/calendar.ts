import { Task } from '../types';

/**
 * Formats a Date object or date string into standard Google Calendar / iCal datetime string:
 * e.g., 20261005T093000Z or 20261005 for all-day
 */
export function formatCalendarDateTime(dateStr: string, timeStr?: string, durationMinutes = 60): { start: string; end: string; isAllDay: boolean } {
  if (!timeStr) {
    // All day event: YYYYMMDD
    const cleanDate = dateStr.replace(/-/g, '');
    // Next day for end date
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    const endClean = d.toISOString().split('T')[0].replace(/-/g, '');
    return {
      start: cleanDate,
      end: endClean,
      isAllDay: true,
    };
  }

  const [hours, minutes] = timeStr.split(':').map(Number);
  const startDate = new Date(dateStr);
  startDate.setHours(hours || 0, minutes || 0, 0, 0);

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const toIsoNoDelim = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return {
    start: toIsoNoDelim(startDate),
    end: toIsoNoDelim(endDate),
    isAllDay: false,
  };
}

/**
 * Builds a direct Google Calendar Web intent URL:
 * https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...
 */
export function getGoogleCalendarUrl(task: Task): string {
  if (!task.dueDate) return '';

  const { start, end } = formatCalendarDateTime(task.dueDate, task.dueTime);
  const title = encodeURIComponent(`[${task.priority.toUpperCase()}] ${task.title}`);

  let detailsText = task.description ? `${task.description}\n\n` : '';
  detailsText += `Category: ${task.category}\nPriority: ${task.priority.toUpperCase()}`;
  if (task.tags?.length) {
    detailsText += `\nTags: ${task.tags.join(', ')}`;
  }
  if (task.subtasks?.length) {
    detailsText += '\n\nChecklist:\n' + task.subtasks.map(s => `- [${s.completed ? 'x' : ' '}] ${s.title}`).join('\n');
  }

  const details = encodeURIComponent(detailsText);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
}

/**
 * Builds a direct Outlook Web intent URL
 */
export function getOutlookCalendarUrl(task: Task): string {
  if (!task.dueDate) return '';
  const { start, end } = formatCalendarDateTime(task.dueDate, task.dueTime);
  const subject = encodeURIComponent(`[${task.priority.toUpperCase()}] ${task.title}`);
  const body = encodeURIComponent(task.description || `Task managed via TaskFlow - Category: ${task.category}`);
  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&body=${body}&startdt=${start}&enddt=${end}&path=/calendar/action/compose&rru=addevent`;
}

/**
 * Generates an RFC 5545 compliant .ics file string from a list of tasks
 */
export function generateIcsContent(tasks: Task[], calendarName = 'TaskFlow Tasks'): string {
  const escapeIcs = (str: string = '') => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  };

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskFlow//Smart Task Manager//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:UTC',
  ];

  const validTasks = tasks.filter(t => !t.deleted && t.dueDate);

  for (const task of validTasks) {
    if (!task.dueDate) continue;
    const { start, end, isAllDay } = formatCalendarDateTime(task.dueDate, task.dueTime);
    const dtStartLine = isAllDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`;
    const dtEndLine = isAllDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`;
    const priorityCode = task.priority === 'urgent' ? '1' : task.priority === 'high' ? '2' : task.priority === 'medium' ? '5' : '9';
    const status = task.completed ? 'COMPLETED' : 'NEEDS-ACTION';

    let desc = task.description || '';
    if (task.subtasks?.length) {
      desc += '\nSubtasks:\n' + task.subtasks.map(s => `[${s.completed ? 'x' : ' '}] ${s.title}`).join('\n');
    }

    lines.push(
      'BEGIN:VEVENT',
      `UID:taskflow-${task.id}@taskflow.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      dtStartLine,
      dtEndLine,
      `SUMMARY:${escapeIcs(task.title)}`,
      `DESCRIPTION:${escapeIcs(desc)}`,
      `CATEGORIES:${escapeIcs(task.category || 'General')}`,
      `PRIORITY:${priorityCode}`,
      `STATUS:${status}`
    );

    // Add reminder alarm
    lines.push(
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${escapeIcs(task.title)}`,
      'END:VALARM'
    );

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Downloads a generated .ics file to user's computer
 */
export function downloadIcsFile(tasks: Task[], filename = 'taskflow-calendar.ics') {
  const content = generateIcsContent(tasks);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Simple parser to import tasks from an .ics calendar file
 */
export function parseIcsToTasks(icsText: string): Partial<Task>[] {
  const tasks: Partial<Task>[] = [];
  const eventBlocks = icsText.split('BEGIN:VEVENT');

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split('END:VEVENT')[0];
    if (!block) continue;

    let title = 'Imported Event';
    let description = '';
    let dueDate: string | undefined;
    let dueTime: string | undefined;
    let category = 'personal';

    // Unfold lines (lines starting with space or tab are continuations)
    const normalized = block.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const lines = normalized.split(/\r?\n/);

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const keyPart = line.substring(0, colonIdx);
      const value = line.substring(colonIdx + 1);

      if (keyPart.startsWith('SUMMARY')) {
        title = value.replace(/\\([;,nN\\])/g, (_, ch) => ch === 'n' || ch === 'N' ? '\n' : ch).trim();
      } else if (keyPart.startsWith('DESCRIPTION')) {
        description = value.replace(/\\([;,nN\\])/g, (_, ch) => ch === 'n' || ch === 'N' ? '\n' : ch).trim();
      } else if (keyPart.startsWith('CATEGORIES')) {
        category = value.split(',')[0].trim().toLowerCase() || 'personal';
      } else if (keyPart.startsWith('DTSTART')) {
        // e.g. 20261005T093000Z or 20261005
        const digits = value.replace(/\D/g, '');
        if (digits.length >= 8) {
          const y = digits.substring(0, 4);
          const m = digits.substring(4, 6);
          const d = digits.substring(6, 8);
          dueDate = `${y}-${m}-${d}`;
          if (digits.length >= 12) {
            const hh = digits.substring(8, 10);
            const mm = digits.substring(10, 12);
            dueTime = `${hh}:${mm}`;
          }
        }
      }
    }

    if (title) {
      tasks.push({
        title,
        description,
        dueDate,
        dueTime,
        category: ['work', 'personal', 'urgent', 'study', 'health'].includes(category) ? category : 'personal',
        priority: 'medium',
        completed: false,
        tags: ['calendar-import'],
        subtasks: []
      });
    }
  }

  return tasks;
}
