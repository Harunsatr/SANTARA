/**
 * SANTARA Activity Photo Service
 * Abstraction layer for program documentation photos and activity logs.
 * Supports persistent client-side storage, file validation, and activity relations.
 */

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
  photos: ActivityPhotoItem[];
}

export interface ActivityUploadResult {
  success: boolean;
  code: 'SUCCESS' | 'INVALID_FILE' | 'FILE_TOO_LARGE' | 'ERROR';
  message: string;
  data?: ActivityPhotoItem;
}

const STORAGE_KEY = 'santara_activity_photos_v1';

/**
 * Standard curriculum activities from official program document
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
  },
  {
    id: 'ACT002',
    title: 'Penyusunan Media Edukasi & Kartu JAKRA',
    category: 'kader',
    activityDate: '2024-07-28',
    description:
      'Penyusunan, telaah kurikulum edukasi gizi remaja, serta finalisasi rancangan cetak kartu rekam kesehatan fisik JAKRA (Jejak Kesehatan Remaja).',
    location: 'Laboratorium FIK UM',
  },
  {
    id: 'ACT003',
    title: 'Workshop I — Malnutrisi pada Remaja',
    category: 'workshop',
    activityDate: '2024-08-05',
    description:
      'Pemberian materi komprehensif mengenai bahaya anemia defisiensi besi, Kurang Energi Kronis (KEK), serta dampak malnutrisi pada masa pubertas.',
    location: 'Aula SMAN 1 Kota Batu',
  },
  {
    id: 'ACT004',
    title: 'Workshop II — Praktik Pengukuran Antropometri & Standar WHO',
    category: 'pengukuran',
    activityDate: '2024-08-12',
    description:
      'Pelatihan teknis tatap muka mengenai pengukuran tinggi badan (Microtoise), berat badan digital, lingkar lengan atas (LiLA), dan interpretasi Standar WHO Anthro.',
    location: 'Ruang UKS SMAN 1 Kota Batu',
  },
  {
    id: 'ACT005',
    title: 'Workshop III — Masalah Kesehatan Remaja',
    category: 'workshop',
    activityDate: '2024-08-19',
    description:
      'Edukasi pola hidup bersih dan sehat (PHBS), gizi seimbang harian, serta kepatuhan minum Tablet Tambah Darah (TTD) satu tablet setiap minggu.',
    location: 'Aula SMAN 1 Kota Batu',
  },
  {
    id: 'ACT006',
    title: 'Workshop IV — Praktikum Skrining Kesehatan Remaja',
    category: 'skrining',
    activityDate: '2024-08-26',
    description:
      'Praktik langsung pemeriksaan kadar hemoglobin (Hb) darah perifer dan pengukuran tekanan darah dengan pendampingan instruktur kesehatan.',
    location: 'Ruang UKS SMAN 1 Kota Batu',
  },
  {
    id: 'ACT007',
    title: 'Peresmian Kader SATRIA & Launching Website SANTARA',
    category: 'launching',
    activityDate: '2024-09-02',
    description:
      'Pelantikan resmi Satuan Remaja Peduli Kesehatan (SATRIA) SMA, penyerahan selempang kader, dan peluncuran portal digital pemantauan SANTARA.',
    location: 'SMAN 1 Kota Batu',
  },
  {
    id: 'ACT008',
    title: 'Pengukuran Mandiri oleh Kader SATRIA & Monev Berkala',
    category: 'monev',
    activityDate: '2024-09-15',
    description:
      'Pelaksanaan pemantauan antropometri, skrining Hb, dan log konsumsi TTD secara mandiri oleh kader SATRIA disertai monitoring dan evaluasi berkala.',
    location: 'SMAN 1 Kota Batu',
  },
];

/**
 * Get all stored photo items from persistent storage
 */
export function getStoredActivityPhotos(): ActivityPhotoItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  } catch (err) {
    console.error('Failed to save activity photos to localStorage:', err);
  }
}

/**
 * Fetch program activities combined with their attached photos
 */
export async function fetchActivitiesWithPhotos(): Promise<ActivityDetail[]> {
  const allStoredPhotos = getStoredActivityPhotos();

  return OFFICIAL_PROGRAM_ACTIVITIES.map(act => {
    const matchedPhotos = allStoredPhotos.filter(p => p.activityId === act.id);
    return {
      ...act,
      photos: matchedPhotos,
    };
  });
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
