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
  Select,
} from '@/components/ui';
import {
  fetchUsers,
  fetchSchools,
  fetchClasses,
  fetchStudents,
  createStudent,
} from '@/lib/api';
import { useSession } from '@/context/SessionContext';
import { User, School, ClassRoom, Student } from '@/types/models';
import {
  LogIn,
  UserPlus,
  ArrowLeft,
  HeartPulse,
  User as UserIcon,
  Lock,
  AlertCircle,
  Calendar,
  Sparkles,
  GraduationCap,
} from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRegistering, setIsRegistering] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { loginAs } = useSession();

  // Registration Form State
  const [regNama, setRegNama] = useState('');
  const [regGender, setRegGender] = useState<'L' | 'P' | ''>('');
  const [regSchoolId, setRegSchoolId] = useState('');
  const [regClassId, setRegClassId] = useState('');
  const [regStudentCode, setRegStudentCode] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadDatabaseData() {
      try {
        const [usersRes, schoolsRes, classesRes, studentsRes] = await Promise.all([
          fetchUsers(),
          fetchSchools(),
          fetchClasses(),
          fetchStudents(),
        ]);

        if (!ignore) {
          if (usersRes.success && Array.isArray(usersRes.data)) {
            setUsers(usersRes.data);
          } else {
            setError(usersRes.message || 'Gagal memuat daftar pengguna dari database');
          }

          if (schoolsRes.success && Array.isArray(schoolsRes.data)) {
            setSchools(schoolsRes.data);
          }
          if (classesRes.success && Array.isArray(classesRes.data)) {
            setClasses(classesRes.data);
          }
          if (studentsRes.success && Array.isArray(studentsRes.data)) {
            setStudents(studentsRes.data);
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

    loadDatabaseData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const id = loginId.trim();

    if (!id) {
      setLoginError('ID Pengguna atau Kode Siswa wajib diisi');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Cari di users (01_USERS) - ADMIN / GURU
      const userMatch = users.find(
        u => u.id.toLowerCase() === id.toLowerCase() || u.email.toLowerCase() === id.toLowerCase()
      );

      if (userMatch) {
        if (userMatch.status !== 'active') {
          setLoginError('Akun pengguna berstatus tidak aktif');
          setSubmitting(false);
          return;
        }
        loginAs(userMatch);
        return;
      }

      // 2. Cari di students (04_STUDENTS) - SISWA
      const studentMatch = students.find(
        s => s.id.toLowerCase() === id.toLowerCase() || s.student_code.toLowerCase() === id.toLowerCase()
      );

      if (studentMatch) {
        if (studentMatch.status !== 'active') {
          setLoginError('Akun siswa berstatus tidak aktif');
          setSubmitting(false);
          return;
        }
        loginAs(studentMatch);
        return;
      }

      setLoginError('ID Pengguna atau Kode Siswa tidak ditemukan');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regNama.trim()) {
      setRegError('Nama Lengkap wajib diisi');
      return;
    }
    if (!regGender) {
      setRegError('Jenis Kelamin wajib dipilih');
      return;
    }
    if (!regSchoolId) {
      setRegError('Sekolah wajib dipilih');
      return;
    }
    if (!regClassId) {
      setRegError('Kelas wajib dipilih');
      return;
    }
    if (!regStudentCode.trim()) {
      setRegError('Kode Siswa / NISN wajib diisi');
      return;
    }
    if (!regBirthDate) {
      setRegError('Tanggal Lahir wajib diisi');
      return;
    }

    setSubmitting(true);

    try {
      // Periksa apakah Kode Siswa sudah terdaftar
      const isDuplicate = students.some(
        s => s.school_id === regSchoolId && s.class_id === regClassId && s.student_code.toLowerCase() === regStudentCode.trim().toLowerCase()
      );

      if (isDuplicate) {
        setRegError('Kode Siswa / NISN sudah terdaftar di kelas ini');
        setSubmitting(false);
        return;
      }

      const res = await createStudent({
        school_id: regSchoolId,
        class_id: regClassId,
        student_code: regStudentCode.trim(),
        nama: regNama.trim(),
        gender: regGender as 'L' | 'P',
        birth_date: regBirthDate,
        status: 'active',
      });

      if (res.success && res.data) {
        loginAs(res.data);
      } else {
        setRegError(res.message || 'Gagal mendaftar siswa baru');
      }
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Koneksi ke API gagal');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter kelas berdasarkan sekolah yang dipilih
  const filteredClasses = classes.filter(c => c.school_id === regSchoolId);

  // General Login Button for Students: Logs in as the first active student or prompts them to register
  const handleStudentGeneralLogin = () => {
    if (students.length > 0) {
      const activeStudent = students.find(s => s.status === 'active');
      if (activeStudent) {
        loginAs(activeStudent);
        return;
      }
    }
    setIsRegistering(true);
    setLoginError('Belum ada siswa terdaftar. Silakan lakukan pendaftaran baru.');
  };

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
            <HeartPulse className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
              Portal Layanan SANTARA
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Sistem Pemantauan Kesehatan Remaja SMA
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
          <Alert variant="error" title="Akses Ditolak">
            <div className="flex items-center gap-2 text-xs text-rose-900">
              <Lock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Anda tidak memiliki izin akses ke modul ini.</span>
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
          {/* Card Toggle Tab */}
          <div className="flex border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setLoginError(null);
                setRegError(null);
              }}
              className={`flex-1 pb-3 text-sm font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                !isRegistering
                  ? 'border-sky-500 text-sky-600 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setLoginError(null);
                setRegError(null);
              }}
              className={`flex-1 pb-3 text-sm font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                isRegistering
                  ? 'border-sky-500 text-sky-600 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Pendaftaran Siswa
            </button>
          </div>

          {loading ? (
            <LoadingState text="Menghubungkan ke database SANTARA..." />
          ) : error ? (
            <ErrorState message={error} onRetry={() => window.location.reload()} />
          ) : !isRegistering ? (
            /* ==================== LOGIN FORM ==================== */
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {loginError && (
                <Alert variant="error" title="Gagal Masuk">
                  <span className="text-xs text-rose-950">{loginError}</span>
                </Alert>
              )}

              <Input
                label="ID Pengguna atau Kode Siswa"
                placeholder="Contoh: USR001 (Admin), USR003 (Kader), STD001 (Siswa)"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                disabled={submitting}
                leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
                helperText="Akses untuk Admin, Kader SATRIA, dan Siswa sesuai basis data SANTARA."
              />

              {/* Quick Login Chips for Demo / Testing */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Contoh Akses Akun:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLoginId('USR001')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-400 text-slate-700 font-medium text-[11px] transition-colors"
                  >
                    👑 USR001 (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginId('USR003')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-sky-400 text-slate-700 font-medium text-[11px] transition-colors"
                  >
                    🩺 USR003 (Kader SATRIA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginId('STD001')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 font-medium text-[11px] transition-colors"
                  >
                    🎓 STD001 (Siswa)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 mt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={submitting}
                  className="w-full font-bold min-h-[44px]"
                  leftIcon={<LogIn className="w-4 h-4" />}
                >
                  Masuk ke Portal SANTARA
                </Button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Atau Masuk Cepat</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleStudentGeneralLogin}
                  disabled={submitting}
                  className="w-full font-bold min-h-[44px]"
                  leftIcon={<Sparkles className="w-4 h-4 text-sky-500" />}
                >
                  Masuk sebagai Siswa (Monitoring Hasil)
                </Button>
              </div>
            </form>
          ) : (
            /* ==================== REGISTER FORM ==================== */
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {regError && (
                <Alert variant="error" title="Gagal Mendaftar">
                  <span className="text-xs text-rose-950">{regError}</span>
                </Alert>
              )}

              <Input
                label="Nama Lengkap Siswa"
                placeholder="Masukkan nama lengkap sesuai absen"
                value={regNama}
                onChange={e => setRegNama(e.target.value)}
                disabled={submitting}
                leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Jenis Kelamin"
                  placeholder="Pilih jenis kelamin"
                  value={regGender}
                  onChange={e => setRegGender(e.target.value as 'L' | 'P' | '')}
                  disabled={submitting}
                  options={[
                    { value: 'L', label: 'Laki-laki (L)' },
                    { value: 'P', label: 'Perempuan (P)' },
                  ]}
                />

                <Input
                  label="Tanggal Lahir"
                  type="date"
                  value={regBirthDate}
                  onChange={e => setRegBirthDate(e.target.value)}
                  disabled={submitting}
                  leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Sekolah"
                  placeholder="Pilih asal sekolah"
                  value={regSchoolId}
                  onChange={e => {
                    setRegSchoolId(e.target.value);
                    setRegClassId('');
                  }}
                  disabled={submitting}
                  options={schools.map(s => ({
                    value: s.id,
                    label: s.name,
                  }))}
                />

                <Select
                  label="Kelas"
                  placeholder={regSchoolId ? 'Pilih kelas' : 'Pilih sekolah dahulu'}
                  value={regClassId}
                  onChange={e => setRegClassId(e.target.value)}
                  disabled={submitting || !regSchoolId}
                  options={filteredClasses.map(c => ({
                    value: c.id,
                    label: `Kelas ${c.grade} - ${c.class_name}`,
                  }))}
                />
              </div>

              <Input
                label="Kode Siswa / NISN / No. Induk"
                placeholder="Contoh: 12345"
                value={regStudentCode}
                onChange={e => setRegStudentCode(e.target.value)}
                disabled={submitting}
                leftIcon={<GraduationCap className="w-4 h-4 text-slate-400" />}
                helperText="Kode ini akan digunakan untuk masuk kembali di kemudian hari."
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={submitting}
                className="w-full font-bold min-h-[44px] mt-2"
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Daftar & Masuk Otomatis
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
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><LoadingState text="Memuat halaman login..." /></div>}>
      <LoginContent />
    </Suspense>
  );
}
