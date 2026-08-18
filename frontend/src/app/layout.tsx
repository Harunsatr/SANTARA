import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/context/SessionContext';
import { Shell } from '@/components/shell';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SANTARA — Sistem Pemantauan Kesehatan Remaja SMA',
  description:
    'Platform digital terpadu untuk pencatatan status gizi, skrining kesehatan anemia, dan kepatuhan konsumsi Tablet Tambah Darah (TTD) siswa SMA oleh kader SATRIA.',
  keywords: [
    'SANTARA',
    'SATRIA',
    'UKS SMA',
    'Status Gizi Remaja',
    'Anemia Remaja',
    'Tablet Tambah Darah',
    'Media Edukasi',
    'JAKRA',
  ],
  authors: [{ name: 'Tim SANTARA' }],
};

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <SessionProvider>
          <Shell>{children}</Shell>
        </SessionProvider>
      </body>
    </html>
  );
}
