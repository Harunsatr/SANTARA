'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { HeartPulse, Menu, X, LogIn } from 'lucide-react';

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/edukasi', label: 'Media Edukasi' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-6 h-6 animate-pulse text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-display">
                SANTARA
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 rounded-md">
                UKS
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 hidden sm:block">
              Sistem Pemantauan Kesehatan Remaja SMA
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-2 text-sm font-semibold rounded-xl transition-all duration-150',
                  isActive
                    ? 'text-sky-600 bg-sky-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA Login Button */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm hover:shadow-sky-500/20 transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Login Kader</span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/login"
            className="p-2 text-xs font-bold text-sky-600 bg-sky-50 rounded-xl"
          >
            Login
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-4 py-3 text-sm font-semibold rounded-xl transition-colors',
                  isActive
                    ? 'text-sky-600 bg-sky-50'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 mt-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl"
            >
              <LogIn className="w-4 h-4" />
              <span>Login Kader SATRIA</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
