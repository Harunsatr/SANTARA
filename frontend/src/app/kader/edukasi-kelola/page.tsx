'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Alert,
  Modal,
  Toast,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  FileEdit,
  FolderOpen,
  Calendar,
  Sparkles,
  Eye,
  Tag,
  ExternalLink,
  ImageIcon,
  Upload,
  X,
  Camera,
} from 'lucide-react';
import { EducationArticle } from '@/types/models';
import { fetchEducations, createEducation, updateEducation, uploadArticleImage } from '@/lib/api/educations';
import { formatDateIndo } from '@/lib/utils/date';
import { useSession } from '@/context/SessionContext';
import { OFFICIAL_PROGRAM_ACTIVITIES } from '@/lib/services/activityPhotoService';
import Link from 'next/link';

export default function EdukasiKelolaPage() {
  const { user } = useSession();

  // Data states
  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<EducationArticle | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<EducationArticle | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('Kesehatan Remaja');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formValidation, setFormValidation] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Image Upload States
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 1. Initial Load & Synchronization Function
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const res = await fetchEducations();
        if (!ignore) {
          if (res.success) {
            setArticles(res.data || []);
          } else {
            setFetchError(res.message || 'Gagal memuat artikel edukasi');
          }
          setLastUpdated(new Date());
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data';
          setFetchError(msg);
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Manual Refresh Function
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setFetchError(null);

    try {
      const res = await fetchEducations();
      if (res.success) {
        setArticles(res.data || []);
      } else {
        setFetchError(res.message || 'Gagal memuat artikel edukasi');
      }
      setLastUpdated(new Date());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data';
      setFetchError(msg);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 3. Helper to generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // 4. Open Add Modal Handler
  const handleOpenAddModal = () => {
    setEditingArticle(null);
    setFormTitle('');
    setFormSlug('');
    setFormCategory('Kesehatan Remaja');
    setFormExcerpt('');
    setFormContent('');
    setFormStatus('published');
    setFormValidation({});
    setImageFile(null);
    setImagePreview(null);
    setIsFormModalOpen(true);
  };

  // 5. Open Edit Modal Handler
  const handleOpenEditModal = (art: EducationArticle) => {
    setEditingArticle(art);
    setFormTitle(art.title);
    setFormSlug(art.slug);
    setFormCategory(art.category || 'Kesehatan Remaja');
    setFormExcerpt(art.excerpt || '');
    setFormContent(art.content || '');
    setFormStatus(art.status === 'draft' ? 'draft' : 'published');
    setFormValidation({});
    setImageFile(null);
    setImagePreview(art.thumbnail_url || art.image_url || null);
    setIsFormModalOpen(true);
  };

  // 6. Handle Title change with auto-slug
  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingArticle) {
      setFormSlug(generateSlug(val));
    }
  };

  // 7. Handle Image File Selection & Validation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // MIME Validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setFormValidation(prev => ({ ...prev, image: 'Format gambar harus JPG, PNG, atau WEBP.' }));
      return;
    }

    // Size Validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormValidation(prev => ({ ...prev, image: 'Ukuran file gambar maksimal 5MB.' }));
      return;
    }

    setFormValidation(prev => {
      const copy = { ...prev };
      delete copy.image;
      return copy;
    });

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 8. Submit Form Handler (Add or Edit with Image Upload to 10_PIC_ARTIC)
  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};

    const cleanTitle = formTitle.trim();
    if (!cleanTitle) errors.title = 'Judul artikel wajib diisi.';

    const cleanSlug = formSlug.trim() || generateSlug(cleanTitle);
    if (!cleanSlug) errors.slug = 'Slug URL artikel wajib diisi.';

    const cleanExcerpt = formExcerpt.trim();
    if (!cleanExcerpt) errors.excerpt = 'Ringkasan artikel (excerpt) wajib diisi.';

    const cleanContent = formContent.trim();
    if (!cleanContent) errors.content = 'Konten lengkap artikel wajib diisi.';

    if (Object.keys(errors).length > 0) {
      setFormValidation(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      let savedArticleId = '';

      if (editingArticle) {
        // UPDATE EXISTING ARTICLE
        const payload = {
          id: editingArticle.id,
          title: cleanTitle,
          slug: cleanSlug,
          category: formCategory,
          excerpt: cleanExcerpt,
          content: cleanContent,
          status: formStatus,
          author_id: user?.id || 'USR001',
          user_id: user?.id || 'USR001',
        };

        const res = await updateEducation(payload);
        if (res.success && res.data) {
          savedArticleId = editingArticle.id;
        } else {
          setFormValidation({
            general: res.message || 'Gagal memperbarui artikel edukasi di Google Sheets.',
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        // CREATE NEW ARTICLE
        const payload = {
          title: cleanTitle,
          slug: cleanSlug,
          category: formCategory,
          excerpt: cleanExcerpt,
          content: cleanContent,
          status: formStatus,
          author_id: user?.id || 'USR001',
          user_id: user?.id || 'USR001',
        };

        const res = await createEducation(payload);
        if (res.success && res.data) {
          savedArticleId = res.data.id;
        } else {
          setFormValidation({
            general: res.message || 'Gagal menyimpan artikel baru ke Google Sheets.',
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Handle Image Upload to 10_PIC_ARTIC & Google Drive if file selected
      if (imageFile && imagePreview && savedArticleId) {
        try {
          await uploadArticleImage({
            article_id: savedArticleId,
            filename: imageFile.name,
            mime_type: imageFile.type,
            base64_data: imagePreview,
            uploaded_by: user?.id || 'USR001',
            user_id: user?.id || 'USR001',
          });
        } catch (imgErr) {
          console.error('Gagal mengunggah gambar ke 10_PIC_ARTIC:', imgErr);
        }
      }

      setToast({
        message: editingArticle
          ? `Artikel "${cleanTitle}" berhasil diperbarui.`
          : `Artikel baru "${cleanTitle}" berhasil dipublikasikan.`,
        type: 'success',
      });
      setIsFormModalOpen(false);
      await handleManualRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan artikel.';
      setFormValidation({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 9. Categories List
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    articles.forEach(a => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [articles]);

  // 10. Filtered Articles List
  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = art.title.toLowerCase().includes(q);
        const matchExcerpt = (art.excerpt || '').toLowerCase().includes(q);
        const matchSlug = art.slug.toLowerCase().includes(q);
        const matchId = art.id.toLowerCase().includes(q);
        if (!matchTitle && !matchExcerpt && !matchSlug && !matchId) return false;
      }

      if (filterCategory !== 'ALL' && art.category !== filterCategory) {
        return false;
      }

      if (filterStatus !== 'ALL' && art.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [articles, searchQuery, filterCategory, filterStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* HEADER & ACTIONS                                                         */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 rounded-xl text-sky-700">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Kelola Artikel Umum
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Pusat manajemen dan publikasi artikel edukasi umum bagi siswa dan lingkungan sekolah.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Public Portal Link */}
          <Link href="/edukasi" target="_blank">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Lihat Portal Publik</span>
            </Button>
          </Link>

          {/* Refresh Data Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>{isRefreshing ? 'Menyinkronkan...' : 'Refresh'}</span>
          </Button>

          {/* Add Article Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Artikel Baru</span>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STATS & OVERVIEW CARDS                                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Artikel
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {articles.length}
              </p>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Artikel Dipublikasikan
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {articles.filter(a => a.status === 'published').length}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Draft / Menunggu
              </p>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {articles.filter(a => a.status === 'draft').length}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <FileEdit className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Kategori Materi
              </p>
              <p className="text-2xl font-black text-indigo-600 mt-1">
                {categoriesList.length}
              </p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <FolderOpen className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* FILTER & SEARCH BAR                                                       */}
      {/* ========================================================================= */}
      <Card className="p-4 bg-white border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul, ringkasan, atau slug artikel..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Kategori</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* ARTICLES DATA TABLE                                                       */}
      {/* ========================================================================= */}
      <Card className="bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <CardHeader className="p-4 sm:px-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
              Daftar Artikel &amp; Materi Edukasi (08_EDUCATIONS)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Tersinkronisasi otomatis dengan Google Sheets 08_EDUCATIONS dan 10_PIC_ARTIC.
            </CardDescription>
          </div>
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 hidden sm:inline-block">
              Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
            </span>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16">
              <LoadingState text="Memuat artikel dari basis data Google Sheets..." />
            </div>
          ) : fetchError ? (
            <div className="p-6">
              <Alert variant="error" title="Gagal Memuat Data">
                {fetchError}
              </Alert>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-16">
              <EmptyState
                title="Tidak Ada Artikel Ditemukan"
                description={
                  searchQuery
                    ? `Tidak ada artikel yang cocok dengan kata kunci "${searchQuery}".`
                    : 'Belum ada artikel yang sesuai filter yang dipilih.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Gambar</th>
                    <th className="py-3.5 px-4">Judul Artikel</th>
                    <th className="py-3.5 px-4">Kategori</th>
                    <th className="py-3.5 px-4">Slug URL</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4">Tanggal Buat</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredArticles.map(art => {
                    const imgSrc = art.thumbnail_url || art.image_url;
                    return (
                      <tr
                        key={art.id}
                        className="hover:bg-sky-50/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedArticle(art);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        {/* Thumbnail Image */}
                        <td className="py-3.5 px-4 w-16" onClick={e => e.stopPropagation()}>
                          {imgSrc ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imgSrc}
                                alt={art.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </td>

                        {/* Title & Excerpt */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                            {art.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            {art.excerpt || 'Tidak ada ringkasan'}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <Badge variant="primary" className="text-xs font-semibold flex items-center gap-1 w-fit">
                            <Tag className="w-3 h-3" />
                            <span>{art.category || 'Umum'}</span>
                          </Badge>
                        </td>

                        {/* Slug */}
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                          /{art.slug}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {art.status === 'published' ? (
                            <Badge variant="success" className="text-xs font-semibold">
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="neutral" className="text-xs font-semibold">
                              Draft
                            </Badge>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDateIndo(art.created_at)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedArticle(art);
                                setIsDetailModalOpen(true);
                              }}
                              className="text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              <span>Detail</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(art)}
                              className="text-xs text-slate-600 hover:text-sky-700 hover:bg-sky-50"
                            >
                              <FileEdit className="w-3.5 h-3.5 mr-1" />
                              <span>Edit</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION: DOKUMENTASI KEGIATAN PROGRAM SATRIA                              */}
      {/* ========================================================================= */}
      <section className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Dokumentasi Kegiatan Program SATRIA
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Log pelaksanaan sosialisasi, workshop, skrining klinis, dan pengukuran oleh kader SATRIA.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setToast({
                message:
                  'Penyimpanan berkas foto kegiatan terhubung ke Google Drive folder SANTARA_ARTICLE_IMAGES.',
                type: 'info',
              });
            }}
            className="flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <Camera className="w-4 h-4" />
            <span>Unggah Foto Kegiatan</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OFFICIAL_PROGRAM_ACTIVITIES.map((act) => (
            <Card key={act.id} className="p-4 border border-slate-200 bg-white hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                    {act.category}
                  </Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {act.activityDate}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{act.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{act.description}</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Lokasi: {act.location}</span>
                <span className="text-emerald-600 font-semibold">Terdokumentasi</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODAL: FORM TAMBAH / EDIT ARTIKEL DENGAN UPLOAD GAMBAR                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => !isSubmitting && setIsFormModalOpen(false)}
        title={editingArticle ? 'Edit Artikel Edukasi' : 'Buat Artikel Edukasi Baru'}
        description="Lengkapi informasi artikel untuk dipublikasikan pada portal edukasi SANTARA."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitArticle} className="space-y-4 pt-2">
          {formValidation.general && (
            <Alert variant="error" title="Gagal Menyimpan">
              {formValidation.general}
            </Alert>
          )}

          {/* Title */}
          <Input
            label="Judul Artikel Edukasi"
            name="title"
            placeholder="Contoh: Pentingnya Sarapan Pagi Bagi Konsentrasi Belajar"
            value={formTitle}
            onChange={e => handleTitleChange(e.target.value)}
            error={formValidation.title}
            required
          />

          {/* Slug & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Slug URL (Karakter Web)"
              name="slug"
              placeholder="pentingnya-sarapan-pagi"
              value={formSlug}
              onChange={e => setFormSlug(e.target.value)}
              error={formValidation.slug}
              required
            />

            <Select
              label="Kategori Materi"
              name="category"
              value={formCategory}
              onChange={e => setFormCategory(e.target.value)}
              options={[
                { label: 'Kesehatan Remaja', value: 'Kesehatan Remaja' },
                { label: 'Pola Hidup Sehat', value: 'Pola Hidup Sehat' },
                { label: 'Gaya Hidup & Kebiasaan Positif', value: 'Gaya Hidup' },
                { label: 'Aktivitas Fisik & Kebugaran', value: 'Aktivitas Fisik' },
                { label: 'Kesehatan Mental & Edukasi', value: 'Kesehatan Mental' },
                { label: 'Kebersihan & Sanitasi', value: 'Kebersihan' },
                { label: 'Tips & Panduan Siswa', value: 'Tips dan Panduan' },
                { label: 'Informasi Sekolah', value: 'Informasi Sekolah' },
              ]}
              required
            />
          </div>

          {/* Image Upload Input & Preview (10_PIC_ARTIC) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Gambar Utama Artikel (Google Sheets 10_PIC_ARTIC)
            </label>

            {imagePreview ? (
              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition-colors shadow-sm"
                  title="Hapus Gambar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-sky-400 transition-colors bg-slate-50/50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2.5 bg-sky-50 rounded-full text-sky-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-sky-600">Pilih file gambar</span> atau seret ke sini
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Format yang didukung: JPG, PNG, WEBP (Maksimal 5MB)
                  </p>
                </div>
              </div>
            )}

            {formValidation.image && (
              <p className="text-xs text-rose-500 mt-1">{formValidation.image}</p>
            )}
          </div>

          {/* Excerpt (Summary) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ringkasan Singkat (Excerpt) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Tulis ringkasan 1-2 kalimat yang menarik untuk kartu artikel..."
              value={formExcerpt}
              onChange={e => setFormExcerpt(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
            {formValidation.excerpt && (
              <p className="text-xs text-rose-500 mt-1">{formValidation.excerpt}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Isi Lengkap Artikel <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={6}
              placeholder="Tulis isi artikel edukasi lengkap di sini..."
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none font-sans leading-relaxed"
              required
            />
            {formValidation.content && (
              <p className="text-xs text-rose-500 mt-1">{formValidation.content}</p>
            )}
          </div>

          {/* Status Select */}
          <Select
            label="Status Publikasi"
            name="status"
            value={formStatus}
            onChange={e => setFormStatus(e.target.value as 'published' | 'draft')}
            options={[
              { label: 'Published (Langsung Ditampilkan ke Siswa & Publik)', value: 'published' },
              { label: 'Draft (Simpan Sementara, Belum Dipublikasikan)', value: 'draft' },
            ]}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Spreadsheet...</span>
                </>
              ) : (
                <span>{editingArticle ? 'Perbarui Artikel' : 'Simpan & Publikasikan'}</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETAIL ARTIKEL (MODAL DIALOG)                                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Pratinjau Artikel Edukasi"
        description="Materi informasi kesehatan yang ditampilkan pada portal edukasi SANTARA."
        maxWidth="lg"
      >
        {selectedArticle && (
          <div className="space-y-4 pt-2">
            {/* Image Banner if available */}
            {(selectedArticle.thumbnail_url || selectedArticle.image_url) && (
              <div className="relative w-full h-52 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedArticle.thumbnail_url || selectedArticle.image_url}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Header Badge */}
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="primary" className="text-xs font-semibold">
                    {selectedArticle.category || 'Umum'}
                  </Badge>
                  {selectedArticle.status === 'published' ? (
                    <Badge variant="success" className="text-xs">Published</Badge>
                  ) : (
                    <Badge variant="neutral" className="text-xs">Draft</Badge>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{selectedArticle.title}</h3>
                <p className="text-xs font-mono text-slate-500 mt-1">Slug: /{selectedArticle.slug}</p>
              </div>
              <Sparkles className="w-6 h-6 text-sky-600 shrink-0" />
            </div>

            {/* Excerpt Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs italic text-slate-600 leading-relaxed">
              &ldquo;{selectedArticle.excerpt}&rdquo;
            </div>

            {/* Content Body */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-line">
              {selectedArticle.content}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Link href="/edukasi" target="_blank" className="text-xs text-sky-600 hover:underline flex items-center gap-1">
                <span>Buka di portal publik</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEditModal(selectedArticle);
                  }}
                >
                  <FileEdit className="w-3.5 h-3.5 mr-1" />
                  <span>Edit Artikel</span>
                </Button>
                <Button variant="primary" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
