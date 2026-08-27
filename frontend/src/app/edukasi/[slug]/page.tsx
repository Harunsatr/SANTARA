'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Badge,
  Button,
  LoadingState,
  Card,
} from '@/components/ui';
import { fetchEducations } from '@/lib/api';
import { EducationArticle } from '@/types/models';
import { formatDateIndonesian } from '@/lib/utils/date';
import {
  ArrowLeft,
  Calendar,
  User,
  BookOpen,
  Share2,
  Check,
  ImageIcon,
  Sparkles,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function PublicArticleDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const rawSlug = decodeURIComponent(resolvedParams.slug || '').trim();

  const [article, setArticle] = useState<EducationArticle | null>(null);
  const [otherArticles, setOtherArticles] = useState<EducationArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadArticleData() {
      try {
        const res = await fetchEducations();
        if (!ignore && res.success && Array.isArray(res.data)) {
          const allArticles = res.data.filter(a => {
            const st = (a.status || 'published').toLowerCase();
            return st !== 'draft';
          });

          // Match by slug or by ID (case-insensitive)
          const targetSlug = rawSlug.toLowerCase();
          const found = allArticles.find(
            a =>
              (a.slug && a.slug.toLowerCase() === targetSlug) ||
              (a.id && a.id.toLowerCase() === targetSlug) ||
              (a.title &&
                a.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '') === targetSlug)
          );

          if (found) {
            setArticle(found);
            setOtherArticles(allArticles.filter(a => a.id !== found.id).slice(0, 3));
          } else {
            setArticle(null);
          }
          setLoading(false);
        }
      } catch {
        if (!ignore) setLoading(false);
      }
    }

    loadArticleData();

    return () => {
      ignore = true;
    };
  }, [rawSlug]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <LoadingState variant="card" rows={4} text="Memuat artikel edukasi..." />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-3xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            Artikel Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md">
            Materi atau artikel edukasi dengan kata kunci &ldquo;{rawSlug}&rdquo; belum dipublikasikan atau sudah dipindahkan.
          </p>
        </div>
        <Link href="/edukasi">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Kembali ke Media Edukasi
          </Button>
        </Link>
      </div>
    );
  }

  const imageSrc = article.thumbnail_url || article.image_url;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col gap-8">
      {/* 1. TOP NAVIGATION / BREADCRUMB */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <Link
          href="/edukasi"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Media Edukasi</span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Tautan Disalin</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Bagikan</span>
            </>
          )}
        </button>
      </div>

      {/* 2. HEADER & TITLE SECTION */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="primary" size="sm">
            {article.category || 'UMUM'}
          </Badge>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formatDateIndonesian(article.created_at)}
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {article.created_by || 'Tim Kesehatan SANTARA'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight font-display leading-tight">
          {article.title}
        </h1>

        {article.excerpt && (
          <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/80 border-l-4 border-sky-500 text-xs sm:text-sm text-sky-950 font-medium leading-relaxed italic">
            &ldquo;{article.excerpt}&rdquo;
          </div>
        )}
      </header>

      {/* 3. COVER IMAGE BANNER */}
      {imageSrc ? (
        <div className="relative w-full h-64 sm:h-96 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-36 rounded-3xl bg-gradient-to-r from-sky-50 via-slate-50 to-sky-50 border border-slate-200 flex items-center justify-center text-sky-600/40">
          <ImageIcon className="w-10 h-10" />
        </div>
      )}

      {/* 4. MAIN ARTICLE CONTENT */}
      <section className="prose prose-slate max-w-none text-sm sm:text-base text-slate-700 leading-relaxed space-y-4 whitespace-pre-line bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-2xs">
        {article.content}
      </section>

      {/* 5. FOOTER AUTHOR / DISCLAIMER CARD */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-black">
            S
          </div>
          <div>
            <p className="font-bold text-slate-900">SANTARA Media Edukasi</p>
            <p className="text-[11px] text-slate-500">Materi edukasi kesehatan terpadu remaja SMA & UKS</p>
          </div>
        </div>
        <Link href="/edukasi">
          <Button variant="outline" size="sm">
            Lihat Artikel Lainnya
          </Button>
        </Link>
      </div>

      {/* 6. RELATED ARTICLES */}
      {otherArticles.length > 0 && (
        <section className="flex flex-col gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Artikel Edukasi Lainnya</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherArticles.map(art => (
              <Link key={art.id} href={`/edukasi/${art.slug || art.id}`}>
                <Card className="p-4 flex flex-col gap-2 hover:border-sky-300 hover:shadow-sm transition-all h-full bg-white">
                  <Badge variant="secondary" size="sm" className="w-fit">
                    {art.category || 'UMUM'}
                  </Badge>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-sky-600 transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-auto">
                    {art.excerpt || art.content.slice(0, 80)}...
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
