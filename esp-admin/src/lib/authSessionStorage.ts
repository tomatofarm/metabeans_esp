import type { LoginUser } from '../types/auth.types';

const KEY = 'esp_admin_session_v1';

type SessionPayload =
  | { v: 1; mode: 'real'; user: LoginUser }
  | { v: 1; mode: 'mock'; user: LoginUser; accessToken: string };

export function isMockApiMode(): boolean {
  return (
    import.meta.env.VITE_USE_MOCK_API === 'true' || !import.meta.env.VITE_API_BASE_URL?.trim()
  );
}

function safeParse(json: string | null): SessionPayload | null {
  if (!json) return null;
  try {
    const o = JSON.parse(json) as SessionPayload;
    if (o.v !== 1 || !o.user) return null;
    if (o.mode === 'mock' && !o.accessToken) return null;
    return o;
  } catch {
    return null;
  }
}

export function loadStoredSession(): SessionPayload | null {
  if (typeof sessionStorage === 'undefined') return null;
  return safeParse(sessionStorage.getItem(KEY));
}

export function saveSessionAfterLogin(user: LoginUser, accessToken: string): void {
  if (typeof sessionStorage === 'undefined') return;
  if (isMockApiMode()) {
    const p: SessionPayload = { v: 1, mode: 'mock', user, accessToken };
    sessionStorage.setItem(KEY, JSON.stringify(p));
  } else {
    const p: SessionPayload = { v: 1, mode: 'real', user };
    sessionStorage.setItem(KEY, JSON.stringify(p));
  }
}

export function clearStoredSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function updateStoredUser(user: LoginUser): void {
  if (typeof sessionStorage === 'undefined') return;
  const cur = loadStoredSession();
  if (cur?.mode === 'real') {
    sessionStorage.setItem(KEY, JSON.stringify({ v: 1, mode: 'real', user }));
  }
  if (cur?.mode === 'mock') {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ v: 1, mode: 'mock', user, accessToken: cur.accessToken }),
    );
  }
}
