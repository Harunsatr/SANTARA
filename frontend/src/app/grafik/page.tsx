'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  Badge,
  Button,
  LoadingState,
  ErrorState,
  Alert,
} from '@/components/ui';
import { fetchExaminations, fetchClasses, fetchTTD } from '@/lib/api';
import { filterValidClasses } from '@/lib/adapters';
import { normalizeNutritionStatus, NUTRITION_STYLES } from '@/lib/utils/nutrition';
import { calculatePercentage } from '@/lib/utils/number';
import { useSession } from '@/context/SessionContext';
import {
  BarChart3,
  ShieldCheck,
  RefreshCw,
  Info,
  Layers,
  PieChart,
  Users,
  Pill,
  CheckCircle2,
  Lock,
  LogIn,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Examination, ClassRoom, TTDRecord } from '@/types/models';

interface GradeNutritionAggregate {
  gradeLabel: string;
  total: number;
  severelyThinness: number;
  thinness: number;
  normal: number;
  overweight: number;
  obese: number;
  percentages: {
    severelyThinness: number;
    thinness: number;
    normal: number;
    overweight: number;
    obese: number;
  };
}

interface ClassTTDAggregate {
  classId: string;
  className: string;
  grade: string;
  totalLogged: number;
  consumedCount: number;
  complianceRate: number;
}

export default function PublicGrafikPage() {
  const { isAuthenticated, isReady } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGrade, setActiveGrade] = useState<string>('ALL');

  // Dynamic Grade List from Database
  const [availableGrades, setAvailableGrades] = useState<string[]>(['10', '11', '12']);

  // Aggregated Nutrition Data State (Strictly Non-Personal)
  const [overallAggregate, setOverallAggregate] = useState<GradeNutritionAggregate>({
    gradeLabel: 'Seluruh Siswa',
    total: 0,
    severelyThinness: 0,
    thinness: 0,
    normal: 0,
    overweight: 0,
    obese: 0,
    percentages: { severelyThinness: 0, thinness: 0, normal: 0, overweight: 0, obese: 0 },
  });

  const [gradeAggregates, setGradeAggregates] = useState<Record<string, GradeNutritionAggregate>>({});

  // Aggregated TTD Compliance Data State
  const [classTTDAggregates, setClassTTDAggregates] = useState<ClassTTDAggregate[]>([]);
  const [totalTTDConsumed, setTotalTTDConsumed] = useState<number>(0);
  const [totalClassesCount, setTotalClassesCount] = useState<number>(0);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isReady, isAuthenticated, router]);

  useEffect(() => {
    let ignore = false;

    async function loadAndAggregate() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const [examsRes, classesRes, ttdRes] = await Promise.all([
          fetchExaminations(),
          fetchClasses(),
          fetchTTD(),
        ]);

        if (!ignore) {
          if (!examsRes.success) {
            setError(examsRes.message || 'Gagal memuat data pemeriksaan');
            setLoading(false);
            return;
          }

          const exams: Examination[] = examsRes.data || [];
          const rawClasses: ClassRoom[] = classesRes.success ? classesRes.data : [];
          const validClasses = filterValidClasses(rawClasses);
          const ttdRecords: TTDRecord[] = ttdRes.success ? ttdRes.data : [];

          // Map class ID to grade level and class name
          const classGradeMap = new Map<string, string>();
          const classNameMap = new Map<string, string>();
          const detectedGrades = new Set<string>();

          validClasses.forEach(c => {
            if (c.id) {
              const gr = String(c.grade || '10');
              classGradeMap.set(c.id, gr);
              classNameMap.set(c.id, c.class_name || `Kelas ${c.grade}`);
              detectedGrades.add(gr);
            }
          });

          // Sort available grades dynamically
          const sortedGrades = Array.from(detectedGrades).sort((a, b) => Number(a) - Number(b));
          if (sortedGrades.length > 0) {
            setAvailableGrades(sortedGrades);
          }

          // 1. Compute Overall and Grade-Level Nutrition Aggregates
          const overallCounts = { severelyThinness: 0, thinness: 0, normal: 0, overweight: 0, obese: 0, total: 0 };
          const byGrade: Record<string, typeof overallCounts> = {};

          sortedGrades.forEach(g => {
            byGrade[g] = { severelyThinness: 0, thinness: 0, normal: 0, overweight: 0, obese: 0, total: 0 };
          });

          exams.forEach(exam => {
            const status = normalizeNutritionStatus(exam.nutrional_status);
            const grade = classGradeMap.get(exam.class_id || '') || '10';

            overallCounts.total++;
            if (!byGrade[grade]) {
              byGrade[grade] = { severelyThinness: 0, thinness: 0, normal: 0, overweight: 0, obese: 0, total: 0 };
            }
            byGrade[grade].total++;

            if (status === 'Severely Thinness') {
              overallCounts.severelyThinness++;
              byGrade[grade].severelyThinness++;
            } else if (status === 'Thinness') {
              overallCounts.thinness++;
              byGrade[grade].thinness++;
            } else if (status === 'Normal') {
              overallCounts.normal++;
              byGrade[grade].normal++;
            } else if (status === 'Overweight') {
              overallCounts.overweight++;
              byGrade[grade].overweight++;
            } else if (status === 'Obese') {
              overallCounts.obese++;
              byGrade[grade].obese++;
            }
          });

          // Helper to build aggregate record
          const makeAggregate = (label: string, counts: typeof overallCounts): GradeNutritionAggregate => ({
            gradeLabel: label,
            total: counts.total,
            severelyThinness: counts.severelyThinness,
            thinness: counts.thinness,
            normal: counts.normal,
            overweight: counts.overweight,
            obese: counts.obese,
            percentages: {
              severelyThinness: calculatePercentage(counts.severelyThinness, counts.total),
              thinness: calculatePercentage(counts.thinness, counts.total),
              normal: calculatePercentage(counts.normal, counts.total),
              overweight: calculatePercentage(counts.overweight, counts.total),
              obese: calculatePercentage(counts.obese, counts.total),
            },
          });

          setOverallAggregate(makeAggregate('Seluruh Siswa', overallCounts));

          const builtGradeAggregates: Record<string, GradeNutritionAggregate> = {};
          sortedGrades.forEach(g => {
            builtGradeAggregates[g] = makeAggregate(`Kelas ${g}`, byGrade[g] || overallCounts);
          });
          setGradeAggregates(builtGradeAggregates);

          // 2. Compute Pure Non-Personal Aggregated TTD Data per Class
          const ttdByClass: Record<string, { totalLogged: number; consumedCount: number }> = {};
          validClasses.forEach(c => {
            ttdByClass[c.id] = { totalLogged: 0, consumedCount: 0 };
          });

          let totalConsumed = 0;
          ttdRecords.forEach(rec => {
            const isConsumed = rec.consumed === true || rec.consumed === 'TRUE' || rec.consumed === 'true' || Number(rec.consumed) === 1;
            if (rec.class_id && ttdByClass[rec.class_id]) {
              ttdByClass[rec.class_id].totalLogged++;
              if (isConsumed) {
                ttdByClass[rec.class_id].consumedCount++;
              }
            }
            if (isConsumed) {
              totalConsumed++;
            }
          });

          const classAggregatesList: ClassTTDAggregate[] = validClasses.map(c => {
            const data = ttdByClass[c.id] || { totalLogged: 0, consumedCount: 0 };
            return {
              classId: c.id,
              className: c.class_name || `Kelas ${c.grade}`,
              grade: String(c.grade || '10'),
              totalLogged: data.totalLogged,
              consumedCount: data.consumedCount,
              complianceRate: calculatePercentage(data.consumedCount, data.totalLogged),
            };
          });

          setClassTTDAggregates(classAggregatesList);
          setTotalTTDConsumed(totalConsumed);
          setTotalClassesCount(validClasses.length);

          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Koneksi ke API gagal');
          setLoading(false);
        }
      }
    }

    loadAndAggregate();

    return () => {
      ignore = true;
    };
  }, [refreshTrigger, isAuthenticated]);

  if (!isReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <LoadingState text="Memeriksa izin akses sesi..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mx-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Akses Terbatas — Khusus Pengguna Resmi</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
            Silakan Masuk Terlebih Dahulu
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            Data pemantauan status gizi siswa (Standar WHO) dan kepatuhan konsumsi Tablet Tambah Darah (TTD) hanya dapat diakses setelah melakukan autentikasi akun resmi (<strong>Kader SATRIA</strong> atau <strong>Kepala Sekolah</strong>).
          </p>
        </div>

        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md hover:shadow-sky-500/20 transition-all active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk ke Akun Anda</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentDisplay =
    activeGrade === 'ALL'
      ? overallAggregate
      : gradeAggregates[activeGrade] || overallAggregate;

  const categories = [
    { key: 'severelyThinness', label: 'Gizi Sangat Kurang', style: NUTRITION_STYLES['Severely Thinness'], count: currentDisplay.severelyThinness, pct: currentDisplay.percentages.severelyThinness },
    { key: 'thinness', label: 'Gizi Kurang', style: NUTRITION_STYLES['Thinness'], count: currentDisplay.thinness, pct: currentDisplay.percentages.thinness },
    { key: 'normal', label: 'Gizi Normal', style: NUTRITION_STYLES['Normal'], count: currentDisplay.normal, pct: currentDisplay.percentages.normal },
    { key: 'overweight', label: 'Gizi Lebih', style: NUTRITION_STYLES['Overweight'], count: currentDisplay.overweight, pct: currentDisplay.percentages.overweight },
    { key: 'obese', label: 'Obesitas', style: NUTRITION_STYLES['Obese'], count: currentDisplay.obese, pct: currentDisplay.percentages.obese },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-10 sm:gap-14">
      {/* 1. HEADER & PRIVACY NOTICE */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider w-fit">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistik Pemantauan Kesehatan</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
            Grafik Distribusi Status Gizi Remaja SMA
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
            Visualisasi distribusi status gizi siswa berdasarkan <strong>Standar WHO</strong> dan data kepatuhan konsumsi Tablet Tambah Darah (TTD). Data disajikan secara agregat untuk menjaga privasi medis siswa.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setLoading(true);
            setRefreshTrigger(prev => prev + 1);
          }}
          isLoading={loading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="shrink-0"
        >
          Perbarui Data
        </Button>
      </section>

      {/* 2. PRIVACY ASSURANCE ALERT */}
      <Alert variant="info" title="Perlindungan Privasi Medis Siswa">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            Halaman ini hanya menampilkan ringkasan statistik agregasi sekolah dan per kelas. Tidak ada nama, nomor induk, atau riwayat pemeriksaan perorangan yang dipublikasikan.
          </span>
        </div>
      </Alert>

      {loading ? (
        <LoadingState variant="table" rows={5} text="Menghitung agregasi statistik status gizi dan TTD..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRefreshTrigger(prev => prev + 1)} />
      ) : (
        <>
          {/* 3. DYNAMIC GRADE LEVEL TABS */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit overflow-x-auto max-w-full">
            {[
              { id: 'ALL', label: 'Seluruh Siswa' },
              ...availableGrades.map(g => ({ id: g, label: `Kelas ${g}` })),
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveGrade(tab.id)}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all shrink-0 ${
                  activeGrade === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 4. MAIN CHART & STATS CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Visual Bar Chart (Responsive Pure CSS/SVG) */}
            <Card className="lg:col-span-8 p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-sky-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Distribusi Persentase: {currentDisplay.gradeLabel}
                  </h2>
                </div>
                <Badge variant="neutral">
                  Total Terperiksa: {currentDisplay.total} Siswa
                </Badge>
              </div>

              {/* Stacked Percentage Bar */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-500">Komposisi Populasi Gizi</span>
                <div className="w-full h-8 bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
                  {categories.map(cat => {
                    if (cat.pct <= 0) return null;
                    return (
                      <div
                        key={cat.key}
                        style={{
                          width: `${cat.pct}%`,
                          backgroundColor: cat.style.color,
                        }}
                        className="h-full transition-all duration-500 relative group flex items-center justify-center text-white text-[10px] font-black"
                        title={`${cat.label}: ${cat.count} siswa (${cat.pct}%)`}
                      >
                        {cat.pct >= 10 && `${cat.pct}%`}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grouped Horizontal Breakdown Bars */}
              <div className="flex flex-col gap-4 mt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Rincian Kategori Standar WHO
                </span>

                <div className="flex flex-col gap-3.5">
                  {categories.map(cat => (
                    <div key={cat.key} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.style.color }}
                          />
                          <span className="font-bold text-slate-800">{cat.label}</span>
                          <span className="text-slate-400">({cat.style.zScoreRange})</span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {cat.count} siswa <span className="text-slate-500 font-normal">({cat.pct}%)</span>
                        </span>
                      </div>

                      {/* Progress Track */}
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${cat.pct}%`,
                            backgroundColor: cat.style.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Side Overview & Insights */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <Card className="p-6 bg-gradient-to-b from-sky-50 to-white border-sky-100 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Ringkasan Populasi
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-sky-100">
                    <span className="text-[11px] text-slate-500 block">Status Normal</span>
                    <span className="text-2xl font-black text-emerald-600">
                      {currentDisplay.percentages.normal}%
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-sky-100">
                    <span className="text-[11px] text-slate-500 block">Perlu Perhatian</span>
                    <span className="text-2xl font-black text-rose-600">
                      {(Math.round((currentDisplay.percentages.severelyThinness + currentDisplay.percentages.obese) * 10) / 10).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Siswa dengan kategori <strong>Gizi Sangat Kurang</strong> atau <strong>Obesitas</strong> mendapatkan tindak lanjut pendampingan gizi oleh kader SATRIA dan rujukan ke Puskesmas/UKS.
                </p>
              </Card>

              {/* Standar WHO Info Card */}
              <Card className="p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <Info className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Standar WHO Remaja
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Klasifikasi status gizi usia 5–19 tahun menggunakan <strong>Standar WHO</strong> dengan satuan Standar Deviasi (SD / Z-score) yang disesuaikan dengan jenis kelamin dan usia detail per bulan.
                </p>
              </Card>
            </div>
          </div>

          {/* 5. DATA TABLE AGREGAT PER TINGKAT KELAS */}
          <section className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Tabel Perbandingan Status Gizi Antar Tingkat Kelas (Standar WHO)
              </h3>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5 sm:px-6">Tingkat Kelas</th>
                    <th className="px-4 py-3.5 sm:px-6">Total Diperiksa</th>
                    <th className="px-4 py-3.5 sm:px-6 text-purple-700">Sgt Kurang (&lt;-3SD)</th>
                    <th className="px-4 py-3.5 sm:px-6 text-sky-700">Kurang (-3 s.d -2SD)</th>
                    <th className="px-4 py-3.5 sm:px-6 text-emerald-700">Normal (-2 s.d +1SD)</th>
                    <th className="px-4 py-3.5 sm:px-6 text-amber-700">Lebih (&gt;+1 s.d +2SD)</th>
                    <th className="px-4 py-3.5 sm:px-6 text-rose-700">Obesitas (&gt;+2SD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {availableGrades.map(gr => {
                    const row = gradeAggregates[gr];
                    if (!row) return null;
                    return (
                      <tr key={gr} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 sm:px-6 font-bold text-slate-900">
                          Kelas {gr}
                        </td>
                        <td className="px-4 py-3 sm:px-6 font-semibold">{row.total} siswa</td>
                        <td className="px-4 py-3 sm:px-6">{row.severelyThinness} ({row.percentages.severelyThinness}%)</td>
                        <td className="px-4 py-3 sm:px-6">{row.thinness} ({row.percentages.thinness}%)</td>
                        <td className="px-4 py-3 sm:px-6 font-bold text-emerald-600">{row.normal} ({row.percentages.normal}%)</td>
                        <td className="px-4 py-3 sm:px-6">{row.overweight} ({row.percentages.overweight}%)</td>
                        <td className="px-4 py-3 sm:px-6">{row.obese} ({row.percentages.obese}%)</td>
                      </tr>
                    );
                  })}
                  {/* Overall Footer Row */}
                  <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                    <td className="px-4 py-3 sm:px-6">TOTAL SEMUA KELAS</td>
                    <td className="px-4 py-3 sm:px-6">{overallAggregate.total} siswa</td>
                    <td className="px-4 py-3 sm:px-6">{overallAggregate.severelyThinness} ({overallAggregate.percentages.severelyThinness}%)</td>
                    <td className="px-4 py-3 sm:px-6">{overallAggregate.thinness} ({overallAggregate.percentages.thinness}%)</td>
                    <td className="px-4 py-3 sm:px-6 text-emerald-600">{overallAggregate.normal} ({overallAggregate.percentages.normal}%)</td>
                    <td className="px-4 py-3 sm:px-6">{overallAggregate.overweight} ({overallAggregate.percentages.overweight}%)</td>
                    <td className="px-4 py-3 sm:px-6">{overallAggregate.obese} ({overallAggregate.percentages.obese}%)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 6. MODUL KEPATUHAN KONSUMSI TABLET TAMBAH DARAH (TTD) — AGREGASI PUBLIK */}
          <section className="flex flex-col gap-6 pt-4 border-t border-slate-200">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider w-fit">
                <Pill className="w-3.5 h-3.5" />
                <span>Kepatuhan Konsumsi Tablet Tambah Darah</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
                Anjuran Minum Tablet Tambah Darah & Distribusi Agregat per Kelas
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Data agregat kepatuhan konsumsi Tablet Tambah Darah (TTD) mingguan bagi remaja putri berdasarkan laporan pencatatan kelas. Data disajikan secara teragregasi per rombongan belajar tanpa membuka identitas siswa.
              </p>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-rose-50/60 to-white border-rose-100">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Pill className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Diminum</span>
                  <span className="text-2xl font-black text-slate-900">{totalTTDConsumed} Konsumsi</span>
                  <span className="text-[11px] text-slate-400">Catatan kepatuhan TTD</span>
                </div>
              </Card>

              <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-sky-50/60 to-white border-sky-100">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Kelas</span>
                  <span className="text-2xl font-black text-slate-900">{totalClassesCount} Kelas</span>
                  <span className="text-[11px] text-slate-400">Terdaftar di database</span>
                </div>
              </Card>

              <Card className="p-5 flex items-center gap-4 bg-gradient-to-br from-emerald-50/60 to-white border-emerald-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Pemantauan</span>
                  <span className="text-2xl font-black text-emerald-600">Aktif</span>
                  <span className="text-[11px] text-slate-400">Dipantau berkala</span>
                </div>
              </Card>
            </div>

            {/* Distribution Grid Cards per Class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classTTDAggregates.map(cls => (
                <Card key={cls.classId} className="p-5 flex flex-col gap-3 border-slate-200/80 hover:border-rose-300 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{cls.className}</span>
                    <Badge variant={cls.consumedCount > 0 ? 'success' : 'neutral'} size="sm">
                      {cls.consumedCount > 0 ? 'Tercatat' : 'Belum Ada Data'}
                    </Badge>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-slate-100 pt-2 text-xs">
                    <span className="text-slate-500">Jumlah Siswa Minum:</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {cls.consumedCount} siswa sudah minum
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Aggregate Table per Class */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5 sm:px-6">Kelas</th>
                    <th className="px-4 py-3.5 sm:px-6">Tingkat</th>
                    <th className="px-4 py-3.5 sm:px-6 text-rose-700">Jumlah Siswa Sudah Minum TTD</th>
                    <th className="px-4 py-3.5 sm:px-6">Status Kepatuhan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classTTDAggregates.map(cls => (
                    <tr key={cls.classId} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 sm:px-6 font-bold text-slate-900">{cls.className}</td>
                      <td className="px-4 py-3 sm:px-6">Kelas {cls.grade}</td>
                      <td className="px-4 py-3 sm:px-6 font-extrabold text-rose-600">
                        {cls.consumedCount} siswa sudah minum
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        {cls.consumedCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Terdata ({cls.consumedCount} dosis)
                          </span>
                        ) : (
                          <span className="text-slate-400">Belum ada input</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
                    <td className="px-4 py-3 sm:px-6" colSpan={2}>TOTAL KONSUMSI TTD SELURUH KELAS</td>
                    <td className="px-4 py-3 sm:px-6 text-rose-600 font-black">{totalTTDConsumed} siswa sudah minum</td>
                    <td className="px-4 py-3 sm:px-6 text-slate-700 font-bold">{totalClassesCount} Kelas Terdata</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
