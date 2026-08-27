/**
 * SANTARA Activity Photo Service
 * Abstraction layer for program documentation photos and activity logs.
 * Supports persistent client-side storage, file validation, and activity relations.
 */

export type ActivityStatus = 'draft' | 'published';

export interface ActivityPhotoItem {
  id: string;
  activityId: string;
  url: string;
  caption?: string;
  photographer?: string;
  uploadedAt: string;
}

export interface ActivityDetail {
  id: string;
  title: string;
  category: 'workshop' | 'pengukuran' | 'skrining' | 'kader' | 'launching' | 'monev' | string;
  activityDate: string;
  description: string;
  location: string;
  status: ActivityStatus;
  publishedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  photos: ActivityPhotoItem[];
}

export interface ActivityUploadResult {
  success: boolean;
  code: 'SUCCESS' | 'INVALID_FILE' | 'FILE_TOO_LARGE' | 'ERROR';
  message: string;
  data?: ActivityPhotoItem;
}

const STORAGE_PHOTOS_KEY = 'santara_activity_photos_v1';
const STORAGE_ACTIVITIES_KEY = 'santara_activities_v1';

/**
 * Standard curriculum activities from official program document (default published)
 */
export const OFFICIAL_PROGRAM_ACTIVITIES: Omit<ActivityDetail, 'photos'>[] = [
  {
    id: 'ACT001',
    title: 'Analisis Situasi & Sosialisasi Awal Program',
    category: 'workshop',
    activityDate: '2024-07-15',
    description:
      'Pemetaan kondisi gizi, status anemia, serta penjajakan awal bersama pihak pimpinan sekolah mitra, tim guru pembina, dan pengurus UKS SMA.',
    location: 'SMAN 1 Kota Batu',
    status: 'published',
    publishedAt: '2024-07-15T08:00:00.000Z',
    createdAt: '2024-07-15T08:00:00.000Z',
    updatedAt: '2024-07-15T08:00:00.000Z',
  },
  {
    id: 'ACT002',
    title: 'Penyusunan Media Edukasi & Kartu JAKRA',
    category: 'kader',
    activityDate: '2024-07-28',
    description:
      'Penyusunan, telaah kurikulum edukasi gizi remaja, serta finalisasi rancangan cetak kartu rekam kesehatan fisik JAKRA (Jejak Kesehatan Remaja).',
    location: 'Laboratorium FIK UM',
    status: 'published',
    publishedAt: '2024-07-28T08:00:00.000Z',
    createdAt: '2024-07-28T08:00:00.000Z',
    updatedAt: '2024-07-28T08:00:00.000Z',
  },
  {
    id: 'ACT003',
    title: 'Workshop I — Malnutrisi pada Remaja',
    category: 'workshop',
    activityDate: '2024-08-05',
    description:
      'Pemberian materi komprehensif mengenai bahaya anemia defisiensi besi, Kurang Energi Kronis (KEK), serta dampak malnutrisi pada masa pubertas.',
    location: 'Aula SMAN 1 Kota Batu',
    status: 'published',
    publishedAt: '2024-08-05T08:00:00.000Z',
    createdAt: '2024-08-05T08:00:00.000Z',
    updatedAt: '2024-08-05T08:00:00.000Z',
  },
  {
    id: 'ACT004',
    title: 'Workshop II — Praktik Pengukuran Antropometri & Standar WHO',
    category: 'pengukuran',
    activityDate: '2024-08-12',
    description:
      'Pelatihan teknis tatap muka mengenai pengukuran tinggi badan (Microtoise), berat badan digital, lingkar lengan atas (LiLA), dan interpretasi Standar WHO Anthro.',
    location: 'Ruang UKS SMAN 1 Kota Batu',
    status: 'published',
    publishedAt: '2024-08-12T08:00:00.000Z',
    createdAt: '2024-08-12T08:00:00.000Z',
    updatedAt: '2024-08-12T08:00:00.000Z',
  },
  {
    id: 'ACT005',
    title: 'Workshop III — Masalah Kesehatan Remaja',
    category: 'workshop',
    activityDate: '2024-08-19',
    description:
      'Edukasi pola hidup bersih dan sehat (PHBS), gizi seimbang harian, serta kepatuhan minum Tablet Tambah Darah (TTD) satu tablet setiap minggu.',
    location: 'Aula SMAN 1 Kota Batu',
    status: 'published',
    publishedAt: '2024-08-19T08:00:00.000Z',
    createdAt: '2024-08-19T08:00:00.000Z',
    updatedAt: '2024-08-19T08:00:00.000Z',
  },
  {
    id: 'ACT006',
    title: 'Workshop IV — Praktikum Skrining Kesehatan Remaja',
    category: 'skrining',
    activityDate: '2024-08-26',
    description:
      'Praktik langsung pemeriksaan kadar hemoglobin (Hb) darah perifer dan pengukuran tekanan darah dengan pendampingan instruktur kesehatan.',
    location: 'Ruang UKS SMAN 1 Kota Batu',
    status: 'published',
    publishedAt: '2024-08-26T08:00:00.000Z',
    createdAt: '2024-08-26T08:00:00.000Z',
    updatedAt: '2024-08-26T08:00:00.000Z',
  },
  {
    id: 'ACT007',
    title: 'Peresmian Kader SATRIA & Launching Website SANTARA',
    category: 'launching',
    activityDate: '2024-09-02',
    description:
      'Pelantikan resmi Satuan Remaja Peduli Kesehatan (SATRIA) SMA, penyerahan selempang kader, dan peluncuran portal digital pemantauan SANTARA.',
    location: 'SMAN 1 Kota Batu',
    status: 'published',
    publishedAt: '2024-09-02T08:00:00.000Z',
    createdAt: '2024-09-02T08:00:00.000Z',
    updatedAt: '2024-09-02T08:00:00.000Z',
  },
  {
    id: 'ACT008',
    title: 'Pengukuran Mandiri oleh Kader SATRIA & Monev Berkala',
    category: 'monev',
    activityDate: '2024-09-15',
    description:
      'Pelaksanaan pemantauan antropometri, skrining Hb, dan log konsumsi TTD secara mandiri oleh kader SATRIA disertai monitoring dan evaluasi berkala.',
    location: 'SMAN 1 Kota Batu',
    status: 'published',
    publishedAt: '2024-09-15T08:00:00.000Z',
    createdAt: '2024-09-15T08:00:00.000Z',
    updatedAt: '2024-09-15T08:00:00.000Z',
  },
];

/**
 * Get stored activities list
 */
export function getStoredActivities(): Omit<ActivityDetail, 'photos'>[] {
  if (typeof window === 'undefined') return OFFICIAL_PROGRAM_ACTIVITIES;
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVITIES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(OFFICIAL_PROGRAM_ACTIVITIES));
      return OFFICIAL_PROGRAM_ACTIVITIES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(OFFICIAL_PROGRAM_ACTIVITIES));
      return OFFICIAL_PROGRAM_ACTIVITIES;
    }
    return parsed;
  } catch {
    return OFFICIAL_PROGRAM_ACTIVITIES;
  }
}

/**
 * Save stored activities list
 */
export function saveStoredActivities(activities: Omit<ActivityDetail, 'photos'>[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(activities));
  } catch (err) {
    console.error('Failed to save activities to localStorage:', err);
  }
}

/**
 * Get all stored photo items from persistent storage
 */
export function getStoredActivityPhotos(): ActivityPhotoItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_PHOTOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save all stored photo items to persistent storage
 */
export function saveStoredActivityPhotos(photos: ActivityPhotoItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PHOTOS_KEY, JSON.stringify(photos));
  } catch (err) {
    console.error('Failed to save activity photos to localStorage:', err);
  }
}

/**
 * Fetch program activities combined with their attached photos, with optional status filter
 */
export async function fetchActivitiesWithPhotos(options?: {
  status?: 'all' | 'published' | 'draft';
}): Promise<ActivityDetail[]> {
  const allActivities = getStoredActivities();
  const allStoredPhotos = getStoredActivityPhotos();

  const combined: ActivityDetail[] = allActivities.map(act => {
    const matchedPhotos = allStoredPhotos.filter(p => p.activityId === act.id);
    return {
      ...act,
      status: (act.status || 'published').toLowerCase() as ActivityStatus,
      photos: matchedPhotos,
    };
  });

  const filterStatus = options?.status || 'all';
  if (filterStatus === 'published') {
    return combined.filter(a => a.status === 'published');
  }
  if (filterStatus === 'draft') {
    return combined.filter(a => a.status === 'draft');
  }
  return combined;
}

/**
 * Update activity publication status (draft <-> published)
 */
export async function updateActivityStatus(
  activityId: string,
  newStatus: ActivityStatus
): Promise<{ success: boolean; data?: ActivityDetail; message: string }> {
  const allActivities = getStoredActivities();
  const index = allActivities.findIndex(a => a.id === activityId);

  if (index === -1) {
    return {
      success: false,
      message: `Kegiatan dengan ID ${activityId} tidak ditemukan.`,
    };
  }

  const now = new Date().toISOString();
  const existing = allActivities[index];

  const updated: Omit<ActivityDetail, 'photos'> = {
    ...existing,
    status: newStatus,
    updatedAt: now,
    publishedAt: newStatus === 'published' ? existing.publishedAt || now : undefined,
  };

  allActivities[index] = updated;
  saveStoredActivities(allActivities);

  const allPhotos = getStoredActivityPhotos().filter(p => p.activityId === activityId);

  return {
    success: true,
    data: { ...updated, photos: allPhotos },
    message:
      newStatus === 'published'
        ? `Dokumentasi "${updated.title}" berhasil dipublikasikan ke portal publik.`
        : `Dokumentasi "${updated.title}" berhasil dialihkan menjadi Draft.`,
  };
}

/**
 * Update activity details (title, description, location, category, date)
 */
export async function updateActivityDetail(
  activityId: string,
  updates: Partial<Omit<ActivityDetail, 'id' | 'photos'>>
): Promise<{ success: boolean; data?: ActivityDetail; message: string }> {
  const allActivities = getStoredActivities();
  const index = allActivities.findIndex(a => a.id === activityId);

  if (index === -1) {
    return {
      success: false,
      message: `Kegiatan dengan ID ${activityId} tidak ditemukan.`,
    };
  }

  const now = new Date().toISOString();
  const existing = allActivities[index];

  const updated: Omit<ActivityDetail, 'photos'> = {
    ...existing,
    ...updates,
    updatedAt: now,
  };

  allActivities[index] = updated;
  saveStoredActivities(allActivities);

  const allPhotos = getStoredActivityPhotos().filter(p => p.activityId === activityId);

  return {
    success: true,
    data: { ...updated, photos: allPhotos },
    message: `Detail dokumentasi kegiatan "${updated.title}" berhasil diperbarui.`,
  };
}

/**
 * Create a new activity documentation record (default status = draft)
 */
export async function createActivity(
  data: Omit<ActivityDetail, 'id' | 'photos' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; data?: ActivityDetail; message: string }> {
  const allActivities = getStoredActivities();

  // Generate next ID (e.g. ACT009)
  let maxNum = 0;
  allActivities.forEach(a => {
    const match = a.id.match(/^ACT(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });

  const nextId = `ACT${String(maxNum + 1).padStart(3, '0')}`;
  const now = new Date().toISOString();

  const newActivity: Omit<ActivityDetail, 'photos'> = {
    id: nextId,
    title: data.title.trim(),
    category: data.category || 'workshop',
    activityDate: data.activityDate || now.split('T')[0],
    description: data.description.trim(),
    location: data.location.trim() || 'SMAN 1 Kota Batu',
    status: data.status || 'draft', // Default is draft!
    publishedAt: data.status === 'published' ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };

  const updatedList = [newActivity, ...allActivities];
  saveStoredActivities(updatedList);

  return {
    success: true,
    data: { ...newActivity, photos: [] },
    message: `Dokumentasi kegiatan baru berhasil dibuat sebagai ${newActivity.status === 'published' ? 'Published' : 'Draft'}.`,
  };
}

/**
 * Convert a File object to base64 Data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Save/Upload new activity photo linked to a specific activity
 */
export async function saveActivityPhoto(params: {
  activityId: string;
  file?: File | null;
  imageUrl?: string;
  caption?: string;
  photographer?: string;
}): Promise<ActivityUploadResult> {
  const { activityId, file, imageUrl, caption, photographer } = params;

  if (!activityId) {
    return {
      success: false,
      code: 'ERROR',
      message: 'Pilih kegiatan yang ingin ditambahkan foto dokumentasinya.',
    };
  }

  let finalUrl = imageUrl ? imageUrl.trim() : '';

  if (file) {
    // 1. MIME Validation
    const validMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimes.includes(file.type.toLowerCase())) {
      return {
        success: false,
        code: 'INVALID_FILE',
        message: 'Format file tidak didukung. Harap gunakan format JPG, JPEG, PNG, atau WEBP.',
      };
    }

    // 2. Size Validation (Max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return {
        success: false,
        code: 'FILE_TOO_LARGE',
        message: 'Ukuran foto terlalu besar. Maksimal ukuran file adalah 5 MB.',
      };
    }

    try {
      finalUrl = await fileToDataUrl(file);
    } catch {
      return {
        success: false,
        code: 'ERROR',
        message: 'Gagal memproses file foto. Silakan coba kembali.',
      };
    }
  }

  if (!finalUrl) {
    return {
      success: false,
      code: 'ERROR',
      message: 'Pilih file foto atau masukkan tautan URL gambar dokumentasi.',
    };
  }

  const newPhoto: ActivityPhotoItem = {
    id: `PHOTO_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    activityId,
    url: finalUrl,
    caption: caption?.trim() || '',
    photographer: photographer?.trim() || 'Kader SATRIA',
    uploadedAt: new Date().toISOString(),
  };

  const existingPhotos = getStoredActivityPhotos();
  const updatedPhotos = [newPhoto, ...existingPhotos];
  saveStoredActivityPhotos(updatedPhotos);

  return {
    success: true,
    code: 'SUCCESS',
    message: 'Foto dokumentasi kegiatan berhasil disimpan.',
    data: newPhoto,
  };
}

/**
 * Delete activity photo by ID
 */
export async function deleteActivityPhoto(photoId: string): Promise<boolean> {
  const existingPhotos = getStoredActivityPhotos();
  const filtered = existingPhotos.filter(p => p.id !== photoId);
  saveStoredActivityPhotos(filtered);
  return true;
}
