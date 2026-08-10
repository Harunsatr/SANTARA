'use client';

// PROTOTYPE ONLY
// This session mechanism is NOT production authentication.
// Production authentication requires server-side authentication,
// password hashing, secure token/session management,
// authorization, and backend access control.

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Button,
  Card,
  Badge,
  Alert,
  LoadingState,
  ErrorState,
} from '@/components/ui';
import { fetchUsers, fetchSchools } from '@/lib/api';
import { resolveSchoolName } from '@/lib/adapters';
import { filterActiveUsers, getRoleLabel } from '@/lib/auth/roleGuard';
import { useSession } from '@/context/SessionContext';
import { User, School } from '@/types/models';
import {
  UserCheck,
  LogIn,
  HeartPulse,
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  AlertCircle,
  Lock,
} from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loginAs, user: activeSession } = useSession();

  useEffect(() => {
    let ignore = false;

    async function loadUserAccounts() {
      try {
        const [usersRes, schoolsRes] = await Promise.all([
          fetchUsers(),
          fetchSchools(),
        ]);

        if (!ignore) {
          if (usersRes.success && Array.isArray(usersRes.data)) {
            setUsers(usersRes.data);
          } else {
            setError(usersRes.message || 'Gagal memuat daftar akun pengguna dari database');
          }

          if (schoolsRes.success && Array.isArray(schoolsRes.data)) {
            setSchools(schoolsRes.data);
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

    loadUserAccounts();

    return () => {
      ignore = true;
    };
  }, []);

  const { activeUsers, inactiveUsers } = filterActiveUsers(users);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-xl w-full flex flex-col gap-6">
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
            <HeartPulse className="w-7 h-7 animate-pulse text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
                Masuk ke SANTARA
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 rounded-md border border-sky-200">
                PROTOTYPE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Pilih akun pengguna aktif dari database <code>01_USERS</code> untuk mengaktifkan sesi kerja.
            </p>
          </div>
        </div>

        {/* Reason Alerts */}
        {reason === 'invalid_session' && (
          <Alert variant="warning" title="Session Tidak Valid">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Session tidak valid atau telah kedaluwarsa. Silakan pilih profil kembali.</span>
            </div>
          </Alert>
        )}

        {reason === 'unauthorized' && (
          <Alert variant="error" title="Akses Ditolak">
            <div className="flex items-center gap-2 text-xs text-rose-900">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Akun Anda tidak memiliki izin role untuk mengakses modul ini. Silakan pilih profil yang sesuai.</span>
            </div>
          </Alert>
        )}

        {reason === 'logged_out' && (
          <Alert variant="info" title="Sesi Selesai">
            <div className="flex items-center gap-2 text-xs text-sky-900">
              <UserCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Anda telah keluar dari sesi kerja prototype.</span>
            </div>
          </Alert>
        )}

        {/* Development Prototype Transparency Banner */}
        <Alert variant="warning" title="PROTOTYPE SESSION — AUTH BACKEND REQUIRED FOR PRODUCTION">
          <div className="flex items-start gap-2 mt-1">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              Mode ini menggunakan pemilihan profil aktif untuk simulasi alur kerja. Autentikasi production dengan password hashing dan token JWT belum diimplementasikan.
            </p>
          </div>
        </Alert>

        {/* Account Selection Card */}
        <Card className="p-6 sm:p-8 flex flex-col gap-4 shadow-sm border-slate-200/80">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Akun Pengguna Aktif (01_USERS)
            </span>
            <Badge variant="primary" size="sm">
              {activeUsers.length} Akun Siap
            </Badge>
          </div>

          {loading ? (
            <LoadingState text="Menghubungkan ke database pengguna..." />
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : activeUsers.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Tidak ada akun pengguna berstatus aktif di database.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeUsers.map(u => {
                const isCurrentActive = activeSession?.userId === u.id || activeSession?.id === u.id;
                const schoolName = resolveSchoolName(u.school_id, schools);

                return (
                  <div
                    key={u.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isCurrentActive
                        ? 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-300'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{u.name}</span>
                          {isCurrentActive && (
                            <Badge variant="success" size="sm">
                              Sesi Aktif
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {getRoleLabel(u.role)} • ID: <code className="font-mono text-[11px]">{u.id}</code>
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          {schoolName}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isCurrentActive ? 'secondary' : 'primary'}
                      onClick={() => loginAs(u)}
                      leftIcon={isCurrentActive ? <Sparkles className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                      className="w-full sm:w-auto shrink-0 font-bold"
                    >
                      {isCurrentActive ? 'Buka Dashboard' : 'Masuk Sesi'}
                    </Button>
                  </div>
                );
              })}

              {/* Inactive Users Display (Disabled) */}
              {inactiveUsers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Akun Tidak Aktif / Belum Lengkap ({inactiveUsers.length})
                  </span>
                  {inactiveUsers.map(u => (
                    <div
                      key={u.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 opacity-60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-600">{u.name || '(Tanpa Nama)'}</span>
                        <span className="text-slate-400 font-mono text-[10px]">ID: {u.id}</span>
                      </div>
                      <Badge variant="warning" size="sm">
                        Non-Aktif
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><LoadingState text="Memuat halaman login..." /></div>}>
      <LoginContent />
    </Suspense>
  );
}
