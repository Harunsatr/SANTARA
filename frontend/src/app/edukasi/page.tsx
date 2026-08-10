'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Badge,
  Button,
  LoadingState,
} from '@/components/ui';
import { fetchEducations } from '@/lib/api';
import { EducationArticle } from '@/types/models';
import { calculateBMI } from '@/lib/utils/number';
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
} from 'lucide-react';

export default function PublicEducationPage() {
  // Articles from API
  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articleCategory, setArticleCategory] = useState<string>('ALL');

  // Interactive Digital CAGAR State
  const [gender, setGender] = useState<'L' | 'P'>('P');
  const [age, setAge] = useState<number>(16);
  const [weight, setWeight] = useState<string>('50');
  const [height, setHeight] = useState<string>('158');
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

  // Filtered Articles
  const filteredArticles =
    articleCategory === 'ALL'
      ? articles
      : articles.filter(a => (a.category || '').toUpperCase() === articleCategory);

  // CAGAR Simulation Calculations
  const bmiResult = calculateBMI(Number(weight) || 0, Number(height) || 0);

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

  const gejala5L = [
    { title: 'Lesu', desc: 'Tubuh terasa lunglai dan enggan beraktivitas fisik.' },
    { title: 'Letih', desc: 'Cepat merasa lelah meskipun hanya melakukan aktivitas ringan.' },
    { title: 'Lemah', desc: 'Kekuatan otot menurun, sering merasa pusing atau kunang-kunang.' },
    { title: 'Lelah', desc: 'Daya tahan tubuh rendah, mudah mengantuk di kelas.' },
    { title: 'Lalai', desc: 'Sulit fokus belajar, konsentrasi dan daya ingat menurun.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-12 sm:gap-16">
      {/* 1. HEADER SECTION */}
      <section className="flex flex-col items-center text-center gap-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Pusat Edukasi Kesehatan Remaja SMA</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-display">
          Ketahui Anemia, Cegah Gejala 5L & Optimalkan Prestasi
        </h1>
        <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-sans">
          Anemia defisiensi besi merupakan masalah gizi utama pada remaja, terutama remaja putri karena menstruasi bulanan. Pahami faktor penyebab, asupan gizi seimbang, dan simulasi media <strong>CAGAR Digital</strong> di bawah ini.
        </p>
      </section>

      {/* 2. GEJALA 5L & ANATOMI ANEMIA */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <Badge variant="danger" className="w-fit mx-auto sm:mx-0">
            Waspadai Bahaya
          </Badge>
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Tanda & Gejala 5L pada Remaja Sekolah
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Kadar hemoglobin (Hb) normal remaja putri adalah ≥ 12.0 g/dL dan remaja putra ≥ 13.0 g/dL. Jika kadar Hb rendah, pasokan oksigen ke otak dan jaringan tubuh menurun drastis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {gejala5L.map((item, idx) => (
            <Card
              key={item.title}
              className="p-5 flex flex-col gap-2 border-rose-100 bg-gradient-to-b from-rose-50/40 to-white hover:border-rose-300 transition-all shadow-2xs"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white font-black text-sm flex items-center justify-center shrink-0">
                5L.{idx + 1}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. INTERACTIVE DIGITAL CAGAR (CAKRAM GIZI ANEMIA REMAJA) */}
      <section className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-sky-900 via-sky-950 to-slate-900 text-white border border-sky-800 shadow-xl flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-sky-800/80 pb-6">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulasi Interaktif</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
              CAGAR Digital (Cakram Gizi Anemia Remaja)
            </h2>
            <p className="text-xs sm:text-sm text-sky-200/80">
              Putar dan pilih variabel untuk melihat kebutuhan gizi, status indeks massa tubuh, serta kombinasi penyerapan zat besi harianmu!
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setGender('P');
              setAge(16);
              setWeight('50');
              setHeight('158');
              setSelectedIronSource('hati');
              setSelectedDrink('jeruk');
            }}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs shrink-0"
          >
            Reset Simulasi
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-5 flex flex-col gap-5 bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>1. Profil Fisik & Antropometri</span>
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
                  Remaja Putri (Wajib TTD)
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
                  Remaja Putra
                </button>
              </div>
            </div>

            {/* Age, Weight, Height Inputs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-300">Usia (Thn)</label>
                <input
                  type="number"
                  min="13"
                  max="19"
                  value={age}
                  onChange={e => setAge(Number(e.target.value) || 16)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-300">Berat (kg)</label>
                <input
                  type="number"
                  min="30"
                  max="150"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-300">Tinggi (cm)</label>
                <input
                  type="number"
                  min="100"
                  max="220"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <h3 className="text-sm font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2 mt-2">
              <Flame className="w-4 h-4" />
              <span>2. Pilihan Pangan & Pendamping</span>
            </h3>

            {/* Iron Source Choice */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Sumber Pangan Zat Besi</label>
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
            {/* BMI & Growth Card */}
            <div className="p-5 rounded-2xl bg-white/10 border border-white/15 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                  Indeks Massa Tubuh (IMT)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-bold">
                  Usia {age} Tahun
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {bmiResult !== null ? bmiResult.toFixed(1) : '-'}
                </span>
                <span className="text-xs text-slate-300">kg/m²</span>
              </div>
              <p className="text-xs text-sky-100 leading-relaxed">
                Kebutuhan zat besi harian estimasi:{' '}
                <strong className="text-white font-bold">{dailyTargetMg} mg Fe / hari</strong>.
                {gender === 'P' && (
                  <span className="text-rose-300 font-semibold block mt-1">
                    *Remaja putri memerlukan asupan zat besi lebih tinggi serta wajib konsumsi 1 Tablet Tambah Darah (TTD) tiap minggu saat menstruasi / program UKS.
                  </span>
                )}
              </p>
            </div>

            {/* Absorption Mechanism Feedback */}
            <div className="p-5 rounded-2xl bg-white/10 border border-white/15 flex flex-col gap-4">
              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                Analisis Absorpsi & Bioavailabilitas
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

      {/* 4. ATURAN MINUM TTD (TABLET TAMBAH DARAH) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Anjuran Minum Tablet Tambah Darah (TTD)
            </h3>
          </div>
          <ul className="text-xs sm:text-sm text-slate-700 space-y-2.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
              <span>Minum <strong>1 tablet setiap minggu</strong> secara teratur pada hari yang sama (program Aksi Bergizi sekolah).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
              <span>Minum bersama <strong>air putih</strong> atau <strong>jus buah kaya Vitamin C</strong> (jeruk/jambu/tomat).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
              <span>Dianjurkan diminum malam hari sebelum tidur untuk meminimalkan rasa mual ringan.</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6 border-rose-200 bg-rose-50/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Pantangan Saat Minum TTD
            </h3>
          </div>
          <ul className="text-xs sm:text-sm text-slate-700 space-y-2.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-2 shrink-0" />
              <span><strong>JANGAN</strong> minum TTD bersama teh, kopi, atau minuman bersoda (tanin menghambat zat besi).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-2 shrink-0" />
              <span><strong>JANGAN</strong> minum TTD bersama susu atau obat maag antasida (kalsium mengganggu penyerapan).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-2 shrink-0" />
              <span>Beri jeda minimal <strong>2 jam</strong> jika ingin mengonsumsi teh, kopi, atau susu setelah minum TTD.</span>
            </li>
          </ul>
        </Card>
      </section>

      {/* 5. ARTIKEL EDUKASI DARI DATABASE */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Badge variant="primary" className="w-fit">
              Materi Edukasi UKS
            </Badge>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
              Artikel & Panduan Kesehatan Remaja
            </h2>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {['ALL', 'ANEMIA', 'GIZI', 'UKS'].map(cat => (
              <button
                key={cat}
                onClick={() => setArticleCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  articleCategory === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'ALL' ? 'Semua Artikel' : cat}
              </button>
            ))}
          </div>
        </div>

        {loadingArticles ? (
          <LoadingState variant="card" rows={3} text="Memuat artikel edukasi..." />
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12 p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
            Belum ada artikel edukasi yang dipublikasikan untuk kategori ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredArticles.map(art => (
              <Card
                key={art.id}
                className="p-6 flex flex-col justify-between border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" size="sm">
                      {art.category || 'EDUKASI'}
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
                  <span>Ditulis oleh: {art.created_by || 'Tim UKS'}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
