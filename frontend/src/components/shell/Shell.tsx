'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { PublicNavbar } from './PublicNavbar';
import { KaderNavbar } from './KaderNavbar';
import { SiswaNavbar } from './SiswaNavbar';
import { Footer } from './Footer';
import { useSession } from '@/context/SessionContext';
import { normalizeRole } from '@/lib/auth/roleGuard';

export interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useSession();

  const role = normalizeRole(String(user?.role || ''));
  const isKaderOrKepalaSekolah = role === 'KADER' || role === 'KEPALA_SEKOLAH' || role === 'ADMIN';

  // Determine navbar based on authenticated session AND current route:
  // If user is authenticated as Kader or Kepala Sekolah, ALWAYS use KaderNavbar on internal pages (including /grafik)
  const isKaderRoute =
    pathname.startsWith('/kader') ||
    pathname.startsWith('/admin') ||
    (pathname === '/grafik' && isAuthenticated) ||
    (isKaderOrKepalaSekolah && pathname !== '/' && pathname !== '/edukasi' && pathname !== '/login');

  const isSiswa = (role === 'SISWA' || pathname.startsWith('/siswa')) && !isKaderRoute;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Dynamic Navbar based on role & authenticated session */}
      {isKaderRoute ? (
        <KaderNavbar />
      ) : isSiswa ? (
        <SiswaNavbar />
      ) : (
        <PublicNavbar />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
