'use client';

// PROTOTYPE ONLY — Auth backend required for production.
// PROTOTYPE AUTHORIZATION: Data isolation is performed client-side by filtering with student_id from session.
// Production authorization requires server-side per-student access control.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  LoadingState,
  ErrorState,
  StatsCard,
} from '@/components/ui';
import {
  fetchExaminations,
  fetchScreenings,
  fetchTTD,
  fetchStudents,
} from '@/lib/api';
import { adaptExaminationsFromApi } from '@/lib/adapters';
import { formatDateIndonesian } from '@/lib/utils/date';
import { useSession } from '@/context/SessionContext';
import { Student, ExaminationWithLiLA, Screening, TTDRecord } from '@/types/models';
import {
  HeartPulse,
  Activity,
  Stethoscope,
  Pill,
  User,
  LogOut,
  ShieldAlert,
  BookOpen,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { getRoleLabel, normalizeRole } from '@/lib/auth/roleGuard';

export default function SiswaDashboardPage() {
  const { user, logout } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [examinations, setExaminations] = useState<ExaminationWithLiLA[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [ttdRecords, setTtdRecords] = useState<TTDRecord[]>([]);

  const role = normalizeRole(String(user?.role || ''));
  const displayName = user?.userName || user?.name || 'Siswa';

  useEffect(() => {
    if (!user) return;
    let ignore = false;

    async function loadStudentData() {
      try {
        // PROTOTYPE: We fetch all and filter client-side by student name match
        // Production would use server-side student_id filtering
        const [studentsRes, examsRes, screeningsRes, ttdRes] = await Promise.all([
          fetchStudents(),
          fetchExaminations(),
          fetchScreenings(),
          fetchTTD(),
        ]);

        if (ignore) return;

        // Try to find student profile by matching user name
        if (studentsRes.success && studentsRes.data) {
          const match = studentsRes.data.find(
            s => s.nama.toLowerCase() === displayName.toLowerCase()
          );
          if (match) {
            setStudentProfile(match);

            // Filter all health data to this student only
            if (examsRes.success && examsRes.data) {
              const myExams = examsRes.data.filter(e => e.student_id === match.id);
              setExaminations(adaptExaminationsFromApi(myExams));
            }
            if (screeningsRes.success && screeningsRes.data) {
              setScreenings(screeningsRes.data.filter(s => s.student_id === match.id));
            }
            if (ttdRes.success && ttdRes.data) {
              setTtdRecords(ttdRes.data.filter(t => t.student_id === match.id));
            }
          }
        } else if (!studentsRes.success) {
          setError(studentsRes.message || 'Gagal memuat profil siswa');
        }

        setLoading(false);
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data');
          setLoading(false);
        }
      }
    }

    loadStudentData();
    return () => { ignore = true; };
  }, [user, displayName]);

  const ttdConsumed = ttdRecords.filter(t => {
    const v = String(t.consumed).toLowerCase();
    return v === 'true' || v === 'ya' || v === '1';
  }).length;

  const latestExam = examinations[examinations.length - 1] ?? null;
  const latestScreening = screenings[screenings.length - 1] ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Prototype Header */}
      <div className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 text-center text-[11px] font-semibold text-amber-300">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold tracking-wider uppercase">
              PROTOTYPE SESSION — AUTH BACKEND REQUIRED FOR PRODUCTION
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">SANTARA</span>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest -mt-0.5">
                Portal Siswa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl">
              <User className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white max-w-[120px] truncate">{displayName}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  {getRoleLabel(role || '')}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* Welcome Banner */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border border-slate-800 shadow-md">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                Portal Siswa
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
              Selamat Datang, {displayName}
            </h1>
            {studentProfile && (
              <p className="text-sm text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                <span>Kode: {studentProfile.student_code}</span>
                <span>•</span>
                <span>Kelas: {studentProfile.class_id}</span>
              </p>
            )}
          </div>
        </section>

        {loading ? (
          <LoadingState text="Memuat data kesehatan Anda..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatsCard
                title="Pemeriksaan Gizi"
                value={examinations.length}
                description="Riwayat antropometri tercatat"
                icon={<Activity className="w-6 h-6" />}
                iconBgColor="bg-sky-50 text-sky-600"
              />
              <StatsCard
                title="Skrining Kesehatan"
                value={screenings.length}
                description="Hb & tekanan darah"
                icon={<Stethoscope className="w-6 h-6" />}
                iconBgColor="bg-cyan-50 text-cyan-600"
              />
              <StatsCard
                title="TTD Dikonsumsi"
                value={ttdConsumed}
                description={`dari ${ttdRecords.length} log tercatat`}
                icon={<Pill className="w-6 h-6" />}
                iconBgColor="bg-amber-50 text-amber-600"
              />
            </section>

            {/* Latest Examination */}
            {latestExam && (
              <Card className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Activity className="w-5 h-5 text-sky-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Hasil Pemeriksaan Terakhir
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Berat Badan', value: `${latestExam.weight_kg} kg` },
                    { label: 'Tinggi Badan', value: `${latestExam.height_cm} cm` },
                    { label: 'IMT', value: String(latestExam.bmi ?? '-') },
                    { label: 'Status Gizi', value: latestExam.nutrional_status || '-' },
                  ].map(item => (
                    <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">{item.label}</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  Tanggal: {formatDateIndonesian(latestExam.examination_date)}
                </p>
              </Card>
            )}

            {/* Latest Screening */}
            {latestScreening && (
              <Card className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Stethoscope className="w-5 h-5 text-cyan-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Skrining Terakhir
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Jenis</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{latestScreening.screening_type}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Hasil</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{latestScreening.result || '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Tanggal</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {formatDateIndonesian(latestScreening.screening_date)}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {!studentProfile && !loading && (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
                <p className="font-bold">Data siswa tidak ditemukan di database.</p>
                <p className="mt-1 text-xs text-amber-700">
                  Nama akun Anda (<strong>{displayName}</strong>) tidak cocok dengan catatan siswa di 04_STUDENTS.
                  Hubungi Guru atau Admin untuk mencocokkan data.
                </p>
              </div>
            )}

            {/* Quick Links */}
            <Card className="p-6 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Tautan Cepat</h3>
              <div className="flex flex-col gap-2">
                <Link
                  href="/edukasi"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    Materi Edukasi Kesehatan
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/grafik"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-600" />
                    Grafik Kesehatan Sekolah
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </Card>
          </>
        )}

        {/* Prototype Notice */}
        <div className="text-center text-xs text-slate-400 pb-4">
          PROTOTYPE AUTHORIZATION — Data siswa difilter secara client-side berdasarkan nama pengguna.
          Auth backend dengan student_id formal diperlukan untuk isolasi data production.
        </div>
      </div>
    </div>
  );
}
