'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Badge,
  Button,
  LoadingState,
  ErrorState,
  Alert,
} from '@/components/ui';
import { fetchExaminations, fetchClasses } from '@/lib/api';
import { filterValidClasses } from '@/lib/adapters';
import { normalizeNutritionStatus, NUTRITION_STYLES } from '@/lib/utils/nutrition';
import { calculatePercentage } from '@/lib/utils/number';
import {
  BarChart3,
  ShieldCheck,
  RefreshCw,
  Info,
  Layers,
  PieChart,
  Users,
} from 'lucide-react';
import { Examination, ClassRoom } from '@/types/models';

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

export default function PublicGrafikPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGrade, setActiveGrade] = useState<string>('ALL');

  // Aggregated Data State (Strictly Non-Personal)
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function loadAndAggregate() {
      try {
        const [examsRes, classesRes] = await Promise.all([
          fetchExaminations(),
          fetchClasses(),
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

          // Map class ID to grade level ("10", "11", "12")
          const classGradeMap = new Map<string, string>();
          validClasses.forEach(c => {
            if (c.id) {
              classGradeMap.set(c.id, String(c.grade || '10'));
            }
          });

          // Compute Overall and Grade-Level Aggregates
          const overallCounts = { severelyThinness: 0, thinness: 0, normal: 0, overweight: 0, obese: 0, total: 0 };
          const byGrade: Record<string, typeof overallCounts> = {
            '10': { severelyThinness: 0, thinness: 0, normal: 0, overweight: 0, obese: 0, total: 0 },
            '11': { severelyThinness: 0, thinness: 0, normal: 0, overweight: 0, obese: 0, total: 0 },
            '12': { severelyThinness: 0, thinness: 0, normal: 0, overweight: 0, obese: 0, total: 0 },
          };

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

          // Build immutable aggregate records
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
          setGradeAggregates({
            '10': makeAggregate('Kelas 10', byGrade['10'] || overallCounts),
            '11': makeAggregate('Kelas 11', byGrade['11'] || overallCounts),
            '12': makeAggregate('Kelas 12', byGrade['12'] || overallCounts),
          });

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
  }, [refreshTrigger]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-10">
      {/* 1. HEADER & PRIVACY NOTICE */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider w-fit">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Statistik Publik Teragregasi</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
            Grafik Distribusi Status Gizi Remaja SMA
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
            Visualisasi distribusi status gizi siswa berdasarkan standar antropometri <strong>WHO Anthro Plus (IMT/U)</strong>. Data disajikan secara agregat untuk menjaga privasi medis siswa.
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
            Halaman publik ini hanya menerima ringkasan agregasi sekolah dan tingkat kelas. Tidak ada nama, nomor induk, atau riwayat pemeriksaan perorangan yang dipublikasikan.
          </span>
        </div>
      </Alert>

      {loading ? (
        <LoadingState variant="table" rows={5} text="Menghitung agregasi statistik status gizi..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setRefreshTrigger(prev => prev + 1)} />
      ) : (
        <>
          {/* 3. GRADE LEVEL TABS */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit">
            {[
              { id: 'ALL', label: 'Seluruh Siswa' },
              { id: '10', label: 'Kelas 10' },
              { id: '11', label: 'Kelas 11' },
              { id: '12', label: 'Kelas 12' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveGrade(tab.id)}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
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
                  Rincian Kategori WHO Anthro Plus
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
                      {currentDisplay.percentages.severelyThinness + currentDisplay.percentages.obese}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Siswa dengan kategori <strong>Gizi Sangat Kurang</strong> atau <strong>Obesitas</strong> mendapatkan tindak lanjut pendampingan gizi oleh kader SATRIA dan rujukan ke Puskesmas/UKS.
                </p>
              </Card>

              {/* WHO Standard Info Card */}
              <Card className="p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <Info className="w-4 h-4 text-sky-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Standar WHO Anthro Plus Remaja
                  </h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Klasifikasi status gizi usia 5-19 tahun menggunakan indeks <strong>IMT/U (BMI-for-age)</strong> dengan satuan Standar Deviasi (SD / Z-score) yang disesuaikan dengan jenis kelamin dan usia detail per bulan.
                </p>
              </Card>
            </div>
          </div>

          {/* 5. DATA TABLE AGREGAT PER TINGKAT KELAS */}
          <section className="flex flex-col gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Tabel Perbandingan Status Gizi Antar Tingkat Kelas
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
                  {['10', '11', '12'].map(gr => {
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
        </>
      )}
    </div>
  );
}
