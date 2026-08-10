# SANTARA — PHASE 2 FRONTEND IMPLEMENTATION PLAN
**Arsitektur, Desain Sistem, dan Rencana Eksekusi Frontend Next.js**
*Sistem Pemantauan Kesehatan Remaja SMA (SANTARA)*  
*Status: Pre-Coding Architecture Lock*  
*Date: 2026-08-10*  
*Constraint: Backend Frozen | Zero Backend Modifications*

---

## 1. Existing Project Structure

```
WEB SANTARA/SANTARA/
├── .clasp.json                  # Google Apps Script configuration
├── .claspignore                 # Clasp sync filter (isolates backend files)
├── appsscript.json              # Apps Script manifest
├── Kode.js                      # Production REST API v2.0 (1.489 lines, 13 sections)
├── backupKode.js                # Initial legacy backup
├── FINAL_PRE_PHASE2_AUDIT.md    # Pre-Phase 2 Audit Gate Report (Score 99/100)
├── Rancangan Produk Santara.docx# Official product & UI/UX requirements
├── Logo/                        # Original institutional & partner assets
├── docs/                        # Architecture & audit documents
│   ├── API_CAPABILITY_MATRIX.md # Mapping requirement to backend capability
│   ├── PHASE_2_GAP_ANALYSIS.md  # Comprehensive requirement & gap analysis
│   └── PRODUCT_DESIGN_SPEC.md   # Design system tokens & visual specifications
└── frontend/                    # Next.js 16 App Router Foundation
    ├── .env.local               # NEXT_PUBLIC_SANTARA_API_URL configured
    ├── .env.example             # Template env
    ├── package.json             # Next.js 16, React 19, TypeScript 5, Tailwind CSS v4
    ├── tsconfig.json            # Path alias configured ("@/*": ["./src/*"])
    ├── public/logos/            # BIMA, UM, FIK, SDGs, SMAN 1 Batu assets
    └── src/
        └── app/                 # App Router root layout & global styles
```

---

## 2. Proposed Frontend Architecture

Frontend dibangun dengan arsitektur modular yang memisahkan lapisan API, data adapter, UI komponen, layout shell, dan state manajemen:

```
frontend/src/
├── app/                         # App Router (Pages & Route Handlers)
│   ├── layout.tsx               # Root layout (Fonts, Meta, Session Provider)
│   ├── globals.css              # Design tokens, custom scrollbars, animations
│   ├── page.tsx                 # [Public] Home / Hero / Ringkasan Program
│   ├── edukasi/                 # [Public] Informasi Anemia & Media CAGAR Online
│   │   └── page.tsx
│   ├── grafik/                  # [Public] Grafik Status Gizi Agregat (Kelas 10, 11, 12)
│   │   └── page.tsx
│   ├── login/                   # [Auth] Halaman Login / Kader Profile Switcher
│   │   └── page.tsx
│   └── kader/                   # [Kader Protected Area]
│       ├── layout.tsx           # Kader shell (Navbar Kader, Breadcrumbs, Guard)
│       ├── dashboard/           # Dashboard utama kader & ringkasan metrik
│       │   └── page.tsx
│       ├── status-gizi/         # Entri & riwayat antropometri (TB, BB, IMT, LiLA)
│       │   └── page.tsx
│       ├── skrining/            # Entri & riwayat skrining Hb & Tekanan Darah
│       │   └── page.tsx
│       ├── ttd/                 # Pencatatan kepatuhan minum Tablet Tambah Darah
│       │   └── page.tsx
│       ├── data-siswa/          # Direktori siswa per kelas & kartu digital JAKRA
│       │   └── page.tsx
│       └── edukasi-kelola/      # Manajemen artikel & konten edukasi
│           └── page.tsx
│
├── components/                  # UI Component Library
│   ├── ui/                      # Base Atoms (Design System)
│   │   ├── Button.tsx           # Primary, Secondary, Outline, Danger, Loading state
│   │   ├── Card.tsx             # Medical clean cards, header, body, stats card
│   │   ├── Badge.tsx            # Status gizi WHO (Severely Thinness..Obese), Active/Inactive
│   │   ├── Input.tsx            # Form inputs, touch-friendly mobile fields
│   │   ├── Select.tsx           # Filter dropdowns & class selector
│   │   ├── Table.tsx            # Responsive data table with mobile card fallback
│   │   ├── Modal.tsx            # Dialog confirmation & action modals
│   │   ├── Alert.tsx            # Inline notice (Info, Warning, Error, Success)
│   │   ├── LoadingState.tsx     # Skeleton loaders, medical pulse spinner
│   │   ├── EmptyState.tsx       # Illustrated clean empty state
│   │   └── ErrorState.tsx       # User-friendly error box with retry button
│   │
│   ├── shell/                   # Navigation & Layout Organisms
│   │   ├── PublicNavbar.tsx     # Navbar Publik (Beranda, Edukasi, Grafik, Login)
│   │   ├── KaderNavbar.tsx      # Navbar Kader (Dashboard, Gizi, Skrining, TTD, Siswa, Logout)
│   │   ├── Footer.tsx           # Footer mitra resmi (BIMA, UM, FIK, SDGs, SMAN 1 Batu)
│   │   └── MobileNav.tsx        # Responsive mobile drawer / bottom sheet
│   │
│   ├── charts/                  # Visual Data Display
│   │   ├── NutritionBarChart.tsx# Diagram batang distribusi gizi per kelas (Recharts/SVG)
│   │   ├── BmiGauge.tsx         # WHO Anthro Plus BMI indicator gauge
│   │   └── TtdComplianceChart.tsx # Grafik kepatuhan konsumsi TTD mingguan
│   │
│   └── interactive/             # Media Interaktif Edukasi
│       ├── CagarDisk.tsx        # Simulasi interaktif Cakram CAGAR (Anemia & Zat Besi)
│       └── JakraCardView.tsx    # Tampilan visual kartu fisik JAKRA F4
│
├── context/                     # Application State
│   └── SessionContext.tsx       # Active Kader Profile, Role Guard, Client Session
│
├── hooks/                       # Custom React Hooks
│   ├── useStudents.ts           # Fetch & mutate students data
│   ├── useExaminations.ts       # Fetch & mutate nutrition examination data
│   ├── useScreenings.ts         # Fetch & mutate health screenings
│   ├── useTTD.ts                # Fetch & mutate TTD consumption logs
│   ├── useEducations.ts         # Fetch & mutate educational articles
│   └── useMasterData.ts         # Fetch schools & classes with placeholder filter
│
├── lib/                         # Core Utilities & API Client
│   ├── api/                     # Centralized Typed API Client
│   │   ├── client.ts            # Base HTTP wrapper (302 redirect, JSON parse, errors)
│   │   ├── students.ts          # getStudents, createStudent, updateStudent, archiveStudent
│   │   ├── examinations.ts      # getExaminations, createExamination, updateExamination
│   │   ├── screenings.ts        # getScreenings, createScreening, updateScreening
│   │   ├── ttd.ts               # getTTD, createTTD, updateTTD
│   │   ├── educations.ts        # getEducations, createEducation, updateEducation
│   │   ├── schools.ts           # getSchools
│   │   ├── classes.ts           # getClasses
│   │   ├── users.ts             # getUsers
│   │   └── index.ts             # Unified API entry
│   │
│   ├── adapters/                # Backend Compatibility Adapters
│   │   ├── examinationAdapter.ts# LiLA serializer & parser to/from `notes`
│   │   ├── screeningAdapter.ts  # Hb & BP structured formatter to/from `result`
│   │   └── studentAdapter.ts    # Fallback school name & dynamic age calculator
│   │
│   └── utils/                   # Helper Functions
│       ├── analytics.ts         # Class aggregation, status distribution, risk calculator
│       ├── formatters.ts        # Indonesian date formatting, BMI rounding
│       ├── whoStandards.ts      # WHO Anthro Plus classification & color resolver
│       └── cn.ts                # Tailwind class merger
│
└── types/                       # Strict TypeScript Definitions
    ├── api.ts                   # ApiResponse<T>, ApiListResponse<T>, ApiError
    ├── models.ts                # Student, Examination, Screening, TTD, Education, etc.
    └── ui.ts                    # UI status, filter params, form state types
```

---

## 3. API Architecture & Client Abstraction

Seluruh komunikasi dengan Google Apps Script Web App dipusatkan pada `/src/lib/api/client.ts`. Komponen UI **DILARANG KERAS** memanggil `fetch()` langsung.

### A. Base Request Handler (`client.ts`)
```typescript
// Fitur Utama:
// 1. Menggunakan NEXT_PUBLIC_SANTARA_API_URL
// 2. Mendukung parameter redirect: 'follow' (Mengatasi 302 redirect Apps Script)
// 3. Serialisasi query string untuk GET (?action=...&param=...)
// 4. Pengiriman body JSON untuk POST ({ action: "...", data: { ... } })
// 5. Normalisasi error: Network failure, timeout, HTTP non-200, format non-JSON, dan backend exception
```

### B. Typed Endpoint Modules
- `students.ts`: `fetchStudents()`, `createStudent()`, `updateStudent()`, `archiveStudent()`
- `examinations.ts`: `fetchExaminations()`, `createExamination()`, `updateExamination()`
- `screenings.ts`: `fetchScreenings()`, `createScreening()`, `updateScreening()`
- `ttd.ts`: `fetchTTD()`, `createTTD()`, `updateTTD()`
- `educations.ts`: `fetchEducations()`, `createEducation()`, `updateEducation()`
- `schools.ts`: `fetchSchools()`
- `classes.ts`: `fetchClasses()`
- `users.ts`: `fetchUsers()`

---

## 4. Data Models (Strict TypeScript Definitions)

```typescript
// Field `nutrional_status` WAJIB dipertahankan persis sesuai backend.
export type NutritionStatusCategory = 
  | 'Severely Thinness'
  | 'Thinness'
  | 'Normal'
  | 'Overweight'
  | 'Obese';

export interface Student {
  id: string;
  school_id: string;
  class_id: string;
  student_code: string;
  nama: string;
  gender: 'L' | 'P';
  birth_date: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Examination {
  id: string;
  student_id: string;
  class_id: string;
  examination_date: string;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  nutrional_status: string; // EXACT BACKEND NAME
  examiner_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Screening {
  id: string;
  student_id: string;
  class_id: string;
  screening_date: string;
  screening_type: string; // 'Anemia' | 'Tekanan Darah' | 'Umum'
  result: string;
  notes: string;
  examiner_id: string;
  created_at: string;
  updated_at: string;
}

export interface TTDRecord {
  id: string;
  student_id: string;
  class_id: string;
  consumption_date: string;
  consumed: boolean | string;
  quantity: number;
  recorded_by: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface EducationArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  thumbnail_url: string;
  status: 'draft' | 'published' | string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  status: string;
  created_at: string;
}

export interface ClassRoom {
  id: string;
  school_id: string;
  address: string;
  academic_year: string;
  grade: number | string;
  class_name: string;
  status: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'kader' | 'admin' | string;
  school_id: string;
  class_id: string;
  status: string;
  created_at: string;
}
```

---

## 5. Routing Architecture & Page Map

```
/ (Root)
│
├── [PUBLIC ROUTES] (Tanpa Autentikasi / Bebas Akses)
│   ├── /                 -> Home / Hero / Penjelasan Program SANTARA & SATRIA
│   ├── /edukasi          -> Informasi Anemia, Gejala 5L, Cakram CAGAR Online
│   ├── /grafik           -> Grafik Status Gizi Agregat Publik (Kelas 10, 11, 12)
│   └── /login            -> Pemilihan Profil Kader SATRIA (Prototype Session)
│
└── [KADER ROUTES] (Protected by SessionContext)
    └── /kader
        ├── /dashboard    -> Statistik Ringkasan Sekolah, Alert Gizi, Aktivitas Terbaru
        ├── /status-gizi  -> Form Entri Antropometri (TB/BB/IMT) & Riwayat Siswa
        ├── /skrining     -> Form Entri Kadar Hb & Tekanan Darah
        ├── /ttd          -> Form Pencatatan Konsumsi Bersama Tablet Tambah Darah
        ├── /data-siswa   -> Direktori Siswa Per Kelas & Kartu Digital JAKRA
        └── /edukasi-kelola -> Manajemen Artikel Edukasi
```

---

## 6. Public vs Kader Privacy & Security Strategy

| Dimensi Data | Halaman Publik (`/`, `/edukasi`, `/grafik`) | Area Kader (`/kader/*`) |
|---|---|---|
| **Nama Siswa** | **STRICTLY HIDDEN** (Tidak Pernah Ditampilkan) | **VISIBLE** (Untuk keperluan pendataan UKS) |
| **NIS / Kode Siswa** | **STRICTLY HIDDEN** | **VISIBLE** |
| **Tanggal Lahir / Umur** | **STRICTLY HIDDEN** | **VISIBLE** |
| **Hasil Rekam Medis Personal** | **STRICTLY HIDDEN** | **VISIBLE** (Diakses oleh kader pemeriksa) |
| **Grafik Distribusi Gizi** | **AGGREGATED ONLY** (Total siswa per kategori per kelas) | **DETAILED** (Bisa klik untuk melihat daftar siswa berisiko) |
| **Kepatuhan TTD** | **AGGREGATED ONLY** (Persentase kepatuhan tingkat sekolah) | **PER SISWA** (Daftar siswa yang sudah/belum minum) |

---

## 7. Compatibility Adapters (Handling Backend Limitations)

### A. Pengukuran LiLA (`examinationAdapter.ts`)
- **Tantangan**: Database `05_EXAMINATIONS` tidak memiliki kolom `lila_cm`.
- **Solusi**: Form UI menyediakan input `LiLA (cm)`. Saat disimpan ke API, helper `serializeExaminationForApi` menggabungkan nilai LiLA ke dalam field `notes` secara terstandarisasi:
  ```
  notes = "LiLA: 23.5 cm | " + userNotes
  ```
- Saat membaca data, helper `parseExaminationFromApi` mengekstrak nilai LiLA secara otomatis via regex `LiLA:\s*([\d.]+)\s*cm`.

### B. Skrining Hb & Tekanan Darah (`screeningAdapter.ts`)
- **Tantangan**: Database `06_SCREENINGS` menggunakan kolom generik `result`.
- **Solusi**: Helper `formatScreeningResult` menata nilai input numerik menjadi format terstruktur:
  - Anemia: `"Hb 12.5 g/dL (Normal)"`
  - Tekanan Darah: `"110/70 mmHg (Normal)"`

### C. Data Placeholder Kelas (`useMasterData.ts`)
- **Tantangan**: Record `CLS002`–`CLS015` pada `03_CLASSES` belum memiliki nama kelas.
- **Solusi**: Dropdown kelas UI memfilter kelas yang valid:
  ```typescript
  const validClasses = classes.filter(c => c.class_name && c.class_name.trim() !== '');
  ```

### D. Relasi Siswa Legacy `STD002` -> `SCH002`
- **Tantangan**: Master sekolah saat ini hanya memiliki record `SCH001`.
- **Solusi**: Helper `resolveSchoolName(student.school_id)` menghasilkan fallback `"Sekolah SCH002 (Belum Terdaftar)"` tanpa menyebabkan crash/blank screen.

---

## 8. Authentication & Session Strategy (Phase 2 Prototype)

- **Kondisi Backend**: Backend Phase 1 belum mengimplementasikan endpoint authentication dan password hashing.
- **Strategi Phase 2**:
  - Disediakan `SessionContext` yang membaca daftar pengguna aktif dari `getUsers`.
  - Halaman login memungkinkan pemilihan profil Kader SATRIA aktif (`USR001`).
  - Sesi disimpan pada `localStorage` browser.
  - Ditampilkan watermark/badge pengingat pengembangan: `[PROTOTYPE SESSION — AUTH BACKEND REQUIRED FOR PRODUCTION]`.
  - Logout membersihkan session lokal dan mengarahkan kembali ke halaman publik.

---

## 9. Design System Tokens & Aesthetics

- **Primary Brand (Santara Sky Tech)**:
  - `#0ea5e9` (Sky-500)
  - `#0284c7` (Sky-600 - Main Accent)
  - `#0369a1` (Sky-700)
  - `#0c4a6e` (Sky-900)
- **Secondary Medical Accents**:
  - `#1e40af` (Medical Blue)
  - `#f43f5e` (Rose/Pink Alert Remaja Putri)
  - `#c2410c` (Warm Ochre Title Display)
- **Status Gizi Standar WHO Anthro Plus**:
  - **Severely Thinness**: `#7c3aed` (Purple)
  - **Thinness**: `#0284c7` (Sky Blue)
  - **Normal**: `#10b981` (Emerald Green)
  - **Overweight**: `#f59e0b` (Amber Orange)
  - **Obese**: `#ef4444` (Crimson Red)
- **Visual Feel**: Clean, Medical, Trustworthy, Educational, Youthful. Tidak berlebihan gradien, struktur card berhirarki tegas, font terbaca jelas (*Plus Jakarta Sans* / *Outfit*).

---

## 10. Responsive & Mobile-First Strategy

- **Breakpoint**:
  - `Mobile (360px - 480px)`: **Prioritas Utama Kader**. Single-column layout, touch-target tombol minimal 48px, sticky bottom action bar pada form entri medis, minimalisasi ketikan teks (banyak opsi klik/stepper).
  - `Tablet (768px - 1024px)`: Two-column grid, compact summary table.
  - `Desktop (1200px+)`: Full analytical dashboard, sidebar/navbar lebar, perbandingan grafik antar kelas.

---

## 11. State Management & Error Handling

Setiap halaman dan komponen data wajib mengimplementasikan 5 State UI:
1. **Loading State**: Medical pulse shimmer skeleton, tidak membekukan antarmuka.
2. **Empty State**: Ilustrasi ramah & panduan tindakan (misal: "Belum ada riwayat pemeriksaan untuk kelas ini").
3. **Error State**: Box pesan informatif dalam Bahasa Indonesia dengan tombol **"Coba Lagi"** (*Retry*), menerjemahkan kode error backend (`USER_NOT_FOUND`, `CLASS_NOT_FOUND`, `INVALID_JSON`) menjadi bahasa yang mudah dipahami.
4. **Success State**: Toast notifikasi konfirmasi entri berhasil disimpan.
5. **Refreshing State**: Indikator pembaruan data di latar belakang (*background fetch*).

---

## 12. Implementation Sequence (Rencana Bertahap)

```
============================================================
PHASE 2A: FOUNDATION & DESIGN SYSTEM (CURRENT TARGET)
============================================================
1. Setup TypeScript Models & Response Types (`src/types/`)
2. Setup API Client Layer (`src/lib/api/`)
3. Setup Compatibility Adapters & Utilities (`src/lib/adapters/`, `src/lib/utils/`)
4. Setup Base UI Atoms (`Button`, `Card`, `Badge`, `Input`, `Alert`, `LoadingState`, `EmptyState`, `ErrorState`)
5. Setup Application Shells (`PublicNavbar`, `KaderNavbar`, `Footer`, `MobileNav`)
6. Setup `SessionContext` & Prototype Auth Provider

============================================================
PHASE 2B: PUBLIC MODULES & KADER DASHBOARD
============================================================
7. Public Home Page (`/`)
8. Public Education Page with CAGAR Interactive (`/edukasi`)
9. Public Nutrition Chart Aggregated (`/grafik`)
10. Login / Profile Selection Page (`/login`)
11. Kader Dashboard Overview (`/kader/dashboard`)

============================================================
PHASE 2C: KADER CLINICAL & UKS MODULES
============================================================
12. Direktori Data Siswa & JAKRA Digital Card (`/kader/data-siswa`)
13. Form Entri & Riwayat Pemeriksaan Status Gizi (`/kader/status-gizi`)
14. Form Entri Skrining Kesehatan Hb & Tekanan Darah (`/kader/skrining`)
15. Form Pencatatan Kepatuhan Konsumsi TTD (`/kader/ttd`)
16. Manajemen Konten Edukasi (`/kader/edukasi-kelola`)

============================================================
PHASE 2D: INTEGRATION, VERIFICATION & BUILD
============================================================
17. End-to-End Live API Testing with Production Apps Script
18. Responsive Cross-Device Testing (Mobile 360px s.d. Desktop 1440px)
19. Next.js Production Build Verification (`npm run build`)
20. Final Delivery & Walkthrough
```

---
*Dokumen ini mengunci seluruh spesifikasi teknis Frontend SANTARA Phase 2.*
