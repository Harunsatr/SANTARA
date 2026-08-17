'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Alert,
  Button,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import {
  Users,
  RefreshCw,
  Search,
  ShieldCheck,
  BookOpen,
  CheckCircle2,
  XCircle,
  Building2,
  Power,
  Info,
} from 'lucide-react';
import { User, School } from '@/types/models';
import { fetchUsers, updateUser } from '@/lib/api/users';
import { fetchSchools } from '@/lib/api/schools';
import { normalizeRole, getRoleLabel } from '@/lib/auth/roleGuard';
import { useSession } from '@/context/SessionContext';

const ROLE_FILTER_OPTIONS = [
  { label: 'Semua Role', value: 'ALL' },
  { label: 'Kepala Sekolah', value: 'KEPALA_SEKOLAH' },
  { label: 'Kader SATRIA', value: 'KADER' },
];

const STATUS_FILTER_OPTIONS = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' },
];

function getRoleBadgeVariant(role: string | null): 'danger' | 'primary' | 'success' | 'neutral' {
  if (role === 'KEPALA_SEKOLAH' || role === 'ADMIN') return 'danger';
  if (role === 'KADER' || role === 'GURU') return 'primary';
  return 'neutral';
}

function getRoleIcon(role: string | null) {
  if (role === 'KEPALA_SEKOLAH' || role === 'ADMIN') return <ShieldCheck className="w-4 h-4 text-rose-500" />;
  if (role === 'KADER' || role === 'GURU') return <BookOpen className="w-4 h-4 text-sky-500" />;
  return <Users className="w-4 h-4 text-slate-400" />;
}

export default function AdminUsersPage() {
  const { user: activeSession } = useSession();

  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  async function loadData(showRefreshing = false) {
    if (showRefreshing) setIsRefreshing(true);
    setFetchError(null);

    try {
      const [usersRes, schoolsRes] = await Promise.all([
        fetchUsers(),
        fetchSchools(),
      ]);

      if (usersRes.success && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      } else {
        setFetchError(usersRes.message || 'Gagal memuat daftar pengguna');
      }

      if (schoolsRes.success && Array.isArray(schoolsRes.data)) {
        setSchools(schoolsRes.data);
      }
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Koneksi ke API gagal');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    void (async () => {
      await loadData();
    })();
  }, []);

  const resolveSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : schoolId;
  };

  /**
   * Toggle Status Aktif / Nonaktif Akun Kader
   * Khusus Kepala Sekolah (Otorisasi Istimewa)
   */
  const handleToggleStatus = async (targetUser: User) => {
    const isCurrentlyActive = String(targetUser.status || '').toLowerCase() === 'active';
    const nextStatus = isCurrentlyActive ? 'inactive' : 'active';
    const actionLabel = isCurrentlyActive ? 'menonaktifkan' : 'mengaktifkan';

    setUpdatingUserId(targetUser.id);
    setActionSuccessMessage(null);
    setFetchError(null);

    try {
      const res = await updateUser({
        id: targetUser.id,
        status: nextStatus,
      });

      if (res.success) {
        // Update local state instantly
        setUsers(prev =>
          prev.map(u => (u.id === targetUser.id ? { ...u, status: nextStatus } : u))
        );
        setActionSuccessMessage(
          `Berhasil ${actionLabel} akun kader ${targetUser.name} (${targetUser.id}).`
        );
      } else {
        setFetchError(res.message || `Gagal ${actionLabel} akun pengguna.`);
      }
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : `Koneksi API gagal saat ${actionLabel} pengguna.`);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const normalizedRole = normalizeRole(String(u.role || ''));

      if (filterRole !== 'ALL' && normalizedRole !== filterRole) return false;

      const status = String(u.status || '').toLowerCase();
      if (filterStatus === 'active' && status !== 'active') return false;
      if (filterStatus === 'inactive' && status === 'active') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (u.name || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchId = (u.id || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchId) return false;
      }

      return true;
    });
  }, [users, filterRole, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const total = users.length;
    const kepalaSekolah = users.filter(u => {
      const r = normalizeRole(String(u.role || ''));
      return r === 'KEPALA_SEKOLAH';
    }).length;
    const kader = users.filter(u => {
      const r = normalizeRole(String(u.role || ''));
      return r === 'KADER';
    }).length;
    const active = users.filter(u => String(u.status || '').toLowerCase() === 'active').length;
    const inactive = total - active;
    return { total, kepalaSekolah, kader, active, inactive };
  }, [users]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 rounded-2xl text-rose-700 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Manajemen Kader & Akun Pengguna
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Hak Istimewa Kepala Sekolah: Mengelola, mengaktifkan, dan menonaktifkan akun Kader SATRIA.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData(true)}
          disabled={isLoading || isRefreshing}
          isLoading={isRefreshing}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          {isRefreshing ? 'Menyinkronkan...' : 'Perbarui Data'}
        </Button>
      </div>

      {/* Info Notice for Kepala Sekolah */}
      <Alert variant="info" title="Otorisasi Akses Kepala Sekolah">
        <div className="flex items-start gap-2 mt-1">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-950 leading-relaxed">
            Sebagai <strong>Kepala Sekolah</strong>, Anda memiliki hak khusus untuk <strong>mengaktifkan</strong> atau <strong>menonaktifkan</strong> akses kader SATRIA. Kader yang berstatus nonaktif tidak akan dapat masuk ke sistem SANTARA untuk melakukan pencatatan kesehatan siswa.
          </p>
        </div>
      </Alert>

      {/* Action Success Feedback */}
      {actionSuccessMessage && (
        <Alert variant="success" title="Pembaruan Berhasil">
          <div className="flex items-center gap-2 text-xs text-emerald-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        </Alert>
      )}

      {/* Action Error Feedback */}
      {fetchError && (
        <Alert variant="error" title="Perhatian">
          <div className="flex items-center gap-2 text-xs text-rose-950">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{fetchError}</span>
          </div>
        </Alert>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Akun', value: stats.total, color: 'text-slate-900', bg: 'bg-slate-50', icon: <Users className="w-5 h-5 text-slate-500" /> },
          { label: 'Kepala Sekolah', value: stats.kepalaSekolah, color: 'text-rose-700', bg: 'bg-rose-50', icon: <ShieldCheck className="w-5 h-5 text-rose-500" /> },
          { label: 'Kader SATRIA', value: stats.kader, color: 'text-sky-700', bg: 'bg-sky-50', icon: <BookOpen className="w-5 h-5 text-sky-500" /> },
          { label: 'Kader Aktif', value: stats.active, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
          { label: 'Kader Nonaktif', value: stats.inactive, color: 'text-amber-700', bg: 'bg-amber-50', icon: <XCircle className="w-5 h-5 text-amber-500" /> },
        ].map((item) => (
          <Card key={item.label} className={`p-4 border border-slate-200 ${item.bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
                <p className={`text-2xl font-black mt-1 ${item.color}`}>{item.value}</p>
              </div>
              {item.icon}
            </div>
          </Card>
        ))}
      </div>

      {/* Filter & Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau ID pengguna..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 bg-white focus:ring-2 focus:ring-sky-500 flex-1 sm:flex-initial"
            >
              {ROLE_FILTER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 bg-white focus:ring-2 focus:ring-sky-500 flex-1 sm:flex-initial"
            >
              {STATUS_FILTER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* User Table */}
      <Card className="overflow-hidden border border-slate-200 bg-white">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-900">
            Daftar Akun Pengguna & Kader ({filteredUsers.length})
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Sumber data: Google Sheets SANTARA_DATABASE / 01_USERS
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16">
              <LoadingState text="Memuat data pengguna dari Google Sheets..." />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16">
              <EmptyState
                title="Tidak Ada Pengguna Ditemukan"
                description={searchQuery ? `Tidak ada hasil untuk "${searchQuery}".` : 'Tidak ada pengguna yang sesuai filter.'}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">ID</th>
                    <th className="py-3.5 px-4">Nama</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Sekolah</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi (Kepala Sekolah)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(u => {
                    const normalized = normalizeRole(String(u.role || ''));
                    const isSelf = activeSession?.userId === u.id || activeSession?.id === u.id;
                    const isActive = String(u.status || '').toLowerCase() === 'active';
                    const isUpdating = updatingUserId === u.id;
                    const isKepalaSekolah = normalized === 'KEPALA_SEKOLAH';

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50/80 transition-colors ${isSelf ? 'bg-sky-50/40' : ''}`}
                      >
                        {/* ID */}
                        <td className="py-3.5 px-4">
                          <code className="text-xs font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {u.id}
                          </code>
                          {isSelf && (
                            <span className="ml-1.5 text-[10px] font-bold text-sky-600 bg-sky-100 px-1 py-0.5 rounded">
                              Anda
                            </span>
                          )}
                        </td>

                        {/* Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(normalized)}
                            <span className="font-bold text-slate-900">{u.name || '-'}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {u.email || '-'}
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <Badge variant={getRoleBadgeVariant(normalized)} size="sm">
                              {getRoleLabel(normalized || u.role || '')}
                            </Badge>
                          </div>
                        </td>

                        {/* School */}
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{resolveSchoolName(u.school_id)}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {isActive ? (
                            <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                              <XCircle className="w-3.5 h-3.5" /> Nonaktif
                            </div>
                          )}
                        </td>

                        {/* Action: Toggle Active / Inactive (Special feature for Kepala Sekolah) */}
                        <td className="py-3.5 px-4 text-center">
                          {isKepalaSekolah ? (
                            <span className="text-[11px] text-slate-400 italic">
                              Akun Utama
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant={isActive ? 'danger' : 'outline'}
                              onClick={() => handleToggleStatus(u)}
                              disabled={isUpdating}
                              isLoading={isUpdating}
                              leftIcon={<Power className="w-3.5 h-3.5" />}
                              className="text-xs font-bold py-1 px-2.5"
                            >
                              {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
