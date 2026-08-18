/**
 * Client & Server Cookie Management Utilities
 */

import { PrototypeSession } from '@/types/auth';

const COOKIE_NAME = 'santara_session';

/**
 * Gets the session object from document.cookie
 */
export function getClientSessionCookie(): PrototypeSession | null {
  if (typeof document === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.trim().split('=');
      if (name === COOKIE_NAME) {
        const rawValue = rest.join('=');
        if (!rawValue) return null;
        try {
          return JSON.parse(decodeURIComponent(rawValue));
        } catch {
          return JSON.parse(rawValue);
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Sets the session cookie on client-side synchronously
 */
export function setClientSessionCookie(session: PrototypeSession | null): void {
  if (typeof document === 'undefined') return;

  if (!session) {
    document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }

  const serialized = encodeURIComponent(JSON.stringify(session));
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';

  document.cookie = `${COOKIE_NAME}=${serialized}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Syncs session to server-side cookies asynchronously via API
 */
export async function syncServerSession(session: PrototypeSession | null): Promise<void> {
  try {
    if (session) {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session }),
      });
    } else {
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
    }
  } catch (err) {
    console.warn('[SessionSync] Failed to sync cookie with server route:', err);
  }
}
