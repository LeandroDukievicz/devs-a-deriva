import { fetchWithRetry } from './api';

const DASHBOARD_URL = import.meta.env.PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000';

export interface Dev {
  name: string;
  role: string;
  bio: string;
  photoUrl: string | null;
  githubUrl: string | null;
  isOwner: boolean;
}

export function githubAvatarUrl(githubUrl: string | null): string | null {
  if (!githubUrl) return null;
  try {
    const user = new URL(githubUrl).pathname.replace(/^\//, '').split('/')[0];
    return user ? `https://github.com/${user}.png?size=200` : null;
  } catch {
    return null;
  }
}

export async function fetchDevs(): Promise<Dev[]> {
  try {
    const res = await fetchWithRetry(`${DASHBOARD_URL}/api/devs`);
    if (!res.ok) return [];
    const json = (await res.json()) as { devs?: Dev[] };
    return json.devs ?? [];
  } catch {
    return [];
  }
}
