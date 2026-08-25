'use client';

// PROTOTYPE ONLY — Auth backend required for production.
// PROTOTYPE AUTHORIZATION: Data isolation is performed client-side by filtering with student_id from session.
// Production authorization requires server-side per-student access control.

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  Badge,
  Button,
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
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { getRoleLabel, normalizeRole } from '@/lib/auth/roleGuard';

export default function SiswaDashboardPage() {
  const { user } = useSession();
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
        const [studentsRes, examsRes, screeningsRes, ttdRes] = await Promise.all([
          fetchStudents(),
          fetchExaminations(),
          fetchScreenings(),
          fetchTTD(),
        ]);

        if (ignore) return;

        const currentUserId = user?.id;
        const currentUserName = user?.userName;

        // Match student profile
        if (studentsRes.success && studentsRes.data) {
          const match = studentsRes.data.find(
            s =>
              (currentUserId && s.id.toLowerCase() === currentUserId.toLowerCase()) ||
              s.nama.toLowerCase() === displayName.toLowerCase() ||
              (currentUserName && s.student_code.toLowerCase() === currentUserName.toLowerCase())
          );

          if (match) {
            setStudentProfile(match);

            // Filter all health records exclusively for this student
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
          setError(err instanceof Error ? err.message : 'Gagal memuat data kesehatan siswa');
          setLoading(false);
        }
      }
    }

    loadStudentData();
    return () => {
      ignore = true;
    };
  }, [user, displayName]);

  const ttdConsumed = ttdRecords.filter(t => {
    const v = String(t.consumed).toLowerCase();
    return v === 'true' || v === 'ya' || v === '1';
  }).length;

  const latestExam = examinations[examinations.length - 1] ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* 1. WELCOME BANNER & PROFILE */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              {getRoleLabel(role || 'SISWA')} • MONITORING
            </span>
            <span className="text-xs text-slate-400">• Read-Only</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
            Selamat Datang, {studentProfile ? studentProfile.nama : displayName}
          </h1>

          <div className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>NISN / Kode: {studentProfile?.student_code || '-'}</span>
            </span>
            <span>•</span>
            <span>Gender: {studentProfile?.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</span>
            <span>•</span>
            <span>Tgl Lahir: {studentProfile?.birth_date ? formatDateIndonesian(studentProfile.birth_date) : '-'}</span>
          </div>
        </div>

        <div className="shrink-0">
          <Link href="/edukasi">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<BookOpen className="w-4 h-4" />}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold"
            >
              Media Edukasi
            </Button>
          </Link>
        </div>
      </section>

      {loading ? (
        <LoadingState text="Memuat rekam kesehatan & catatan JAKRA Anda..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          {/* 2. STATS OVERVIEW */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              title="Pemeriksaan Antropometri"
              value={examinations.length}
              description="Total sesi pengukuran TB/BB tercatat"
              icon={<Activity className="w-6 h-6" />}
              iconBgColor="bg-sky-50 text-sky-600"
            />
            <StatsCard
              title="Skrining Kesehatan"
              value={screenings.length}
              description="Pemeriksaan Hb & tekanan darah"
              icon={<Stethoscope className="w-6 h-6" />}
              iconBgColor="bg-cyan-50 text-cyan-600"
            />
            <StatsCard
              title="Kepatuhan TTD"
              value={`${ttdConsumed} Log`}
              description={`dari ${ttdRecords.length} jadwal konsumsi`}
              icon={<Pill className="w-6 h-6" />}
              iconBgColor="bg-amber-50 text-amber-600"
            />
          </section>

          {/* 3. LATEST STATUS GIZI SUMMARY */}
          {latestExam ? (
            <Card className="p-6 sm:p-8 flex flex-col gap-6 border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Status Gizi Terkini (Pemeriksaan Terakhir)
                  </h2>
                </div>
                <span className="text-xs text-slate-400">
                  Tanggal: {formatDateIndonesian(latestExam.examination_date)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Tinggi Badan
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    {latestExam.height_cm} <span className="text-xs font-normal text-slate-500">cm</span>
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Berat Badan
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    {latestExam.weight_kg} <span className="text-xs font-normal text-slate-500">kg</span>
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Indeks Massa Tubuh (IMT)
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    {latestExam.bmi ?? '-'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Status Gizi (Standar WHO)
                  </span>
                  <div className="mt-1">
                    <Badge variant="nutrition" nutritionStatus={latestExam.nutrional_status} dot size="sm" />
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="p-6 rounded-2xl bg-sky-50 border border-sky-100 text-xs text-sky-900">
              Belum ada data pemeriksaan antropometri yang dicatat oleh Kader SATRIA.
            </div>
          )}

          {/* 4. DIGITAL JAKRA (JEJAK KESEHATAN REMAJA) PERIODIC TABLE */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Kartu Pemantauan Kesehatan JAKRA (Jejak Kesehatan Remaja)
                </h3>
              </div>
              <a
                href="https://drive.google.com/file/d/18pUXE47Lp1gzSQRWU18PK67D1sIOI4wE/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200"
              >
                <span>Buka Format Cetak JAKRA (Google Drive) &rarr;</span>
              </a>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3 sm:px-6">Sesi #</th>
                    <th className="px-4 py-3 sm:px-6">Tanggal Periksa</th>
                    <th className="px-4 py-3 sm:px-6">BB (kg)</th>
                    <th className="px-4 py-3 sm:px-6">TB (cm)</th>
                    <th className="px-4 py-3 sm:px-6">IMT</th>
                    <th className="px-4 py-3 sm:px-6">Status Gizi (WHO)</th>
                    <th className="px-4 py-3 sm:px-6">LiLA / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {examinations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-xs text-slate-400">
                        Belum ada riwayat pemeriksaan berkala yang tercatat di basis data.
                      </td>
                    </tr>
                  ) : (
                    examinations.map((exam, idx) => (
                      <tr key={exam.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 sm:px-6 font-bold text-slate-400">
                          Bulan {idx + 1}
                        </td>
                        <td className="px-4 py-3 sm:px-6 text-slate-600 whitespace-nowrap">
                          {formatDateIndonesian(exam.examination_date)}
                        </td>
                        <td className="px-4 py-3 sm:px-6 font-semibold">{exam.weight_kg}</td>
                        <td className="px-4 py-3 sm:px-6 font-semibold">{exam.height_cm}</td>
                        <td className="px-4 py-3 sm:px-6 font-bold text-slate-900">{exam.bmi || '-'}</td>
                        <td className="px-4 py-3 sm:px-6 whitespace-nowrap">
                          <Badge variant="nutrition" nutritionStatus={exam.nutrional_status} dot size="sm" />
                        </td>
                        <td className="px-4 py-3 sm:px-6 text-xs text-slate-500">
                          {exam.lila_cm ? (
                            <span className="font-semibold text-slate-800">
                              LiLA: {exam.lila_cm} cm {exam.clean_notes && `| ${exam.clean_notes}`}
                            </span>
                          ) : (
                            exam.notes || '-'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. SCREENING & TTD HISTORY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Screenings */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Riwayat Skrining Hb &amp; Tekanan Darah
                </h3>
              </div>

              <Card className="p-4 overflow-hidden">
                {screenings.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">
                    Belum ada data skrining klinis.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {screenings.map(sc => (
                      <div key={sc.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{sc.screening_type}</span>
                          <span className="text-slate-400 text-[11px]">
                            {formatDateIndonesian(sc.screening_date)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                            {sc.result}
                          </span>
                          {sc.notes && <p className="text-[10px] text-slate-500 mt-0.5">{sc.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>

            {/* TTD Logs */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Riwayat Konsumsi Tablet Tambah Darah (TTD)
                </h3>
              </div>

              <Card className="p-4 overflow-hidden">
                {ttdRecords.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">
                    Belum ada log konsumsi TTD tercatat.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {ttdRecords.map(ttd => {
                      const isYes =
                        String(ttd.consumed).toLowerCase() === 'true' ||
                        String(ttd.consumed).toLowerCase() === 'ya' ||
                        String(ttd.consumed).toLowerCase() === '1';
                      return (
                        <div key={ttd.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">
                              {formatDateIndonesian(ttd.consumption_date)}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              Jumlah: {ttd.quantity || 1} Tablet
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              isYes
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isYes ? '✓ Diminum' : '✗ Tidak Diminum'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </section>
          </div>

          {!studentProfile && !loading && (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <p className="font-bold">Data siswa tidak ditemukan di database 04_STUDENTS.</p>
              <p className="mt-1 leading-relaxed">
                Akun Anda (<strong>{displayName}</strong>) belum terhubung ke baris siswa di 04_STUDENTS. Hubungi Kader SATRIA atau Pembina UKS sekolah untuk mencocokkan data.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
