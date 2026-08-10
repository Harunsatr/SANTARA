'use client';

// PROTOTYPE ONLY — Auth backend required for production.

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { normalizeRole } from '@/lib/auth/roleGuard';
import { LoadingState } from '@/components/ui';

/**
 * Siswa Layout — exclusive to SISWA role.
 * ADMIN and GURU are redirected to /kader/dashboard.
 */
export default function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isReady } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated || !user) {
      router.push('/login?reason=invalid_session');
      return;
    }

    const role = normalizeRole(String(user.role));
    if (role !== 'SISWA') {
      if (role === 'ADMIN' || role === 'GURU') {
        router.push('/kader/dashboard');
      } else {
        router.push('/login?reason=unauthorized');
      }
    }
  }, [isReady, isAuthenticated, user, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingState text="Memverifikasi sesi siswa..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingState text="Mengarahkan ke halaman login..." />
      </div>
    );
  }

  const role = normalizeRole(String(user.role));
  if (role !== 'SISWA') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingState text="Mengarahkan..." />
      </div>
    );
  }

  return <div className="flex-1 flex flex-col">{children}</div>;
}
