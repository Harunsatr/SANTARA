'use client';

// PROTOTYPE ONLY
// This session mechanism is NOT production authentication.
// Production authentication requires server-side authentication,
// password hashing, secure token/session management,
// authorization, and backend access control.

/**
 * SANTARA Session Context (Prototype Session)
 *
 * NOTICE: AUTHENTICATION NOT IMPLEMENTED IN PHASE 1 BACKEND.
 * This context manages client-side active profile switching for all 3 roles
 * (ADMIN, GURU, SISWA) and route-based access control for prototyping.
 * Marker: PROTOTYPE_SESSION (Auth backend required for production security).
 *
 * Uses useSyncExternalStore for hydration-safe localStorage synchronization.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PrototypeSession } from '@/types/auth';
import { User, Student } from '@/types/models';
import {
  validateSessionObject,
  createSessionFromUser,
  createSessionFromStudent,
  canAccessRoute,
  getDefaultRoute,
  normalizeRole,
} from '@/lib/auth/roleGuard';

interface SessionContextType {
  user: PrototypeSession | null;
  isAuthenticated: boolean;
  isReady: boolean;
  loginAs: (userOrStudent: User | Student) => void;
  logout: () => void;
}

// Storage key kept same for backward compat — avoids forced re-login on deploy
const STORAGE_KEY = 'santara_kader_session';

// Cache to maintain referential equality during getSnapshot
let memorySession: PrototypeSession | null = null;
let lastRaw: string | null = null;

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback();
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function getSnapshot(): PrototypeSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== lastRaw) {
      lastRaw = raw;
      if (!raw) {
        memorySession = null;
      } else {
        const parsed = JSON.parse(raw);
        const validation = validateSessionObject(parsed);
        if (validation.isValid && validation.session) {
          memorySession = validation.session;
        } else {
          // Corrupt or invalid session — clear it
          localStorage.removeItem(STORAGE_KEY);
          memorySession = null;
          lastRaw = null;
        }
      }
    }
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    memorySession = null;
    lastRaw = null;
  }
  return memorySession;
}

function getServerSnapshot(): PrototypeSession | null {
  return null;
}

const emptySubscribe = () => () => {};

function setStoredSession(newSession: PrototypeSession | null) {
  memorySession = newSession;
  if (newSession) {
    lastRaw = JSON.stringify(newSession);
    try {
      localStorage.setItem(STORAGE_KEY, lastRaw);
    } catch {
      // ignore
    }
  } else {
    lastRaw = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  listeners.forEach(listener => listener());
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isReady = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const router = useRouter();
  const pathname = usePathname();

  const loginAs = useCallback(
    (record: User | Student) => {
      const isStudent = 'student_code' in record;
      const newSession = isStudent
        ? createSessionFromStudent(record as Student)
        : createSessionFromUser(record as User);

      setStoredSession(newSession);
      const defaultRoute = getDefaultRoute(newSession.role);
      router.push(defaultRoute);
    },
    [router]
  );

  const logout = useCallback(() => {
    setStoredSession(null);
    router.push('/login?reason=logged_out');
  }, [router]);

  // Route Guard: Protect role-specific routes
  useEffect(() => {
    if (!isReady) return;

    const isProtected =
      pathname.startsWith('/kader') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/siswa') ||
      pathname.startsWith('/grafik');

    if (!isProtected) return;

    const current = getSnapshot();

    if (!current) {
      router.push('/login');
      return;
    }

    if (!canAccessRoute(current, pathname)) {
      // Redirect to the user's allowed home route
      const role = normalizeRole(String(current.role));
      const fallback = getDefaultRoute(role);
      if (pathname !== fallback) {
        router.push(fallback + '?reason=unauthorized');
      }
    }
  }, [pathname, isReady, router]);

  return (
    <SessionContext.Provider
      value={{
        user: session,
        isAuthenticated: !!session,
        isReady,
        loginAs,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
