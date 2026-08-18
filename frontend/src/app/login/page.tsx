'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  Alert,
  LoadingState,
  ErrorState,
  Input,
} from '@/components/ui';
import { fetchUsers } from '@/lib/api/users';
import { useSession } from '@/context/SessionContext';
import { User } from '@/types/models';
import {
  LogIn,
  ArrowLeft,
  HeartPulse,
  User as UserIcon,
  Lock,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [loginId, setLoginId] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { loginAs } = useSession();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const usersRes = await fetchUsers();

        if (!ignore) {
          if (usersRes.success && Array.isArray(usersRes.data)) {
            setUsers(usersRes.data);
          } else {
            setError(usersRes.message || 'Gagal memuat daftar pengguna dari database');
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Koneksi ke API database gagal');
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const id = loginId.trim();

    if (!id) {
      setLoginError('ID Pengguna wajib diisi');
      return;
    }

    setSubmitting(true);

    try {
      // Cari di users (01_USERS) - KEPALA SEKOLAH / KADER SATRIA
      const userMatch = users.find(
        u => u.id.toLowerCase() === id.toLowerCase() || (u.email && u.email.toLowerCase() === id.toLowerCase())
      );

      if (userMatch) {
        const status = String(userMatch.status || '').toLowerCase().trim();
        if (status === 'inactive' || status === 'nonaktif' || status === 'false') {
          setLoginError('Akun kader berstatus NONAKTIF. Hubungi Kepala Sekolah untuk mengaktifkan kembali akun Anda.');
          setSubmitting(false);
          return;
        }
        loginAs(userMatch);
        return;
      }

      setLoginError('ID Pengguna tidak ditemukan dalam basis data 01_USERS');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-md w-full flex flex-col gap-6">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-sky-600 w-fit transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <HeartPulse className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
              Portal Layanan SANTARA
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
              Masuk Akun Kader SATRIA &amp; Kepala Sekolah
            </p>
          </div>
        </div>

        {/* Reason Alerts */}
        {reason === 'invalid_session' && (
          <Alert variant="warning" title="Sesi Berakhir">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Sesi Anda telah kedaluwarsa. Silakan masuk kembali.</span>
            </div>
          </Alert>
        )}

        {reason === 'unauthorized' && (
          <Alert variant="warning" title="Perlu Masuk Akun">
            <div className="flex items-center gap-2 text-xs text-amber-950">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Silakan masuk terlebih dahulu dengan akun resmi (Kader SATRIA atau Kepala Sekolah) untuk mengakses halaman tersebut.</span>
            </div>
          </Alert>
        )}

        {reason === 'logged_out' && (
          <Alert variant="info" title="Keluar Berhasil">
            <div className="flex items-center gap-2 text-xs text-sky-900">
              <UserIcon className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Sesi Anda telah diakhiri dengan aman.</span>
            </div>
          </Alert>
        )}

        {/* Main Card Container */}
        <Card className="p-6 sm:p-8 flex flex-col gap-6 shadow-sm border-slate-200/80">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Autentikasi Akun Resmi
            </h2>
          </div>

          {loading ? (
            <LoadingState text="Menghubungkan ke database 01_USERS..." />
          ) : error ? (
            <ErrorState
              message={error}
              onRetry={() => {
                setLoading(true);
                setError(null);
                setRefreshTrigger(prev => prev + 1);
              }}
            />
          ) : (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {loginError && (
                <Alert variant="error" title="Gagal Masuk">
                  <span className="text-xs text-rose-950 leading-relaxed">{loginError}</span>
                </Alert>
              )}

              <Input
                label="ID Pengguna"
                placeholder="Contoh: USR001 (Kepala Sekolah), USR003 (Kader)"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                disabled={submitting}
                leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
                helperText="Akses resmi untuk Kepala Sekolah dan Kader SATRIA."
              />

              {/* Quick Login Chips for Demo / Testing */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Akses Cepat Pengguna:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginId('USR001')}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-rose-400 text-slate-800 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>🏫 USR001 (Kepala Sekolah)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginId('USR003')}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-sky-400 text-slate-800 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>🩺 USR003 (Kader SATRIA)</span>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={submitting}
                className="w-full font-bold min-h-[44px] mt-1"
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                Masuk ke Portal SANTARA
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState text="Memuat portal login..." />}>
      <LoginContent />
    </Suspense>
  );
}
