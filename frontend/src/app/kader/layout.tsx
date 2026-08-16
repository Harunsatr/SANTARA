'use client';

// PROTOTYPE ONLY — Auth backend required for production.

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { normalizeRole } from '@/lib/auth/roleGuard';
import { LoadingState } from '@/components/ui';

/**
 * Kader Layout — shared workspace for ADMIN and GURU.
 * SISWA and unauthenticated users are redirected away.
 */
export default function KaderLayout({
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
    if (role !== 'ADMIN' && role !== 'KADER' && (role as string) !== 'GURU') {
      // SISWA and unknown roles should not be here
      if (role === 'SISWA') {
        router.push('/siswa/dashboard');
      } else {
        router.push('/login?reason=unauthorized');
      }
    }
  }, [isReady, isAuthenticated, user, router]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingState text="Memverifikasi sesi pengguna..." />
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
  if (role !== 'ADMIN' && role !== 'KADER' && (role as string) !== 'GURU') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingState text="Mengarahkan..." />
      </div>
    );
  }

  return <div className="flex-1 flex flex-col">{children}</div>;
}
