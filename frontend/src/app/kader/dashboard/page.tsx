'use client';

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
  fetchStudents,
  fetchExaminations,
  fetchScreenings,
  fetchTTD,
  fetchClasses,
  fetchSchools,
} from '@/lib/api';
import { adaptExaminationsFromApi, filterValidClasses, resolveClassName, resolveSchoolName } from '@/lib/adapters';
import { calculateNutritionDistribution, calculateTTDCompliance } from '@/lib/utils/analytics';
import { NUTRITION_STYLES } from '@/lib/utils/nutrition';
import { formatDateIndonesian } from '@/lib/utils/date';
import { useSession } from '@/context/SessionContext';
import { normalizeRole, getRoleLabel, formatRoleDisplayName } from '@/lib/auth/roleGuard';
import {
  Student,
  ExaminationWithLiLA,
  Screening,
  TTDRecord,
  ClassRoom,
  School,
} from '@/types/models';
import {
  LayoutDashboard,
  Users,
  Activity,
  Stethoscope,
  Pill,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';

export default function KaderDashboardPage() {
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Live Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [examinations, setExaminations] = useState<ExaminationWithLiLA[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [ttdRecords, setTtdRecords] = useState<TTDRecord[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      try {
        const [
          studentsRes,
          examsRes,
          screeningsRes,
          ttdRes,
          classesRes,
          schoolsRes,
        ] = await Promise.all([
          fetchStudents(),
          fetchExaminations(),
          fetchScreenings(),
          fetchTTD(),
          fetchClasses(),
          fetchSchools(),
        ]);

        if (!ignore) {
          if (studentsRes.success) setStudents(studentsRes.data || []);
          if (examsRes.success) setExaminations(adaptExaminationsFromApi(examsRes.data || []));
          if (screeningsRes.success) setScreenings(screeningsRes.data || []);
          if (ttdRes.success) setTtdRecords(ttdRes.data || []);
          if (classesRes.success) setClasses(filterValidClasses(classesRes.data || []));
          if (schoolsRes.success) setSchools(schoolsRes.data || []);

          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data dashboard');
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  // Analytics Computation
  const nutritionDist = calculateNutritionDistribution(examinations);
  const ttdCompliance = calculateTTDCompliance(ttdRecords);
  const atRiskCount = nutritionDist.severelyThinness + nutritionDist.obese;
  const schoolName = resolveSchoolName(user?.school_id, schools);
  const userRole = normalizeRole(String(user?.role || ''));
  const roleLabel = getRoleLabel(userRole || user?.role || '');

  // Student Name Lookup Map
  const studentMap = new Map<string, Student>();
  students.forEach(s => {
    if (s.id) studentMap.set(s.id, s);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-8">
      {/* 1. WELCOME BANNER & PROFILE OVERVIEW */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold uppercase tracking-wider">
              {roleLabel}
            </span>
            <span className="text-xs text-slate-400">• ID: {user?.id || '-'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
            Selamat Datang, {formatRoleDisplayName(user?.name || user?.userName, userRole)}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5">
            <span>{schoolName}</span>
            <span>•</span>
            <span>{classes.length} Kelas Aktif</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLoading(true);
              setRefreshTrigger(prev => prev + 1);
            }}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-full sm:w-auto"
          >
            Refresh Data
          </Button>

          <Link href="/kader/status-gizi" className="w-full sm:w-auto">
            <Button
              size="sm"
              variant="primary"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="w-full sm:w-auto font-bold shadow-sm"
            >
              Entri Gizi
            </Button>
          </Link>
        </div>
      </section>

      {loading ? (
        <LoadingState variant="card" rows={6} text="Memuat metrik kesehatan dan data pemeriksaan..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRefreshTrigger(prev => prev + 1)} />
      ) : (
        <>
          {/* 2. STATS CARDS GRID */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Siswa Terdata"
              value={students.length}
              description={`Tersebar di ${classes.length} kelas aktif`}
              icon={<Users className="w-6 h-6" />}
              iconBgColor="bg-sky-50 text-sky-600"
            />

            <StatsCard
              title="Pemeriksaan Antropometri"
              value={examinations.length}
              description="Pengukuran TB, BB, IMT & LiLA"
              icon={<Activity className="w-6 h-6" />}
              iconBgColor="bg-emerald-50 text-emerald-600"
            />

            <StatsCard
              title="Skrining Hb & Tekanan Darah"
              value={screenings.length}
              description="Deteksi dini anemia remaja"
              icon={<Stethoscope className="w-6 h-6" />}
              iconBgColor="bg-cyan-50 text-cyan-600"
            />

            <StatsCard
              title="Kepatuhan Minum TTD"
              value={`${ttdCompliance.percentage}%`}
              description={`${ttdCompliance.consumedCount} dari ${ttdCompliance.totalTarget} log tuntas`}
              icon={<Pill className="w-6 h-6" />}
              iconBgColor="bg-amber-50 text-amber-600"
              badge={
                atRiskCount > 0 ? (
                  <Badge variant="danger" size="sm" dot>
                    {atRiskCount} Siswa Perlu Perhatian
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm">
                    Status Baik
                  </Badge>
                )
              }
            />
          </section>

          {/* 3. STANDAR WHO & QUICK ACTIONS */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Standar WHO Nutrition Breakdown Card */}
            <Card className="lg:col-span-8 p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Distribusi Status Gizi Siswa (Standar WHO)
                  </h2>
                </div>
                <Badge variant="neutral">
                  Total Pemeriksaan: {nutritionDist.total}
                </Badge>
              </div>

              {/* Progress Stack */}
              <div className="flex flex-col gap-2">
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  {Object.entries(NUTRITION_STYLES)
                    .filter(([k]) => k !== 'UNKNOWN')
                    .map(([key, style]) => {
                      let count = 0;
                      if (key === 'Severely Thinness') count = nutritionDist.severelyThinness;
                      else if (key === 'Thinness') count = nutritionDist.thinness;
                      else if (key === 'Normal') count = nutritionDist.normal;
                      else if (key === 'Overweight') count = nutritionDist.overweight;
                      else if (key === 'Obese') count = nutritionDist.obese;

                      const pct = nutritionDist.total > 0 ? (count / nutritionDist.total) * 100 : 0;
                      if (pct <= 0) return null;

                      return (
                        <div
                          key={key}
                          style={{ width: `${pct}%`, backgroundColor: style.color }}
                          className="h-full"
                          title={`${style.label}: ${count} (${Math.round(pct)}%)`}
                        />
                      );
                    })}
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(NUTRITION_STYLES)
                  .filter(([k]) => k !== 'UNKNOWN')
                  .map(([key, style]) => {
                    let count = 0;
                    if (key === 'Severely Thinness') count = nutritionDist.severelyThinness;
                    else if (key === 'Thinness') count = nutritionDist.thinness;
                    else if (key === 'Normal') count = nutritionDist.normal;
                    else if (key === 'Overweight') count = nutritionDist.overweight;
                    else if (key === 'Obese') count = nutritionDist.obese;

                    const pct = nutritionDist.total > 0 ? Math.round((count / nutritionDist.total) * 100) : 0;

                    return (
                      <div
                        key={key}
                        className="p-3.5 rounded-xl border flex flex-col gap-1"
                        style={{ backgroundColor: style.bgColor, borderColor: style.borderColor }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: style.color }}
                          />
                          <span className="text-[11px] font-bold text-slate-700 truncate">
                            {style.label}
                          </span>
                        </div>
                        <span className="text-xl font-black" style={{ color: style.textColor }}>
                          {count}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {pct}% dari total
                        </span>
                      </div>
                    );
                  })}
              </div>
            </Card>

            {/* Quick Actions Panel */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <Card className="p-6 flex flex-col gap-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-sky-600" />
                  <span>Modul Kerja</span>
                </h3>

                <div className="flex flex-col gap-2 mt-1">
                  <Link
                    href="/kader/status-gizi"
                    className="p-3 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200/80 hover:border-sky-300 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sky-600" />
                      Entri Status Gizi & LiLA
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href="/kader/skrining"
                    className="p-3 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200/80 hover:border-cyan-300 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-cyan-600" />
                      Skrining Hb & Tekanan Darah
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href="/kader/ttd"
                    className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-amber-600" />
                      Pencatatan Tablet Tambah Darah
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <Link
                    href="/kader/data-siswa"
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-600" />
                      Direktori Siswa & JAKRA
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </Card>

              {/* Alert for At-Risk Students */}
              {atRiskCount > 0 ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 text-xs text-rose-900">
                    <span className="font-bold">Perhatian: {atRiskCount} Siswa Berisiko Gizi</span>
                    <p className="leading-relaxed text-rose-800">
                      Terdapat siswa dengan klasifikasi Gizi Sangat Kurang atau Obesitas yang memerlukan konseling gizi dan tindak lanjut UKS.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 text-xs text-emerald-900">
                    <span className="font-bold">Status Gizi Prima</span>
                    <p className="leading-relaxed text-emerald-800">
                      Tidak ada kasus gizi sangat kurang atau obesitas berat yang terdeteksi pada pemeriksaan terkini.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 4. RECENT ANTHROPOMETRY EXAMINATIONS TABLE */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Riwayat Pemeriksaan Antropometri Terkini
                </h3>
              </div>
              <Link href="/kader/status-gizi" className="text-xs font-bold text-sky-600 hover:underline">
                Lihat Semua
              </Link>
            </div>

            {examinations.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                Belum ada data pemeriksaan antropometri yang tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="px-4 py-3 sm:px-6">Tanggal</th>
                      <th className="px-4 py-3 sm:px-6">Siswa</th>
                      <th className="px-4 py-3 sm:px-6">Kelas</th>
                      <th className="px-4 py-3 sm:px-6">BB (kg)</th>
                      <th className="px-4 py-3 sm:px-6">TB (cm)</th>
                      <th className="px-4 py-3 sm:px-6">IMT</th>
                      <th className="px-4 py-3 sm:px-6">Status Gizi (Standar WHO)</th>
                      <th className="px-4 py-3 sm:px-6">LiLA / Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {examinations.slice(0, 5).map(exam => {
                      const st = studentMap.get(exam.student_id);
                      const className = resolveClassName(exam.class_id, classes);

                      return (
                        <tr key={exam.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 sm:px-6 text-slate-500 whitespace-nowrap">
                            {formatDateIndonesian(exam.examination_date)}
                          </td>
                          <td className="px-4 py-3 sm:px-6 whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {st ? st.nama : 'Data Siswa Tidak Ditemukan'}
                            </div>
                            {st?.student_code && (
                              <div className="text-[11px] font-mono text-slate-400">
                                No. {st.student_code}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 sm:px-6 whitespace-nowrap">
                            {className}
                          </td>
                          <td className="px-4 py-3 sm:px-6 font-semibold">
                            {exam.weight_kg}
                          </td>
                          <td className="px-4 py-3 sm:px-6 font-semibold">
                            {exam.height_cm}
                          </td>
                          <td className="px-4 py-3 sm:px-6 font-bold text-slate-900">
                            {exam.bmi || '-'}
                          </td>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
