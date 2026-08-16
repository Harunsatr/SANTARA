'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { PublicNavbar } from './PublicNavbar';
import { KaderNavbar } from './KaderNavbar';
import { SiswaNavbar } from './SiswaNavbar';
import { Footer } from './Footer';

export interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const isKaderAdminRoute = pathname.startsWith('/kader') || pathname.startsWith('/admin');
  const isSiswaRoute = pathname.startsWith('/siswa');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Dynamic Navbar based on role/route */}
      {isKaderAdminRoute ? (
        <KaderNavbar />
      ) : isSiswaRoute ? (
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
