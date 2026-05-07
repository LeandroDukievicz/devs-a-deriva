export interface Dev {
  name: string;
  role: string;
  bio: string;
  photoUrl: string | null;
  githubUrl: string | null;
  isOwner: boolean;
}

const DASHBOARD_URL = import.meta.env.PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000';

let _cache: Dev[] | null = null;

export async function fetchDevs(): Promise<Dev[]> {
  if (_cache && import.meta.env.PROD) return _cache;
  try {
    const res = await fetch(`${DASHBOARD_URL}/api/devs`);
    if (!res.ok) return [];
    const json = await res.json() as { devs?: unknown[] };
    const items = Array.isArray(json.devs) ? json.devs : [];
    _cache = items.filter(isDev);
    return _cache;
  } catch {
    return [];
  }
}

function isDev(raw: unknown): raw is Dev {
  if (typeof raw !== 'object' || raw === null) return false;
  const d = raw as Record<string, unknown>;
  return typeof d.name === 'string' && d.name.trim().length > 0;
}
