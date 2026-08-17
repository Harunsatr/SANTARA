/**
 * SANTARA Activity Photo Service
 * Abstraction layer for program documentation photos and activity logs.
 * 
 * BACKEND STATUS: NOT YET SUPPORTED FOR BINARY STORAGE
 * Binary/image uploads directly into Google Sheets are deliberately avoided
 * to prevent database bloat and corrupted cell limits.
 * 
 * Once dedicated storage (e.g. S3 / Cloudinary / Firebase Storage) is configured,
 * upload handler can be seamlessly connected here.
 */

export interface ActivityPhoto {
  id: string;
  title: string;
  category: 'workshop' | 'pengukuran' | 'skrining' | 'kader' | 'launching' | 'monev';
  activityDate: string;
  description: string;
  location: string;
  imageUrl?: string;
  photographer?: string;
}

export interface ActivityUploadResult {
  success: boolean;
  code: 'STORAGE_NOT_CONFIGURED' | 'SUCCESS' | 'ERROR';
  message: string;
  data?: ActivityPhoto;
}

/**
 * Standard curriculum activities from official program document
 */
export const OFFICIAL_PROGRAM_ACTIVITIES: ActivityPhoto[] = [
  {
    id: 'ACT001',
    title: 'Analisis Situasi & Sosialisasi Awal Program',
    category: 'workshop',
    activityDate: '2024-07-15',
    description: 'Pemetaan kondisi gizi dan anemia remaja bersama pihak sekolah mitra dan pengurus UKS.',
    location: 'SMAN 1 Kota Batu',
  },
  {
    id: 'ACT002',
    title: 'Penyusunan Media Edukasi Anemia & Kartu JAKRA',
    category: 'kader',
    activityDate: '2024-07-28',
    description: 'Finalisasi desain media edukasi anemia dan kartu rekam kesehatan fisik JAKRA.',
    location: 'Laboratorium FIK UM',
  },
  {
    id: 'ACT003',
    title: 'Workshop I — Malnutrisi pada Remaja',
    category: 'workshop',
    activityDate: '2024-08-05',
    description: 'Pemberian materi komprehensif mengenai bahaya anemia gizi besi, KEK, dan malnutrisi.',
    location: 'Aula SMAN 1 Kota Batu',
  },
  {
    id: 'ACT004',
    title: 'Workshop II — Praktik Pengukuran Antropometri & Standar WHO',
    category: 'pengukuran',
    activityDate: '2024-08-12',
    description: 'Pelatihan teknis pengukuran tinggi badan, berat badan, LiLA, dan evaluasi IMT/U.',
    location: 'Ruang UKS SMAN 1 Kota Batu',
  },
  {
    id: 'ACT005',
    title: 'Workshop III — Masalah Kesehatan Remaja',
    category: 'workshop',
    activityDate: '2024-08-19',
    description: 'Edukasi pola hidup bersih sehat (PHBS), kebersihan reproduksi, dan kepatuhan minum TTD.',
    location: 'Aula SMAN 1 Kota Batu',
  },
  {
    id: 'ACT006',
    title: 'Workshop IV — Praktikum Skrining Kesehatan Remaja',
    category: 'skrining',
    activityDate: '2024-08-26',
    description: 'Praktik pendampingan skrining hemoglobin (Hb) dan pengukuran tekanan darah siswa.',
    location: 'Ruang UKS SMAN 1 Kota Batu',
  },
  {
    id: 'ACT007',
    title: 'Peresmian Kader SATRIA & Launching Website SANTARA',
    category: 'launching',
    activityDate: '2024-09-02',
    description: 'Pelantikan resmi Satuan Remaja Peduli Kesehatan (SATRIA) dan peluncuran portal SANTARA.',
    location: 'SMAN 1 Kota Batu',
  },
  {
    id: 'ACT008',
    title: 'Pengukuran Mandiri oleh Kader SATRIA & Monev Berkala',
    category: 'monev',
    activityDate: '2024-09-15',
    description: 'Pelaksanaan pemantauan antropometri dan kepatuhan TTD mingguan secara mandiri oleh kader.',
    location: 'SMAN 1 Kota Batu',
  },
];

/**
 * Storage Capability check
 */
export function isPhotoStorageReady(): boolean {
  return false; // Backend is Google Apps Script REST API without binary storage blob
}

/**
 * Upload Activity Documentation Handler
 */
export async function uploadActivityPhoto(
  file?: File | Blob,
  metadata?: Omit<ActivityPhoto, 'id'>
): Promise<ActivityUploadResult> {
  // Suppress unused param linter while retaining API signature
  void file;
  void metadata;
  // Honest feedback — do not fake storage
  return {
    success: false,
    code: 'STORAGE_NOT_CONFIGURED',
    message:
      'Penyimpanan berkas foto kegiatan belum dikonfigurasi pada server backend Google Apps Script. Fitur ini memerlukan integrasi cloud storage terpisah (misal Cloudinary/S3/Firebase).',
  };
}

/**
 * Fetch program activities
 */
export async function fetchActivityPhotos(): Promise<ActivityPhoto[]> {
  return OFFICIAL_PROGRAM_ACTIVITIES;
}
