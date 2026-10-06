import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'sync-store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache + file sync
interface StoreData {
  [syncKey: string]: {
    tasks: any[];
    categories: any[];
    lastUpdated: number;
  };
}

let store: StoreData = {};

try {
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    store = JSON.parse(raw);
  }
} catch (err) {
  console.error('Failed to load store file, starting fresh:', err);
  store = {};
}

function persistStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store file:', err);
  }
}

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: Date.now() });
});

// GET /api/sync/:syncKey - Retrieve cloud synced tasks & categories
app.get('/api/sync/:syncKey', (req, res) => {
  const { syncKey } = req.params;
  const key = syncKey.trim().toUpperCase();
  const data = store[key];

  if (!data) {
    return res.json({
      exists: false,
      tasks: [],
      categories: [],
      lastUpdated: 0,
      serverTime: Date.now()
    });
  }

  res.json({
    exists: true,
    tasks: data.tasks || [],
    categories: data.categories || [],
    lastUpdated: data.lastUpdated || 0,
    serverTime: Date.now()
  });
});

// POST /api/sync/:syncKey - Bidirectional merge
app.post('/api/sync/:syncKey', (req, res) => {
  const { syncKey } = req.params;
  const key = syncKey.trim().toUpperCase();
  const clientTasks: any[] = Array.isArray(req.body.tasks) ? req.body.tasks : [];
  const clientCategories: any[] = Array.isArray(req.body.categories) ? req.body.categories : [];
  const now = Date.now();

  const existing = store[key] || { tasks: [], categories: [], lastUpdated: 0 };
  const existingTasksMap = new Map<string, any>();
  for (const t of existing.tasks) {
    if (t && t.id) existingTasksMap.set(t.id, t);
  }

  // Merge tasks by id using last updated timestamp (Last-Write-Wins)
  for (const cTask of clientTasks) {
    if (!cTask || !cTask.id) continue;
    const sTask = existingTasksMap.get(cTask.id);
    if (!sTask) {
      existingTasksMap.set(cTask.id, cTask);
    } else {
      const cTime = new Date(cTask.updatedAt || 0).getTime();
      const sTime = new Date(sTask.updatedAt || 0).getTime();
      if (cTime >= sTime) {
        existingTasksMap.set(cTask.id, cTask);
      }
    }
  }

  const mergedTasks = Array.from(existingTasksMap.values());

  // Merge categories by id
  const existingCatMap = new Map<string, any>();
  for (const c of existing.categories) {
    if (c && c.id) existingCatMap.set(c.id, c);
  }
  for (const cCat of clientCategories) {
    if (!cCat || !cCat.id) continue;
    existingCatMap.set(cCat.id, cCat);
  }
  const mergedCategories = Array.from(existingCatMap.values());

  store[key] = {
    tasks: mergedTasks,
    categories: mergedCategories,
    lastUpdated: now
  };

  persistStore();

  res.json({
    success: true,
    tasks: mergedTasks,
    categories: mergedCategories,
    lastUpdated: now,
    serverTime: now
  });
});

// GET /api/calendar/:syncKey.ics - Live RFC 5545 iCalendar Subscription Feed
app.get('/api/calendar/:syncKey.ics', (req, res) => {
  const { syncKey } = req.params;
  const cleanKey = syncKey.replace(/\.ics$/i, '').trim().toUpperCase();
  const data = store[cleanKey];

  const tasks = data?.tasks?.filter(t => !t.deleted && !t.completed && t.dueDate) || [];

  const formatIcsDate = (dateStr: string, timeStr?: string) => {
    try {
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const d = new Date(dateStr);
        d.setHours(hours || 0, minutes || 0, 0, 0);
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      } else {
        return dateStr.replace(/-/g, '');
      }
    } catch {
      return dateStr.replace(/-/g, '');
    }
  };

  const escapeIcs = (str: string = '') => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskFlow//Smart Tasks//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:TaskFlow - ${cleanKey}`,
    'X-WR-TIMEZONE:UTC',
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
  ];

  for (const task of tasks) {
    const hasTime = Boolean(task.dueTime);
    const startStr = formatIcsDate(task.dueDate, task.dueTime);
    const dtParam = hasTime ? `DTSTART:${startStr}` : `DTSTART;VALUE=DATE:${startStr}`;
    const dtEndParam = hasTime ? `DTEND:${startStr}` : `DTEND;VALUE=DATE:${startStr}`;
    const priorityNum = task.priority === 'urgent' ? '1' : task.priority === 'high' ? '2' : task.priority === 'medium' ? '5' : '9';

    lines.push(
      'BEGIN:VEVENT',
      `UID:taskflow-${task.id}@taskflow.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      dtParam,
      dtEndParam,
      `SUMMARY:${escapeIcs(task.title)}`,
      `DESCRIPTION:${escapeIcs(task.description || '')}${task.tags?.length ? '\\nTags: ' + task.tags.join(', ') : ''}`,
      `CATEGORIES:${escapeIcs(task.category || 'General')}`,
      `PRIORITY:${priorityNum}`,
      `STATUS:NEEDS-ACTION`,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${escapeIcs(task.title)}`,
      'END:VALARM',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="taskflow-${cleanKey}.ics"`);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(lines.join('\r\n'));
});

// Setup Vite or static serving
async function setupApp() {
  const publicPath = path.resolve(__dirname, 'public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskFlow Server running on http://0.0.0.0:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
