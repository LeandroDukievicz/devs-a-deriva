export type ReadingProgressEntry = {
  progress: number;
  completed: boolean;
  updatedAt: string;
  completedAt: string | null;
};

const STORAGE_KEY = 'devs-a-deriva:reading-progress';
const READER_KEY = 'devs-a-deriva:reader-id';

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

function fallbackReaderId(): string {
  return `reader_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
}

export function getReaderId(): string {
  const existing = localStorage.getItem(READER_KEY);
  if (existing) return existing;

  const next = crypto.randomUUID?.() ?? fallbackReaderId();
  localStorage.setItem(READER_KEY, next);
  return next;
}

export function readProgressStore(): Record<string, ReadingProgressEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ReadingProgressEntry>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgressStore(store: Record<string, ReadingProgressEntry>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getLocalProgress(postSlug: string): ReadingProgressEntry {
  return readProgressStore()[postSlug] ?? {
    progress: 0,
    completed: false,
    updatedAt: new Date(0).toISOString(),
    completedAt: null,
  };
}

export function saveLocalProgress(postSlug: string, progress: number, completed: boolean): ReadingProgressEntry {
  const store = readProgressStore();
  const existing = store[postSlug];
  const nextProgress = Math.max(existing?.progress ?? 0, clampProgress(progress));
  const nextCompleted = existing?.completed || completed || nextProgress >= 90;
  const now = new Date().toISOString();

  const entry = {
    progress: nextCompleted ? Math.max(nextProgress, 100) : nextProgress,
    completed: nextCompleted,
    updatedAt: now,
    completedAt: existing?.completedAt ?? (nextCompleted ? now : null),
  };

  store[postSlug] = entry;
  writeProgressStore(store);
  return entry;
}

function labelForProgress(entry: ReadingProgressEntry): string {
  return entry.completed ? 'Concluído' : `${entry.progress}% lido`;
}

export function renderReadingProgress(root: ParentNode, postSlug: string): void {
  const entry = getLocalProgress(postSlug);
  const labels = root.querySelectorAll<HTMLElement>('.progress-text, [data-progress-label]');
  const ring = root.querySelector<SVGCircleElement>('.progress-ring-fill');
  const progress = entry.completed ? 100 : entry.progress;

  labels.forEach((label) => {
    label.textContent = labelForProgress(entry);
    label.classList.toggle('completed', entry.completed);
  });

  if (ring) {
    const circumference = Number(ring.getAttribute('stroke-dasharray')) || 43.98;
    ring.style.strokeDashoffset = `${circumference - (circumference * progress) / 100}`;
  }
}

export async function syncReadingProgress(dashboardUrl: string, postSlugs: readonly string[]): Promise<void> {
  if (postSlugs.length === 0) return;

  const readerId = getReaderId();
  const url = new URL('/api/reading-progress', dashboardUrl);
  url.searchParams.set('readerId', readerId);
  url.searchParams.set('slugs', postSlugs.join(','));

  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) return;

    const body = await response.json() as {
      progress?: {
        postSlug: string;
        progress: number;
        completed: boolean;
      }[];
    };

    for (const item of body.progress ?? []) {
      saveLocalProgress(item.postSlug, item.progress, item.completed);
    }
  } catch {
    // Local progress remains the source of truth when the dashboard is unreachable.
  }
}

export async function pushReadingProgress(
  dashboardUrl: string,
  postSlug: string,
  progress: number,
  completed: boolean,
): Promise<void> {
  const entry = saveLocalProgress(postSlug, progress, completed);

  try {
    await fetch(new URL('/api/reading-progress', dashboardUrl), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        readerId: getReaderId(),
        postSlug,
        progress: entry.progress,
        completed: entry.completed,
      }),
    });
  } catch {
    // The next visit keeps the local value and can sync again.
  }
}
