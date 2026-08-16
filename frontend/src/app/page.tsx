'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Button,
  Card,
  Badge,
} from '@/components/ui';
import {
  fetchSchools,
  fetchClasses,
  fetchExaminations,
  fetchTTD,
} from '@/lib/api';
import { filterValidClasses } from '@/lib/adapters';
import { calculateNutritionDistribution, calculateTTDCompliance } from '@/lib/utils/analytics';
import {
  Activity,
  BookOpen,
  Users,
  Pill,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  BarChart3,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const [stats, setStats] = useState<{
    schoolsCount: number;
    classesCount: number;
    examsCount: number;
    ttdCompliance: number;
    normalRate: number;
  }>({
    schoolsCount: 1,
    classesCount: 1,
    examsCount: 0,
    ttdCompliance: 0,
    normalRate: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadAggregateStats() {
      try {
        const [schoolsRes, classesRes, examsRes, ttdRes] = await Promise.all([
          fetchSchools(),
          fetchClasses(),
          fetchExaminations(),
          fetchTTD(),
        ]);

        if (!ignore) {
          const schoolsCount = schoolsRes.success ? schoolsRes.data.length : 1;
          const validClasses = classesRes.success ? filterValidClasses(classesRes.data) : [];
          const exams = examsRes.success ? examsRes.data : [];
          const ttdRecords = ttdRes.success ? ttdRes.data : [];

          const dist = calculateNutritionDistribution(exams);
          const ttdComp = calculateTTDCompliance(ttdRecords);

          const normalPercent =
            dist.total > 0 ? Math.round((dist.normal / dist.total) * 100) : 0;

          setStats({
            schoolsCount,
            classesCount: validClasses.length,
            examsCount: exams.length,
            ttdCompliance: ttdComp.percentage,
            normalRate: normalPercent,
          });
          setLoadingStats(false);
        }
      } catch {
        if (!ignore) setLoadingStats(false);
      }
    }

    loadAggregateStats();
    return () => {
      ignore = true;
    };
  }, []);

  const partnerLogos = [
    { name: 'BIMA Kemendikbudristek', src: '/Logo/LogoBima.jpeg' },
    { name: 'FIK Universitas Negeri Malang', src: '/Logo/LogoFIK.jpeg' },
    { name: 'SDGs 2: Zero Hunger', src: '/Logo/LogoSdgs2.jpeg' },
    { name: 'SDGs 4: Quality Education', src: '/Logo/LogoSdgs4.jpeg' },
    { name: 'SMAN 1 Kota Batu', src: '/Logo/LogoSMABATU.jpeg' },
    { name: 'Universitas Negeri Malang', src: '/Logo/LogoUM.jpeg' },
  ];

  return (
    <div className="flex flex-col gap-16 sm:gap-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-950 via-slate-900 to-slate-900 text-white pt-12 sm:pt-20 pb-20 sm:pb-28">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
            {/* Platform Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-200 text-xs sm:text-sm font-semibold shadow-xs">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Sistem Pemantauan Kesehatan Remaja SMA</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display leading-[1.15]">
              SANTARA
            </h1>
            <p className="text-lg sm:text-2xl font-bold text-sky-300 -mt-2 font-display">
              Sistem Pemantauan Kesehatan Remaja SMA
            </p>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-sans">
              Platform pemantauan kesehatan remaja yang membantu <strong>kader SATRIA</strong> mencatat, memantau, dan mengelola data status gizi, skrining kesehatan, serta konsumsi Tablet Tambah Darah siswa secara terintegrasi.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-2 w-full sm:w-auto">
              <Link href="/grafik" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto text-sm sm:text-base font-bold shadow-lg shadow-sky-500/25"
                  rightIcon={<BarChart3 className="w-4 h-4" />}
                >
                  Lihat Grafik Status Gizi
                </Button>
              </Link>

              <Link href="/edukasi" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto text-sm sm:text-base font-bold bg-white/10 hover:bg-white/20 text-white border-white/20"
                  leftIcon={<BookOpen className="w-4 h-4" />}
                >
                  Edukasi Anemia & CAGAR
                </Button>
              </Link>

              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-sm sm:text-base font-bold bg-slate-800/80 hover:bg-slate-800 text-sky-300 border-sky-500/40"
                  leftIcon={<Users className="w-4 h-4" />}
                >
                  Login Kader
                </Button>
              </Link>
            </div>

            {/* Quick Micro Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full mt-8 pt-8 border-t border-slate-800/80">
              <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xl sm:text-2xl font-black text-sky-400">
                  {loadingStats ? '...' : stats.schoolsCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 uppercase font-semibold">
                  Sekolah Mitra
                </span>
              </div>

              <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xl sm:text-2xl font-black text-cyan-400">
                  {loadingStats ? '...' : stats.classesCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 uppercase font-semibold">
                  Kelas Terdata
                </span>
              </div>

              <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xl sm:text-2xl font-black text-emerald-400">
                  {loadingStats ? '...' : `${stats.examsCount}+`}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 uppercase font-semibold">
                  Pemeriksaan Gizi
                </span>
              </div>

              <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xl sm:text-2xl font-black text-amber-400">
                  {loadingStats ? '...' : `${stats.ttdCompliance}%`}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 uppercase font-semibold">
                  Kepatuhan TTD
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROGRAM OVERVIEW & TRIAS UKS MODERN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <Badge variant="primary" className="mx-auto">
              Fondasi Program
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
              Tiga Pilar Intervensi Kesehatan Terpadu (TRIAS UKS)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Mengintegrasikan Trias UKS dengan inovasi teknologi digital untuk menciptakan ekosistem sekolah sehat, sadar gizi, dan bebas anemia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <Card className="p-6 flex flex-col gap-4 border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  Pilar 1 • Pendidikan Kesehatan
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Edukasi Gizi & Cakram CAGAR
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Penyuluhan interaktif mengenai pencegahan anemia, klasifikasi anemia menurut jenis kelamin, gejala 5L, dan pemanfaatan media edukasi <strong>CAGAR (Cakram Gizi Anemia Remaja)</strong>.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href="/edukasi"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700"
                >
                  <span>Pelajari Media CAGAR</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>

            {/* Pillar 2 */}
            <Card className="p-6 flex flex-col gap-4 border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Pilar 2 • Pelayanan Kesehatan
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Antropometri & Skrining Klinis
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Pengukuran antropometri (TB, BB, IMT/U WHO Anthro Plus), pengukuran Lingkar Lengan Atas (LiLA), serta skrining hemoglobin (Hb) dan tekanan darah berkala oleh kader SATRIA.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href="/grafik"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                >
                  <span>Lihat Grafik Distribusi</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>

            {/* Pillar 3 */}
            <Card className="p-6 flex flex-col gap-4 border-slate-200/80 hover:border-rose-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                <Pill className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  Pilar 3 • Pembinaan Lingkungan Sehat
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Kepatuhan Tablet Tambah Darah
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Gerakan Aksi Bergizi mingguan melalui konsumsi TTD bersama bagi remaja putri, dipantau secara digital dan dicatat dalam kartu rekam fisik <strong>JAKRA</strong>.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"
                >
                  <span>Pencatatan Kader TTD</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. PERAN KADER SATRIA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white border border-slate-800 flex flex-col lg:flex-row items-center gap-8 justify-between">
          <div className="flex flex-col gap-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold uppercase tracking-wider w-fit">
              <Award className="w-4 h-4" />
              <span>Pengelola Utama • SATRIA</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight font-display text-white">
              Siapakah Kader SATRIA?
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong>SATRIA (Satuan Remaja Peduli Kesehatan)</strong> merupakan kader yang melakukan pengelolaan dan pemantauan kesehatan siswa di sekolah yang telah terlatih untuk:
            </p>

            <ul className="text-xs sm:text-sm text-slate-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Melakukan pengukuran status gizi antropometri (TB, BB, IMT/U) dan LiLA secara akurat.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Mendampingi skrining hemoglobin (Hb) dan tekanan darah berkala bersama tenaga kesehatan.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Memandu konsumsi Tablet Tambah Darah (TTD) mingguan bagi remaja putri.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Mengoperasikan platform SANTARA serta pencatatan kartu rekam fisik JAKRA.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-80 bg-white/5 p-6 rounded-2xl border border-white/10 shrink-0">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <span>Akses Kerja Kader</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Kader SATRIA mengelola pencatatan status gizi, skrining kesehatan, kartu JAKRA, dan pemantauan TTD melalui akun terproteksi.
            </p>
            <Link href="/login" className="w-full mt-2">
              <Button variant="primary" className="w-full font-bold text-sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Masuk Sesi Kader
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. MEDIA INOVASI PENDAMPING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <Badge variant="secondary" className="mx-auto">
              Media Inovasi Program
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
              Media Inovasi Intervensi UKS
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Integrasi teknologi digital SANTARA dan media edukasi fisik terstruktur untuk pencegahan anemia dan pemantauan gizi berkelanjutan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CAGAR */}
            <Card className="p-6 bg-gradient-to-b from-sky-50/50 to-white border-sky-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-sm mb-3">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  CAGAR — Cakram Gizi Anemia Remaja
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Media edukasi komprehensif pencegahan anemia berbahan Artpaper 310 gsm (diameter 12,5 & 11,5 cm) yang memuat klasifikasi anemia per jenis kelamin, penyebab anemia, dan sumber pangan kaya zat besi.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-sky-100">
                <Link href="/edukasi" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                  <span>Pelajari Media CAGAR</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>

            {/* JAKRA */}
            <Card className="p-6 bg-gradient-to-b from-cyan-50/50 to-white border-cyan-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-black text-sm mb-3">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  JAKRA — Jejak Kesehatan Remaja
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kartu pemantauan kesehatan fisik lipat F4 (21×33 cm) berbahan BW 250 gsm berisi identitas siswa, 12 kolom hasil pemeriksaan berkala, grafik pertumbuhan, dan himbauan hidup sehat.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-cyan-100">
                <Link href="/login" className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                  <span>Lihat Format JAKRA</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>

            {/* Buku Panduan */}
            <Card className="p-6 bg-gradient-to-b from-emerald-50/50 to-white border-emerald-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm mb-3">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Buku Panduan Terpadu UKS
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buku panduan format A5 berbahan Artpaper 210 gsm berjudul <em>&quot;Pengukuran Status Gizi dan Skrining Kesehatan Remaja di Sekolah Menengah Atas&quot;</em>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-100">
                <a
                  href="/docs/PANDUAN_PENGGUNAAN_SANTARA.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>Lihat Panduan PDF</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </Card>

            {/* Platform Website SANTARA */}
            <Card className="p-6 bg-gradient-to-b from-indigo-50/50 to-white border-indigo-100 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm mb-3">
                  4
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Platform Website SANTARA
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Database kesehatan digital terintegrasi untuk pencatatan status gizi (WHO Anthro Plus), skrining klinis, pemantauan TTD real-time per kelas, dan portal edukasi.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-100">
                <Link href="/login" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  <span>Akses Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. MITRA & EKOSISTEM PENDUKUNG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-100/80 border border-slate-200 flex flex-col items-center text-center gap-6">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Didukung Oleh Lembaga & Institusi Mitra
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {partnerLogos.map(logo => (
              <div
                key={logo.name}
                title={logo.name}
                className="flex items-center justify-center bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-sm hover:scale-105 transition-all w-20 h-14 sm:w-24 sm:h-16 shrink-0 group"
              >
                <div className="relative w-full h-full">
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    fill
                    className="object-contain"
                    sizes="96px"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
