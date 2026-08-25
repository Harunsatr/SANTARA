import React from 'react';
import Image from 'next/image';
import { HeartPulse } from 'lucide-react';

export function Footer() {
  const partnerLogos = [
    { name: 'Direktorat Riset, Teknologi, dan Pengabdian kepada Masyarakat (DRTPM / Dikti Sains)', src: '/Logo/LogoDiktiSains.png' },
    { name: 'BIMA Kemendikbudristek', src: '/Logo/LogoBima.jpeg' },
    { name: 'Universitas Negeri Malang', src: '/Logo/LogoUM.jpeg' },
    { name: 'FIK Universitas Negeri Malang', src: '/Logo/LogoFIK.jpeg' },
    { name: 'SMAN 1 Kota Batu', src: '/Logo/LogoSMABATU.jpeg' },
  ];

  return (
    <footer className="w-full bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto">
      {/* Partner Logos Banner */}
      <div className="border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center sm:text-left">
              Mitra & Ekosistem Pendukung Program
            </span>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {partnerLogos.map(logo => (
                <div
                  key={logo.name}
                  className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white p-1.5 shadow-2xs hover:scale-105 transition-transform shrink-0 overflow-hidden"
                  title={logo.name}
                >
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    fill
                    className="object-contain p-0.5 rounded-lg"
                    sizes="48px"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand Col */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
                <HeartPulse className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white tracking-tight font-display">
                SANTARA
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Sistem Pemantauan Kesehatan Remaja SMA — Platform digital terpadu untuk pencatatan status gizi, skrining anemia, dan kepatuhan konsumsi Tablet Tambah Darah (TTD) oleh kader SATRIA.
            </p>
          </div>

          {/* Program Focus */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Media Pendamping UKS
            </h4>
            <ul className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
              <li>• <strong>Media Edukasi</strong> — Informasi &amp; Edukasi Kesehatan Remaja</li>
              <li>• <strong>JAKRA</strong> — Jejak Kesehatan Remaja (Kartu Fisik F4)</li>
              <li>• <strong>Panduan Terpadu UKS</strong> — Pengukuran Status Gizi & Skrining Kesehatan</li>
              <li>• <strong>Kader SATRIA</strong> — Satuan Remaja Peduli Kesehatan</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} SANTARA. Hak Cipta Dilindungi Undang-Undang.</p>
          <p>Sistem Pemantauan Kesehatan Remaja SMA</p>
        </div>
      </div>
    </footer>
  );
}
