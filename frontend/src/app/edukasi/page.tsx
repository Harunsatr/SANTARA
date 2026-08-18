'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Badge,
  Button,
  LoadingState,
  Input,
} from '@/components/ui';
import { fetchEducations } from '@/lib/api';
import { EducationArticle } from '@/types/models';
import { formatDateIndonesian } from '@/lib/utils/date';
import {
  BookOpen,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Flame,
  HelpCircle,
  RotateCcw,
  Search,
  Layers,
} from 'lucide-react';

export default function PublicEducationPage() {
  // Articles from API
  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articleCategory, setArticleCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Education State
  const [gender, setGender] = useState<'L' | 'P'>('P');
  const [selectedIronSource, setSelectedIronSource] = useState<string>('hati');
  const [selectedDrink, setSelectedDrink] = useState<string>('jeruk');

  useEffect(() => {
    let ignore = false;
    async function loadArticles() {
      try {
        const res = await fetchEducations({ status: 'PUBLISHED' });
        if (!ignore) {
          if (res.success && Array.isArray(res.data)) {
            setArticles(res.data);
          }
          setLoadingArticles(false);
        }
      } catch {
        if (!ignore) setLoadingArticles(false);
      }
    }
    loadArticles();
    return () => {
      ignore = true;
    };
  }, []);

  // Dynamically extract unique categories from loaded articles
  const availableCategories = ['ALL', ...Array.from(new Set(articles.map(a => a.category?.trim() || 'Umum')))];

  // Filtered Articles
  const filteredArticles = articles.filter(a => {
    if (articleCategory !== 'ALL' && (a.category?.trim().toUpperCase() !== articleCategory.toUpperCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (a.title || '').toLowerCase().includes(q);
      const matchContent = (a.content || '').toLowerCase().includes(q);
      const matchExcerpt = (a.excerpt || '').toLowerCase().includes(q);
      const matchCategory = (a.category || '').toLowerCase().includes(q);
      return matchTitle || matchContent || matchExcerpt || matchCategory;
    }
    return true;
  });

  const ironFoodDatabase: Record<
    string,
    { name: string; type: 'Heme' | 'Non-Heme'; ironMg: number; desc: string }
  > = {
    hati: { name: 'Hati Ayam / Sapi (100g)', type: 'Heme', ironMg: 9.0, desc: 'Penyerapan sangat tinggi (25-30%)' },
    daging: { name: 'Daging Sapi / Kambing (100g)', type: 'Heme', ironMg: 3.5, desc: 'Zat besi heme mudah diserap tubuh' },
    ikan: { name: 'Ikan Kembung / Tongkol (100g)', type: 'Heme', ironMg: 2.0, desc: 'Kaya protein dan zat besi heme' },
    bayam: { name: 'Bayam / Sayur Hijau (1 mangkuk)', type: 'Non-Heme', ironMg: 3.2, desc: 'Zat besi nabati, butuh Vitamin C' },
    kelor: { name: 'Daun Kelor Masak (1 mangkuk)', type: 'Non-Heme', ironMg: 5.4, desc: 'Superfood kaya zat besi dan antioksidan' },
    tempe: { name: 'Tempe / Tahu (2 potong sedang)', type: 'Non-Heme', ironMg: 2.5, desc: 'Protein nabati dan zat besi harian' },
    kacang: { name: 'Kacang Merah / Hijau (1 mangkuk)', type: 'Non-Heme', ironMg: 3.0, desc: 'Kaya serat dan mikronutrien' },
  };

  const drinkDatabase: Record<
    string,
    { name: string; effect: 'Enhancer' | 'Inhibitor' | 'Neutral'; detail: string }
  > = {
    jeruk: { name: 'Jus Jeruk / Jambu Biji (Kaya Vit C)', effect: 'Enhancer', detail: 'Meningkatkan penyerapan zat besi hingga 3-4x lipat!' },
    air: { name: 'Air Putih Mineral', effect: 'Neutral', detail: 'Netral dan sangat dianjurkan saat minum TTD' },
    teh: { name: 'Teh Manis / Es Teh (Mengandung Tanin)', effect: 'Inhibitor', detail: 'Tanin mengikat zat besi sehingga penyerapan turun drastis (hingga 80%)' },
    kopi: { name: 'Kopi / Minuman Berkafein', effect: 'Inhibitor', detail: 'Polifenol dalam kopi menghambat penyerapan zat besi di usus' },
    susu: { name: 'Susu Sapi (Kaya Kalsium)', effect: 'Inhibitor', detail: 'Kalsium berkompetisi dengan zat besi dalam proses absorpsi' },
  };

  const currentFood = ironFoodDatabase[selectedIronSource] || ironFoodDatabase.hati;
  const currentDrink = drinkDatabase[selectedDrink] || drinkDatabase.jeruk;
  const dailyTargetMg = gender === 'P' ? 15 : 11;

  const gejalaSehat = [
    { title: 'Kebugaran Fisik', desc: 'Menjaga stamina tubuh tetap prima dan berenergi saat beraktivitas di sekolah.' },
    { title: 'Konsentrasi Belajar', desc: 'Asupan nutrisi cukup menjaga fokus berpikir, daya ingat, dan daya tangkap pelajaran.' },
    { title: 'Pola Tidur Sehat', desc: 'Istirahat cukup 7–8 jam sehari untuk pemulihan sel tubuh dan regenerasi stamina.' },
    { title: 'Hidrasi & Nutrisi', desc: 'Minum air putih cukup dan konsumsi gizi seimbang untuk imunitas optimal.' },
    { title: 'Aktivitas Positif', desc: 'Rutin berolahraga ringan minimal 30 menit setiap hari untuk menjaga mood dan fisik.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-12 sm:gap-16">
      {/* 1. HEADER SECTION */}
      <section className="flex flex-col items-center text-center gap-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-100 text-sky-800 rounded-full text-xs font-bold uppercase tracking-wider shadow-2xs">
          <BookOpen className="w-4 h-4 text-sky-700" />
          <span>Pusat Edukasi &amp; Informasi Remaja SMA</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
          Media Edukasi
        </h1>
        <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-sans max-w-2xl">
          Pusat informasi, wawasan kesehatan, dan materi edukasi pilihan untuk mendukung pengetahuan, pola hidup sehat, serta tumbuh kembang positif remaja di lingkungan sekolah.
        </p>
      </section>

      {/* 2. WAWASAN KESEHATAN & KEBUGARAN REMAJA */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <Badge variant="primary" className="w-fit mx-auto sm:mx-0">
            Wawasan Kesehatan Remaja
          </Badge>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Panduan Pola Hidup Sehat &amp; Kebugaran Siswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Keseimbangan antara gizi seimbang, aktivitas fisik teratur, serta hidrasi cukup merupakan kunci utama dalam mengoptimalkan prestasi belajar dan daya tahan tubuh.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {gejalaSehat.map((item, idx) => (
            <Card
              key={item.title}
              className="p-5 flex flex-col gap-2 border-sky-100 bg-gradient-to-b from-sky-50/40 to-white hover:border-sky-300 transition-all shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                {idx + 1}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. MEDIA EDUKASI INTERAKTIF & SIMULASI NUTRISI */}
      <section className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-sky-900 via-sky-950 to-slate-900 text-white border border-sky-800 shadow-xl flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-sky-800/80 pb-6">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Media Edukasi Interaktif</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
              Media Edukasi &amp; Simulasi Nutrisi Seimbang
            </h2>
            <p className="text-xs sm:text-sm text-sky-200/80 max-w-2xl">
              Media edukasi interaktif yang menyajikan panduan kebutuhan nutrisi, sumber zat gizi harian, kombinasi makanan bergizi, serta tips menjaga kebugaran tubuh bagi siswa.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setGender('P');
              setSelectedIronSource('hati');
              setSelectedDrink('jeruk');
            }}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs shrink-0"
          >
            Reset Simulasi
          </Button>
        </div>

        {/* Physical Specifications / Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
              Bagian 1 • Kebutuhan Gizi Remaja
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mengetahui kebutuhan mikronutrien dan zat besi harian bagi remaja putri dan putra sesuai anjuran kesehatan.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              Bagian 2 • Kombinasi Pangan Sehat
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Panduan memilih kombinasi makanan peningkat penyerapan nutrisi (seperti buah kaya Vitamin C) dan menghindari faktor penghambat.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              Bagian 3 • Media Edukasi UKS
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Media edukasi interaktif yang dapat digunakan untuk kegiatan bimbingan kesehatan, penyuluhan UKS, dan aksi sehat di sekolah.
            </p>
          </div>
        </div>

        {/* Interactive Absorption Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
          {/* Controls Panel */}
          <div className="lg:col-span-5 flex flex-col gap-5 bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>1. Pengaturan Gender &amp; Target Harian</span>
            </h3>

            {/* Gender Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Jenis Kelamin</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('P')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    gender === 'P'
                      ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  Remaja Putri (Target 15 mg Fe)
                </button>
                <button
                  type="button"
                  onClick={() => setGender('L')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    gender === 'L'
                      ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  Remaja Putra (Target 11 mg Fe)
                </button>
              </div>
            </div>

            <h3 className="text-sm font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2 mt-2">
              <Flame className="w-4 h-4" />
              <span>2. Pilihan Pangan &amp; Minuman Pendamping</span>
            </h3>

            {/* Iron Source Choice */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Sumber Pangan Nutrisi</label>
              <select
                value={selectedIronSource}
                onChange={e => setSelectedIronSource(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {Object.entries(ironFoodDatabase).map(([k, item]) => (
                  <option key={k} value={k} className="bg-slate-900 text-white">
                    {item.name} ({item.type} ~ {item.ironMg} mg Fe)
                  </option>
                ))}
              </select>
            </div>

            {/* Drink Companion Choice */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Minuman Pendamping Makan</label>
              <select
                value={selectedDrink}
                onChange={e => setSelectedDrink(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {Object.entries(drinkDatabase).map(([k, item]) => (
                  <option key={k} value={k} className="bg-slate-900 text-white">
                    {item.name} ({item.effect})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Visual Output */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Target Card */}
            <div className="p-5 rounded-2xl bg-white/10 border border-white/15 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                  Target Kebutuhan Nutrisi Harian
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold">
                  {gender === 'P' ? 'Remaja Putri' : 'Remaja Putra'}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {dailyTargetMg}
                </span>
                <span className="text-xs text-slate-300">mg Fe / hari</span>
              </div>
              <p className="text-xs text-sky-100 leading-relaxed">
                {gender === 'P' ? (
                  <span className="text-rose-200 font-semibold block">
                    Remaja putri dianjurkan mengonsumsi makanan bergizi seimbang dan Tablet Tambah Darah (TTD) teratur untuk menjaga stamina dan kadar hemoglobin tetap optimal.
                  </span>
                ) : (
                  <span className="text-sky-200 font-semibold block">
                    Remaja putra membutuhkan asupan zat gizi yang cukup untuk mendukung pertumbuhan fisik, kebugaran jasmani, dan aktivitas belajar.
                  </span>
                )}
              </p>
            </div>

            {/* Absorption Mechanism Feedback */}
            <div className="p-5 rounded-2xl bg-white/10 border border-white/15 flex flex-col gap-4">
              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                Analisis Absorpsi &amp; Bioavailabilitas Makanan
              </span>

              {/* Food Info */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    currentFood.type === 'Heme' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                  }`}
                >
                  {currentFood.type === 'Heme' ? 'Heme' : 'Non'}
                </div>
                <div className="flex flex-col text-xs">
                  <span className="font-bold text-white text-sm">{currentFood.name}</span>
                  <span className="text-slate-300 mt-0.5">{currentFood.desc}</span>
                  <span className="text-emerald-300 font-semibold mt-1">
                    Kandungan: {currentFood.ironMg} mg Fe ({Math.round((currentFood.ironMg / dailyTargetMg) * 100)}% target harian)
                  </span>
                </div>
              </div>

              {/* Drink Effect */}
              <div
                className={`flex items-start gap-3 p-3 rounded-xl border ${
                  currentDrink.effect === 'Enhancer'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : currentDrink.effect === 'Inhibitor'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
                }`}
              >
                {currentDrink.effect === 'Enhancer' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : currentDrink.effect === 'Inhibitor' ? (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <HelpCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                )}
                <div className="flex flex-col text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{currentDrink.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        currentDrink.effect === 'Enhancer'
                          ? 'bg-emerald-500 text-white'
                          : currentDrink.effect === 'Inhibitor'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {currentDrink.effect}
                    </span>
                  </div>
                  <p className="mt-1 leading-relaxed">{currentDrink.detail}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ARTIKEL UMUM DARI DATABASE */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider w-fit">
              <Layers className="w-3.5 h-3.5" />
              <span>Artikel Umum</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
              Artikel Umum
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Informasi dan wawasan pilihan untuk mendukung pengetahuan, kesehatan, dan gaya hidup positif.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64">
            <Input
              placeholder="Cari artikel..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
        </div>

        {/* Dynamic Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {availableCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setArticleCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                articleCategory === cat
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'ALL' ? 'Semua Kategori' : cat}
            </button>
          ))}
        </div>

        {loadingArticles ? (
          <LoadingState variant="card" rows={3} text="Memuat artikel umum..." />
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12 p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
            {searchQuery
              ? `Tidak ditemukan artikel untuk kata kunci "${searchQuery}".`
              : 'Belum ada artikel umum yang dipublikasikan untuk kategori ini.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredArticles.map(art => (
              <Card
                key={art.id}
                className="p-6 flex flex-col justify-between border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all bg-white"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" size="sm">
                      {art.category || 'UMUM'}
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      {formatDateIndonesian(art.created_at)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {art.excerpt || art.content.slice(0, 150)}...
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-600">
                  <span>Ditulis oleh: {art.created_by || 'Tim Penulis'}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 5. BUKU PANDUAN RESMI (PDF DOWNLOAD) */}
      <section className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider w-fit">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Dokumen Panduan Resmi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
            Panduan Terpadu: Pengukuran Status Gizi dan Skrining Kesehatan Remaja di Sekolah
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Format resmi pedoman teknis pengukuran antropometri (TB, BB, Standar WHO), pemantauan kesehatan, serta tata laksana pembiasaan hidup sehat bagi sekolah.
          </p>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          <a
            href="/docs/PANDUAN_PENGGUNAAN_SANTARA.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex"
          >
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md text-xs sm:text-sm"
              rightIcon={<BookOpen className="w-4 h-4" />}
            >
              Download Materi
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
