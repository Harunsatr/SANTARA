'use client';

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
import {
  getClientSessionCookie,
  setClientSessionCookie,
  syncServerSession,
} from '@/lib/auth/cookies';

interface SessionContextType {
  user: PrototypeSession | null;
  isAuthenticated: boolean;
  isReady: boolean;
  loginAs: (userOrStudent: User | Student) => void;
  logout: () => void;
}

const STORAGE_KEY = 'santara_kader_session';

// In-memory session cache
let memorySession: PrototypeSession | null = null;
let isInitialized = false;

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      readSessionFromAnySource();
      callback();
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function readSessionFromAnySource(): PrototypeSession | null {
  if (typeof window === 'undefined') return null;

  // 1. Try reading from Document Cookie first
  const cookieSession = getClientSessionCookie();
  if (cookieSession) {
    const val = validateSessionObject(cookieSession);
    if (val.isValid && val.session) {
      memorySession = val.session;
      isInitialized = true;
      return memorySession;
    }
  }

  // 2. Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const val = validateSessionObject(parsed);
      if (val.isValid && val.session) {
        memorySession = val.session;
        // Sync back to cookie if missing
        setClientSessionCookie(memorySession);
        syncServerSession(memorySession);
        isInitialized = true;
        return memorySession;
      }
    }
  } catch {
    // Ignore parse error
  }

  memorySession = null;
  isInitialized = true;
  return null;
}

function getSnapshot(): PrototypeSession | null {
  if (typeof window === 'undefined') return null;
  if (!isInitialized) {
    return readSessionFromAnySource();
  }
  return memorySession;
}

function getServerSnapshot(): PrototypeSession | null {
  return null;
}

function setStoredSession(newSession: PrototypeSession | null) {
  memorySession = newSession;
  isInitialized = true;

  // 1. Sync Cookie
  setClientSessionCookie(newSession);
  syncServerSession(newSession);

  // 2. Sync localStorage
  if (typeof window !== 'undefined') {
    try {
      if (newSession) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }

  notifyListeners();
}

const emptySubscribe = () => () => {};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isReady = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize on mount
  useEffect(() => {
    readSessionFromAnySource();
    notifyListeners();
  }, []);

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
      pathname === '/grafik' ||
      pathname.startsWith('/grafik/');

    if (!isProtected) return;

    const current = getSnapshot();

    if (!current) {
      router.push('/login');
      return;
    }

    if (!canAccessRoute(current, pathname)) {
      const role = normalizeRole(String(current.role));
      const fallback = getDefaultRoute(role);
      if (pathname !== fallback) {
        router.push(fallback + '?reason=unauthorized');
      }
    }
  }, [pathname, isReady, router, session]);

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
