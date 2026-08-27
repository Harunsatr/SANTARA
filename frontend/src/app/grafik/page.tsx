'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  Badge,
  Button,
  LoadingState,
  ErrorState,
  Alert,
  Input,
} from '@/components/ui';
import { fetchExaminations, fetchClasses, fetchTTD, createClass } from '@/lib/api';
import { filterValidClasses, normalizeString, normalizeBoolean } from '@/lib/adapters';
import { formatGradeToRoman, formatClassNameToRoman } from '@/lib/normalizers/dataNormalizer';
import { normalizeNutritionStatus, NUTRITION_STYLES, NutritionCategoryStyle } from '@/lib/utils/nutrition';
import { calculatePercentage } from '@/lib/utils/number';
import { useSession } from '@/context/SessionContext';
import {
  BarChart3,
  ShieldCheck,
  RefreshCw,
  Info,
  Layers,
  Users,
  Pill,
  CheckCircle2,
  Lock,
  LogIn,
  ArrowLeft,
  AlertCircle,
  PlusCircle,
  X,
} from 'lucide-react';
import { Examination, ClassRoom, TTDRecord } from '@/types/models';

interface GradeNutritionAggregate {
  gradeLabel: string;
  gradeKey: string;
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

const CATEGORY_KEYS: {
  key: 'severelyThinness' | 'thinness' | 'normal' | 'overweight' | 'obese';
  label: string;
  shortLabel: string;
  style: NutritionCategoryStyle;
}[] = [
  { key: 'severelyThinness', label: 'Gizi Sangat Kurang', shortLabel: 'Sangat Kurang', style: NUTRITION_STYLES['Severely Thinness'] },
  { key: 'thinness', label: 'Gizi Kurang', shortLabel: 'Kurus', style: NUTRITION_STYLES['Thinness'] },
  { key: 'normal', label: 'Gizi Normal', shortLabel: 'Normal', style: NUTRITION_STYLES['Normal'] },
  { key: 'overweight', label: 'Gizi Lebih', shortLabel: 'Lebih', style: NUTRITION_STYLES['Overweight'] },
  { key: 'obese', label: 'Obesitas', shortLabel: 'Obesitas', style: NUTRITION_STYLES['Obese'] },
];

export default function ProtectedGrafikPage() {
  const { user, isAuthenticated, isReady } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGrade, setActiveGrade] = useState<string>('ALL');

  // Dynamic Grade List from Database (defaults to at least 10, 11, 12)
  const [availableGrades, setAvailableGrades] = useState<string[]>(['10', '11', '12']);
  const [allClasses, setAllClasses] = useState<ClassRoom[]>([]);

  // Modal State for Add Class
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newGrade, setNewGrade] = useState('11');
  const [newAcademicYear, setNewAcademicYear] = useState(`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);
  const [submittingClass, setSubmittingClass] = useState(false);
  const [addClassError, setAddClassError] = useState<string | null>(null);
  const [addClassSuccess, setAddClassSuccess] = useState<string | null>(null);

  // Aggregated Nutrition Data State (Strictly Non-Personal)
  const [overallAggregate, setOverallAggregate] = useState<GradeNutritionAggregate>({
    gradeLabel: 'Seluruh Siswa',
    gradeKey: 'ALL',
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

  // Route-Level Authorization Check
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
          setAllClasses(validClasses);
          const ttdRecords: TTDRecord[] = ttdRes.success ? ttdRes.data : [];

          // Map class ID to grade level and class name
          const classGradeMap = new Map<string, string>();
          const classNameMap = new Map<string, string>();
          const detectedGrades = new Set<string>(['10', '11', '12']); // Guarantee standard SMA grades: 10, 11, 12

          validClasses.forEach(c => {
            const classId = normalizeString(c?.id);
            if (classId) {
              const rawClassName = normalizeString(c.class_name);
              const rawGrade = normalizeString(c.grade);
              let gr = rawGrade;
              if (!gr) {
                if (/XII|12/i.test(rawClassName)) gr = '12';
                else if (/XI|11/i.test(rawClassName)) gr = '11';
                else gr = '10';
              }
              const finalName = formatClassNameToRoman(rawClassName, gr);

              classGradeMap.set(classId, gr);
              classNameMap.set(classId, finalName);
              if (gr === '10' || gr === '11' || gr === '12') {
                detectedGrades.add(gr);
              }
            }
          });

          // Sort available grades dynamically (10 -> X, 11 -> XI, 12 -> XII)
          const sortedGrades = Array.from(detectedGrades).sort((a, b) => Number(a) - Number(b));
          setAvailableGrades(sortedGrades);

          // 1. Compute Overall and Grade-Level Nutrition Aggregates
          const overallCounts = { severelyThinness: 0, thinness: 0, normal: 0, overweight: 0, obese: 0, total: 0 };
          const byGrade: Record<string, typeof overallCounts> = {};

          sortedGrades.forEach(g => {
            byGrade[g] = { severelyThinness: 0, thinness: 0, normal: 0, overweight: 0, obese: 0, total: 0 };
          });

          exams.forEach(exam => {
            if (!exam) return;
            const status = normalizeNutritionStatus(exam.nutrional_status);
            const examClassId = normalizeString(exam.class_id);
            const grade = classGradeMap.get(examClassId) || '10';

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
          const makeAggregate = (label: string, key: string, counts: typeof overallCounts): GradeNutritionAggregate => ({
            gradeLabel: label,
            gradeKey: key,
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

          setOverallAggregate(makeAggregate('Seluruh Siswa', 'ALL', overallCounts));

          const builtGradeAggregates: Record<string, GradeNutritionAggregate> = {};
          sortedGrades.forEach(g => {
            const roman = formatGradeToRoman(g);
            builtGradeAggregates[g] = makeAggregate(`Kelas ${roman}`, g, byGrade[g] || { severelyThinness: 0, thinness: 0, normal: 0, overweight: 0, obese: 0, total: 0 });
          });
          setGradeAggregates(builtGradeAggregates);

          // 2. Compute Pure Non-Personal Aggregated TTD Data per Class
          const ttdByClass: Record<string, { totalLogged: number; consumedCount: number }> = {};
          validClasses.forEach(c => {
            const classId = normalizeString(c.id);
            if (classId) {
              ttdByClass[classId] = { totalLogged: 0, consumedCount: 0 };
            }
          });

          let totalConsumed = 0;
          ttdRecords.forEach(rec => {
            if (!rec) return;
            const isConsumed = normalizeBoolean(rec.consumed, false);
            const recClassId = normalizeString(rec.class_id);
            if (recClassId && ttdByClass[recClassId]) {
              ttdByClass[recClassId].totalLogged++;
              if (isConsumed) {
                ttdByClass[recClassId].consumedCount++;
              }
            }
            if (isConsumed) {
              totalConsumed++;
            }
          });

          const classAggregatesList: ClassTTDAggregate[] = validClasses.map(c => {
            const classId = normalizeString(c.id);
            const data = ttdByClass[classId] || { totalLogged: 0, consumedCount: 0 };
            const gr = normalizeString(c.grade) || (/(\d+)/.exec(normalizeString(c.class_name))?.[1] || '10');
            const name = formatClassNameToRoman(c.class_name, gr);
            return {
              classId,
              className: name,
              grade: gr,
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

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddClassError(null);
    setAddClassSuccess(null);

    const name = newClassName.trim();
    const gr = newGrade.trim();

    if (!name && !gr) {
      setAddClassError('Nama kelas atau tingkat wajib diisi');
      return;
    }

    const finalName = name || `Kelas ${gr}`;

    // Duplicate check on client
    const isDup = allClasses.some(
      c => normalizeString(c.class_name).toLowerCase() === finalName.toLowerCase()
    );
    if (isDup) {
      setAddClassError(`Kelas "${finalName}" sudah terdaftar di database 03_CLASSES.`);
      return;
    }

    setSubmittingClass(true);

    try {
      const res = await createClass({
        class_name: finalName,
        grade: gr,
        academic_year: newAcademicYear,
        school_id: user?.schoolId || 'SCH001',
      });

      if (res.success) {
        setAddClassSuccess(`Kelas "${finalName}" berhasil ditambahkan ke database Google Sheets.`);
        setNewClassName('');
        setTimeout(() => {
          setIsAddClassOpen(false);
          setAddClassSuccess(null);
          setLoading(true);
          setRefreshTrigger(prev => prev + 1);
        }, 1200);
      } else {
        setAddClassError(res.message || 'Gagal menambahkan kelas baru');
      }
    } catch (err) {
      setAddClassError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setSubmittingClass(false);
    }
  };

  // Loading Session Validation
  if (!isReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <LoadingState text="Memeriksa izin otorisasi sesi..." />
      </div>
    );
  }

  // Unauthorized Fallback View (Shown while redirecting or if blocked)
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
            Halaman Grafik Status Gizi dan kepatuhan konsumsi Tablet Tambah Darah (TTD) hanya dapat diakses setelah melakukan autentikasi akun resmi (<strong>Kader SATRIA</strong> atau <strong>Kepala Sekolah</strong>).
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

  // Compute maximum count for responsive Bar Chart scaling
  const maxCategoryCount = Math.max(
    ...CATEGORY_KEYS.map(c => currentDisplay[c.key]),
    5 // Minimum Y-axis ceiling
  );

  const attentionPercentage = Number(
    (Math.round((currentDisplay.percentages.severelyThinness + currentDisplay.percentages.obese) * 10) / 10).toFixed(1)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-10 sm:gap-14">
      {/* 1. HEADER & ACTIONS */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-bold uppercase tracking-wider w-fit">
            <BarChart3 className="w-3.5 h-3.5 text-sky-700" />
            <span>Visualisasi Grafik Batang (Bar Chart)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
            Grafik Status Gizi Remaja SMA
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
            Pemantauan distribusi status gizi siswa berdasarkan <strong>Standar WHO</strong> dan kepatuhan konsumsi Tablet Tambah Darah (TTD) terintegrasi dari basis data sekolah.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLoading(true);
              setRefreshTrigger(prev => prev + 1);
            }}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Perbarui Data
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setAddClassError(null);
              setAddClassSuccess(null);
              setIsAddClassOpen(true);
            }}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Tambah Kelas
          </Button>
        </div>
      </section>

      {/* 2. SECURITY & PRIVACY BADGE */}
      <Alert variant="info" title="Otorisasi Akses Internal Terverifikasi">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="text-xs sm:text-sm text-sky-950">
            Halaman ini terproteksi untuk <strong>Kader SATRIA</strong> dan <strong>Kepala Sekolah</strong>. Data agregat disajikan per tingkat kelas secara dinamis dari basis data <code>03_CLASSES</code> dan <code>05_EXAMINATIONS</code>.
          </span>
        </div>
      </Alert>

      {loading ? (
        <div className="py-12">
          <LoadingState variant="table" rows={6} text="Memuat dan menghitung agregasi grafik status gizi dari database..." />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRefreshTrigger(prev => prev + 1)} />
      ) : (
        <>
          {/* 3. DYNAMIC GRADE LEVEL TABS & TAMBAH KELAS */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pilih Tingkat Kelas:
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Tersedia {availableGrades.length} Tingkat Kelas
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit max-w-full border border-slate-200/80">
              {[
                { id: 'ALL', label: 'Semua Tingkat (Gabungan)' },
                ...availableGrades.map(g => ({ id: g, label: `Kelas ${formatGradeToRoman(g)}` })),
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGrade(tab.id)}
                  className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all shrink-0 ${
                    activeGrade === tab.id
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsAddClassOpen(true)}
                className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl text-sky-700 hover:bg-sky-50 border border-dashed border-sky-300 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Tambah Kelas</span>
              </button>
            </div>
          </div>

          {/* 4. MAIN BAR CHART (GRAFIK BATANG) CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Primary Bar Chart Card */}
            <Card className="lg:col-span-8 p-6 sm:p-8 flex flex-col gap-6 bg-white border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Distribusi Status Gizi: {currentDisplay.gradeLabel}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Grafik Batang Jumlah Siswa per Kategori Standar WHO
                    </p>
                  </div>
                </div>

                <Badge variant={currentDisplay.total > 0 ? 'primary' : 'neutral'} size="md">
                  Total: {currentDisplay.total} Siswa Terperiksa
                </Badge>
              </div>

              {/* Bar Chart Canvas / Render */}
              {currentDisplay.total === 0 ? (
                <div className="py-16 px-4 flex flex-col items-center justify-center text-center gap-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                  <p className="text-sm font-bold text-slate-700">
                    {currentDisplay.gradeLabel} — Belum Ada Data Pemeriksaan
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Belum terdapat catatan hasil pemeriksaan antropometri untuk tingkat kelas ini di basis data <code>05_EXAMINATIONS</code>.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Visual Bar Chart Grid */}
                  <div className="w-full pt-6 pb-2 px-2 sm:px-4 bg-slate-50/70 rounded-2xl border border-slate-100 flex flex-col gap-4">
                    {/* Bars Grid */}
                    <div className="grid grid-cols-5 gap-2 sm:gap-4 items-end min-h-[220px] sm:min-h-[260px] pb-3 border-b border-slate-200">
                      {CATEGORY_KEYS.map(cat => {
                        const count = currentDisplay[cat.key];
                        const pct = currentDisplay.percentages[cat.key];
                        // Calculate bar height percentage relative to ceiling maxCategoryCount
                        const heightPct = maxCategoryCount > 0 ? Math.max((count / maxCategoryCount) * 100, 6) : 6;

                        return (
                          <div key={cat.key} className="flex flex-col items-center gap-2 h-full justify-end group">
                            {/* Value badge atop bar */}
                            <div className="flex flex-col items-center transition-transform group-hover:-translate-y-1">
                              <span className="text-[11px] sm:text-xs font-black text-slate-900">
                                {count}
                              </span>
                              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500">
                                {pct}%
                              </span>
                            </div>

                            {/* The Bar Cylinder */}
                            <div className="w-full max-w-[48px] sm:max-w-[56px] h-full flex items-end">
                              <div
                                style={{
                                  height: count > 0 ? `${heightPct}%` : '4px',
                                  backgroundColor: count > 0 ? cat.style.color : '#cbd5e1',
                                }}
                                className="w-full rounded-t-xl transition-all duration-700 shadow-xs group-hover:brightness-110 relative"
                                title={`${cat.label}: ${count} siswa (${pct}%)`}
                              >
                                {count > 0 && (
                                  <div className="absolute inset-0 bg-white/10 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Category Labels (X-Axis) */}
                    <div className="grid grid-cols-5 gap-2 sm:gap-4 text-center">
                      {CATEGORY_KEYS.map(cat => (
                        <div key={cat.key} className="flex flex-col items-center gap-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.style.color }}
                          />
                          <span className="text-[10px] sm:text-xs font-bold text-slate-800 leading-tight">
                            {cat.shortLabel}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono hidden sm:block">
                            {cat.style.zScoreRange}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Horizontal Breakdown List */}
                  <div className="flex flex-col gap-3 pt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Detail Distribusi Kategori:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CATEGORY_KEYS.map(cat => {
                        const count = currentDisplay[cat.key];
                        const pct = currentDisplay.percentages[cat.key];

                        return (
                          <div
                            key={cat.key}
                            className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-3 h-3 rounded-md shrink-0"
                                style={{ backgroundColor: cat.style.color }}
                              />
                              <div>
                                <p className="font-bold text-slate-900">{cat.label}</p>
                                <p className="text-[10px] text-slate-400">{cat.style.zScoreRange}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-900">{count} siswa</p>
                              <p className="text-[10px] font-semibold text-slate-500">{pct}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Side Overview & Population Insights */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <Card className="p-6 bg-gradient-to-b from-sky-50/80 to-white border-sky-100 flex flex-col gap-4 shadow-xs">
                <div className="flex items-center gap-2 border-b border-sky-100 pb-3">
                  <Users className="w-5 h-5 text-sky-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Ringkasan Populasi ({currentDisplay.gradeLabel})
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white rounded-2xl border border-sky-100 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-500 block">Status Normal</span>
                    <span className="text-2xl font-black text-emerald-600 mt-0.5 block">
                      {currentDisplay.percentages.normal}%
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {currentDisplay.normal} dari {currentDisplay.total} siswa
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-sky-100 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-500 block">Perlu Perhatian</span>
                    <span className="text-2xl font-black text-rose-600 mt-0.5 block">
                      {attentionPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {currentDisplay.severelyThinness + currentDisplay.obese} siswa (Gizi Sangat Kurang/Obesitas)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-sky-100/80">
                  Siswa dalam kategori <strong>Gizi Sangat Kurang</strong> atau <strong>Obesitas</strong> menjadi prioritas pendampingan gizi oleh Kader SATRIA dan koordinasi bersama UKS/Puskesmas.
                </p>
              </Card>

              {/* Standar WHO Info Card */}
              <Card className="p-6 flex flex-col gap-3 bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
                  <Info className="w-4 h-4 text-sky-600 shrink-0" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Standar WHO Remaja
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Klasifikasi status gizi remaja (5–19 tahun) dihitung menggunakan Standar WHO dengan satuan Standar Deviasi (SD / Z-Score) berdasarkan usia detail dan jenis kelamin.
                </p>
                <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Gizi Normal:</span>
                    <span className="font-semibold text-emerald-700">-2 SD s.d. +1 SD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gizi Kurang:</span>
                    <span className="font-semibold text-sky-700">-3 SD s.d. &lt; -2 SD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gizi Sangat Kurang:</span>
                    <span className="font-semibold text-purple-700">&lt; -3 SD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gizi Lebih:</span>
                    <span className="font-semibold text-amber-700">&gt; +1 SD s.d. +2 SD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Obesitas:</span>
                    <span className="font-semibold text-rose-700">&gt; +2 SD</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* 5. DATA TABLE AGREGAT PER TINGKAT KELAS (STANDAR WHO) */}
          <section className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Tabel Perbandingan Status Gizi Antar Tingkat Kelas (Standar WHO)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Agregasi lengkap perbandingan tingkat Kelas X, XI, dan XII
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Tingkat Kelas</th>
                    <th className="py-3.5 px-4 text-center">Total Siswa</th>
                    <th className="py-3.5 px-4 text-center text-purple-700">Sangat Kurang</th>
                    <th className="py-3.5 px-4 text-center text-sky-700">Kurus</th>
                    <th className="py-3.5 px-4 text-center text-emerald-700">Normal</th>
                    <th className="py-3.5 px-4 text-center text-amber-700">Gizi Lebih</th>
                    <th className="py-3.5 px-4 text-center text-rose-700">Obesitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {availableGrades.map(grade => {
                    const data = gradeAggregates[grade] || {
                      total: 0,
                      severelyThinness: 0,
                      thinness: 0,
                      normal: 0,
                      overweight: 0,
                      obese: 0,
                    };

                    return (
                      <tr key={grade} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          Kelas {grade}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold">
                          {data.total > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                              {data.total} siswa
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">0 terdata</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {data.severelyThinness > 0 ? (
                            <span className="text-purple-700 font-bold">{data.severelyThinness}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {data.thinness > 0 ? (
                            <span className="text-sky-700 font-bold">{data.thinness}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {data.normal > 0 ? (
                            <span className="text-emerald-700 font-bold">{data.normal}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {data.overweight > 0 ? (
                            <span className="text-amber-700 font-bold">{data.overweight}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {data.obese > 0 ? (
                            <span className="text-rose-700 font-bold">{data.obese}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100/90 font-black border-t-2 border-slate-200 text-slate-900 text-xs sm:text-sm">
                  <tr>
                    <td className="py-3.5 px-4 uppercase">Total Seluruh Siswa</td>
                    <td className="py-3.5 px-4 text-center text-sky-800">
                      {overallAggregate.total} siswa
                    </td>
                    <td className="py-3.5 px-4 text-center text-purple-800">{overallAggregate.severelyThinness}</td>
                    <td className="py-3.5 px-4 text-center text-sky-800">{overallAggregate.thinness}</td>
                    <td className="py-3.5 px-4 text-center text-emerald-800">{overallAggregate.normal}</td>
                    <td className="py-3.5 px-4 text-center text-amber-800">{overallAggregate.overweight}</td>
                    <td className="py-3.5 px-4 text-center text-rose-800">{overallAggregate.obese}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* 6. KEPATUHAN TABLET TAMBAH DARAH (TTD) SECTION */}
          <section className="flex flex-col gap-6 mt-4 pt-8 border-t border-slate-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">
                    Kepatuhan Konsumsi Tablet Tambah Darah (TTD)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Data agregat kepatuhan minum TTD mingguan bagi remaja putri per rombongan belajar.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Total {totalTTDConsumed} Konsumsi Tercatat</span>
              </div>
            </div>

            {/* TTD Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 border-slate-200 bg-white flex items-center gap-4 shadow-2xs">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Diminum</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{totalTTDConsumed} Konsumsi</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Catatan kepatuhan TTD</p>
                </div>
              </Card>

              <Card className="p-5 border-slate-200 bg-white flex items-center gap-4 shadow-2xs">
                <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Kelas</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{totalClassesCount} Kelas</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Terdaftar di database</p>
                </div>
              </Card>

              <Card className="p-5 border-slate-200 bg-white flex items-center gap-4 shadow-2xs">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Pemantauan</p>
                  <p className="text-2xl font-black text-emerald-700 mt-0.5">Aktif</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Dipantau berkala</p>
                </div>
              </Card>
            </div>

            {/* Class-level Aggregate TTD Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700 border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4">Tingkat</th>
                    <th className="py-3.5 px-4 text-center">Jumlah Siswa Sudah Minum TTD</th>
                    <th className="py-3.5 px-4 text-center">Status Kepatuhan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {classTTDAggregates.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        Belum ada data kelas atau pencatatan TTD di basis data.
                      </td>
                    </tr>
                  ) : (
                    classTTDAggregates.map(cls => (
                      <tr key={cls.classId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {cls.className}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          Kelas {cls.grade}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                          {cls.consumedCount > 0 ? (
                            <span className="text-rose-700 font-extrabold">
                              {cls.consumedCount} siswa sudah minum
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">0 siswa</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {cls.consumedCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Terdata ({cls.consumedCount} dosis)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
                              Belum ada entri
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100/90 font-black border-t-2 border-slate-200 text-slate-900 text-xs sm:text-sm">
                  <tr>
                    <td colSpan={2} className="py-3.5 px-4 uppercase">
                      Total Konsumsi TTD Seluruh Kelas
                    </td>
                    <td className="py-3.5 px-4 text-center text-rose-800">
                      {totalTTDConsumed} siswa sudah minum
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-700">
                      {totalClassesCount} Kelas Terdata
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}

      {/* 7. MODAL TAMBAH KELAS (INTEGRATED TO 03_CLASSES) */}
      {isAddClassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tambah Kelas Baru</h3>
                  <p className="text-xs text-slate-500">Database Master 03_CLASSES</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClassOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addClassError && (
              <Alert variant="error" title="Gagal Menyimpan">
                <span className="text-xs text-rose-950">{addClassError}</span>
              </Alert>
            )}

            {addClassSuccess && (
              <Alert variant="success" title="Berhasil">
                <span className="text-xs text-emerald-950">{addClassSuccess}</span>
              </Alert>
            )}

            <form onSubmit={handleAddClass} className="flex flex-col gap-4">
              <Input
                label="Nama Kelas"
                placeholder="Contoh: Kelas X, X-A, Kelas XI IPA 1"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                helperText="Nama rombel atau tingkat kelas."
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Tingkat / Grade</label>
                <select
                  value={newGrade}
                  onChange={e => setNewGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="10">Kelas X</option>
                  <option value="11">Kelas XI</option>
                  <option value="12">Kelas XII</option>
                </select>
              </div>

              <Input
                label="Tahun Ajaran"
                placeholder="2025/2026"
                value={newAcademicYear}
                onChange={e => setNewAcademicYear(e.target.value)}
                helperText="Periode tahun ajaran kelas."
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddClassOpen(false)}
                  disabled={submittingClass}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submittingClass}
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                >
                  Simpan ke Database
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
