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
            {/* Program Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-200 text-xs sm:text-sm font-semibold shadow-xs">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Program Pengabdian Masyarakat BIMA Kemendikbudristek & FIK UM</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display leading-[1.15]">
              Pemantauan Kesehatan & Gizi Remaja SMA Terpadu
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-sans">
              Platform digital kolaboratif bagi guru <strong>SATRIA</strong> dan <strong>UKS</strong> dalam pencatatan status gizi antropometri standar WHO Anthro Plus, deteksi dini anemia remaja, dan pemantauan kepatuhan Tablet Tambah Darah (TTD).
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
                  Informasi Anemia & CAGAR
                </Button>
              </Link>

              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-sm sm:text-base font-bold bg-slate-800/80 hover:bg-slate-800 text-sky-300 border-sky-500/40"
                  leftIcon={<Users className="w-4 h-4" />}
                >
                  Login Guru SATRIA
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
                  Penyuluhan interaktif mengenai gejala 5L (Lesu, Letih, Lemah, Lelah, Lalai), pemilihan pangan kaya zat besi, dan penggunaan media fisik <strong>CAGAR (Cakram Gizi Anemia Remaja)</strong>.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href="/edukasi"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700"
                >
                  <span>Pelajari Materi Anemia</span>
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
                  Pengukuran antropometri (TB, BB, IMT/U WHO Anthro Plus), pengukuran Lingkar Lengan Atas (LiLA), serta skrining hemoglobin (Hb) dan tekanan darah berkala.
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
                  Pilar 3 • Lingkungan Sehat
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Kepatuhan Tablet Tambah Darah
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Gerakan Aksi Bergizi mingguan melalui minum TTD bersama bagi remaja putri, dipantau secara digital dan dicatat dalam kartu rekam fisik <strong>JAKRA</strong>.
                </p>
              </div>
              <div className="mt-auto pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"
                >
                  <span>Pencatatan Guru TTD</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. PERAN GURU SATRIA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white border border-slate-800 flex flex-col lg:flex-row items-center gap-8 justify-between">
          <div className="flex flex-col gap-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold uppercase tracking-wider w-fit">
              <Award className="w-4 h-4" />
              <span>Peer Educator • SATRIA</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight font-display text-white">
              Siapakah Guru SATRIA?
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong>SATRIA (Siswa Terlatih Sadar Anemia & Gizi)</strong> adalah agen perubahan kesehatan remaja dari anggota Palang Merah Remaja (PMR) dan Pengurus UKS sekolah yang telah terlatih untuk:
            </p>

            <ul className="text-xs sm:text-sm text-slate-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Melakukan pengukuran antropometri dan LiLA secara akurat.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Mendampingi skrining hemoglobin (Hb) bersama tenaga kesehatan.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Memandu konsumsi Tablet Tambah Darah (TTD) mingguan di kelas.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Mengoperasikan aplikasi web SANTARA dan kartu JAKRA fisik.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 w-full lg:w-80 bg-white/5 p-6 rounded-2xl border border-white/10 shrink-0">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
              <span>Akses Kerja Guru</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Guru SATRIA dapat mengakses modul pencatatan klinis, kartu JAKRA siswa, dan entri skrining melalui dashboard terproteksi.
            </p>
            <Link href="/login" className="w-full mt-2">
              <Button variant="primary" className="w-full font-bold text-sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Masuk Sesi Guru
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
              Ekosistem Pendamping
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
              Media Inovasi Intervensi UKS
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Kombinasi terstruktur antara media fisik dan aplikasi digital untuk memaksimalkan kepatuhan serta retensi edukasi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-b from-sky-50/50 to-white border-sky-100">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black text-sm mb-3">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                CAGAR (Cakram Gizi Anemia Remaja)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Media cakram putar fisik interaktif untuk mengenalkan klasifikasi IMT/U, kebutuhan asupan zat besi harian, dan porsi gizi seimbang.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-b from-cyan-50/50 to-white border-cyan-100">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-black text-sm mb-3">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                JAKRA (Jejak Kesehatan Remaja)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kartu rekam kesehatan fisik berukuran F4 yang disimpan setiap siswa sebagai rekam jejak pertumbuhan dan kepatuhan konsumsi TTD.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-b from-emerald-50/50 to-white border-emerald-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm mb-3">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Buku Panduan Terpadu UKS
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pedoman operasional standar pengukuran antropometri, kalibrasi alat ukur, dan manajemen program gizi sekolah bagi pembina UKS.
              </p>
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
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {partnerLogos.map(logo => (
              <div
                key={logo.name}
                className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs hover:scale-105 transition-transform"
              >
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    fill
                    className="object-contain"
                    sizes="32px"
                  />
                </div>
                <span className="text-xs font-bold text-slate-800">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
