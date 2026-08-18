'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  HeartPulse,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  LogOut,
  Menu,
  X,
  User,
  GraduationCap,
} from 'lucide-react';
import { useSession } from '@/context/SessionContext';

export function SiswaNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useSession();

  const navLinks = [
    { href: '/siswa/dashboard', label: 'Ringkasan Kesehatan', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/edukasi', label: 'Media Edukasi', icon: <BookOpen className="w-4 h-4" /> },
    { href: '/grafik', label: 'Grafik Sekolah', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const displayName = user?.userName || user?.name || 'Siswa SANTARA';

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/siswa/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white font-display">
              SANTARA
            </span>
            <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-widest -mt-0.5">
              Portal Siswa
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-150',
                  isActive
                    ? 'text-white bg-emerald-600/90 shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Active User Profile & Logout */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-100 max-w-[140px] truncate">
                {displayName}
              </span>
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
                Siswa
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-900/50"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-1 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="p-3 mb-2 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">{displayName}</span>
                <span className="text-[10px] text-emerald-400">Siswa (Monitoring Only)</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="text-xs text-rose-400 font-semibold hover:underline flex items-center gap-1 bg-rose-950/30 px-2.5 py-1.5 rounded-lg border border-rose-900/40"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>

          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-3 text-sm font-semibold rounded-xl transition-colors',
                  isActive
                    ? 'text-white bg-emerald-600 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
