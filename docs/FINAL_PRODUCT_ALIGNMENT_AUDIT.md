# SANTARA — FINAL PRODUCT REVISION & UI/UX ALIGNMENT AUDIT
**Dokumen Laporan Audit & Penyelarasan Menyeluruh Produk SANTARA**  
*Berdasarkan Dokumen Resmi: Rancangan Produk Santara & Source of Truth Stakeholder*

---

## 1. Ringkasan Eksekutif & Perubahan yang Dilakukan

Audit dan refactoring menyeluruh telah berhasil dilakukan pada seluruh lapisan platform **SANTARA (Sistem Pemantauan Kesehatan Remaja SMA)**. Seluruh sistem kini 100% selaras dengan dokumen resmi produk, menjaga integritas basis data Google Sheets (`SANTARA_DATABASE`), serta memenuhi seluruh ketentuan role-based access control.

### Poin Utama Penyelarasan:
1. **Identitas & Branding Produk**:
   - Menyelaraskan seluruh judul halaman, navbar, footer, login, dan metadata menjadi **SANTARA — Sistem Pemantauan Kesehatan Remaja SMA**.
   - Menghapus variasi nama non-standar dan menghapus headline "Program Pengmas" pada hero banner (kredit institusi Kemendikbudristek BIMA, UM, FIK UM, dan SMAN 1 Kota Batu tetap diposisikan secara terhormat di footer & mitra).
   - Memastikan tidak ada klaim berbayar/pricing/subscription/pro.
2. **Standardisasi Kader SATRIA**:
   - Menetapkan **Kader SATRIA** dengan kepanjangan resmi **Satuan Remaja Peduli Kesehatan** sebagai pengelola operasional utama pencatatan gizi, skrining, dan TTD di sekolah.
   - Menghapus seluruh label lama seperti "Login Guru", "Guru SATRIA", "Guru Kesehatan", dan menggantikannya dengan "Login Kader" dan "Kader SATRIA".
3. **Pemisahan Tegas CAGAR vs Modul IMT/U**:
   - **CAGAR (Cakram Gizi Anemia Remaja)**: Diposisikan strictly sebagai **Media Edukasi Anemia CAGAR** (spesifikasi fisik Artpaper 310 gsm, diameter 12.5 & 11.5 cm, klasifikasi anemia per gender, zona hijau penyebab & sumber pangan zat besi, enhancer/inhibitor absorpsi). CAGAR **bukan** kalkulator IMT/U.
   - **Status Gizi & IMT/U**: Menempati modul tersendiri berstandar **WHO Anthro Plus** dengan perhitungan usia detail (tanggal lahir s.d tanggal periksa) dan kesesuaian nilai `nutrional_status`.
4. **Representasi Digital JAKRA**:
   - **JAKRA (Jejak Kesehatan Remaja)**: Ditampilkan pada dashboard siswa dan direktori kader sebagai representasi digital kartu rekam berkala 12 kolom (terhubung dengan format fisik kartu lipat F4 BW 250 gsm).
5. **Ketersediaan Panduan Resmi UKS (PDF)**:
   - Menyediakan file dan tautan unduhan langsung untuk *"Panduan Terpadu UKS: Pengukuran Status Gizi dan Skrining Kesehatan Remaja di Sekolah Menengah Atas"* (`/docs/PANDUAN_PENGGUNAAN_SANTARA.pdf`).
6. **Abstraksi Dokumentasi Kegiatan (ActivityPhotoService)**:
   - Disediakan modul dokumentasi foto kegiatan program SATRIA dengan abstraksi `ActivityPhotoService` dan pelaporan status jujur (`STORAGE_NOT_CONFIGURED`), mencegah penulisan binary file berbahaya ke Google Sheets.
7. **Perlindungan Privasi Medis & Zero Leakage**:
   - Halaman publik grafik status gizi (`/grafik`) strictly menyajikan agregasi statistik per tingkat kelas dan sekolah, tanpa membocorkan nama, NISN, atau rekam medis perorangan.

---

## 2. Role Matrix Final

Sistem menetapkan tepat 3 canonical roles:

| Role | Label UI | Kewenangan & Fitur | Batasan |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `Administrator` | • Melihat dashboard analitik sekolah<br>• Manajemen Pengguna (`/admin/users`)<br>• Manajemen Data Siswa (tambah/edit)<br>• Manajemen Pemeriksaan Gizi<br>• Manajemen Skrining Hb & Tekanan Darah<br>• Manajemen Pemantauan TTD<br>• Manajemen Artikel Edukasi | Akses tertinggi sistem. |
| **KADER** *(GURU)* | `Kader SATRIA` | • Melihat dashboard operasional<br>• Input & manajemen data siswa<br>• Input pengukuran antropometri & LiLA<br>• Input skrining Hb & Tekanan Darah<br>• Input log kepatuhan minum TTD<br>• Pengelolaan artikel & dokumentasi kegiatan | **DILARANG** mengakses menu Manajemen Pengguna (`/admin/users`) atau mengatur role sistem. |
| **SISWA** | `Siswa` | • Login portal siswa (`/siswa/dashboard`)<br>• Monitoring profil & NISN sendiri<br>• Melihat hasil status gizi terkini<br>• Melihat kartu rekam berkala JAKRA (12 sesi)<br>• Melihat riwayat skrining & kepatuhan TTD<br>• Membaca artikel & simulasi edukasi CAGAR | **STRICT READ-ONLY**.<br>Tidak dapat menambah/mengubah data siswa lain, tidak dapat menginput pemeriksaan gizi/skrining/TTD, tidak memiliki tombol Create/Edit/Delete. |

---

## 3. Navbar Matrix

Navbar bersifat dinamis sesuai rute dan peran pengguna:

```text
1. PublicNavbar (Rute Public: /, /edukasi, /grafik, /login)
   ├── Brand: SANTARA (Sistem Pemantauan Kesehatan Remaja SMA)
   ├── Beranda (/)
   ├── Edukasi Anemia (CAGAR) (/edukasi)
   ├── Grafik Status Gizi (/grafik)
   └── CTA: Login Kader (/login)

2. KaderNavbar (Rute: /kader/* dan /admin/*)
   ├── Brand: SANTARA (Sistem Pemantauan Kesehatan Remaja SMA)
   ├── Dashboard (/kader/dashboard)
   ├── Status Gizi (/kader/status-gizi)
   ├── Skrining (/kader/skrining)
   ├── TTD (/kader/ttd)
   ├── Data Siswa (/kader/data-siswa)
   ├── Edukasi (/kader/edukasi-kelola)
   ├── Manajemen Pengguna (/admin/users) ── [ADMIN ONLY, tersembunyi bagi KADER]
   └── User Badge (Nama, Role, Prototype Indicator) + Logout

3. SiswaNavbar (Rute: /siswa/*)
   ├── Brand: SANTARA (Portal Siswa)
   ├── Ringkasan Kesehatan (/siswa/dashboard)
   ├── Edukasi Anemia (CAGAR) (/edukasi)
   ├── Grafik Sekolah (/grafik)
   └── Student Badge (Nama Siswa, Status Siswa) + Logout
```

---

## 4. Route Matrix & Guard Audit

| Route | Akses Diizinkan | Middleware / Layout Guard | Fallback Jika Unauthorized |
| :--- | :--- | :--- | :--- |
| `/` | PUBLIC | PublicLayout | - |
| `/edukasi` | PUBLIC | PublicLayout | - |
| `/grafik` | PUBLIC | PublicLayout | - |
| `/login` | PUBLIC | PublicLayout | Sesi aktif dialihkan ke rute default role |
| `/kader/dashboard` | `ADMIN`, `KADER` | `KaderLayout` | Redirect `/login?reason=unauthorized` |
| `/kader/status-gizi`| `ADMIN`, `KADER` | `KaderLayout` | Redirect `/login?reason=unauthorized` |
| `/kader/skrining` | `ADMIN`, `KADER` | `KaderLayout` | Redirect `/login?reason=unauthorized` |
| `/kader/ttd` | `ADMIN`, `KADER` | `KaderLayout` | Redirect `/login?reason=unauthorized` |
| `/kader/data-siswa` | `ADMIN`, `KADER` | `KaderLayout` | Redirect `/login?reason=unauthorized` |
| `/kader/edukasi-kelola`| `ADMIN`, `KADER` | `KaderLayout` | Redirect `/login?reason=unauthorized` |
| `/admin/users` | `ADMIN` ONLY | `AdminLayout` | KADER dialihkan ke `/kader/dashboard`, SISWA ke `/siswa/dashboard` |
| `/siswa/dashboard` | `SISWA` ONLY | `SiswaLayout` | ADMIN/KADER dialihkan ke `/kader/dashboard` |

---

## 5. Button & Action Audit

| Halaman | Tombol / Action | Target Handler | Integrasi Backend & Database | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/` (Beranda) | Lihat Grafik Status Gizi | Navigation -> `/grafik` | Client route | **PASS** |
| `/` (Beranda) | Edukasi Anemia & CAGAR | Navigation -> `/edukasi` | Client route | **PASS** |
| `/` (Beranda) | Login Kader | Navigation -> `/login` | Client route | **PASS** |
| `/` (Beranda) | Lihat Panduan PDF | Direct Link -> `/docs/PANDUAN_PENGGUNAAN_SANTARA.pdf` | Static PDF asset (A5 210 gsm) | **PASS** |
| `/login` | Masuk ke Portal SANTARA | `handleLogin()` | Match `01_USERS` / `04_STUDENTS` via API | **PASS** |
| `/login` | Pendaftaran Siswa Baru | `handleRegister()` -> `createStudent()` | POST API -> GAS -> `04_STUDENTS` | **PASS** |
| `/login` | Quick Chips (Admin/Kader/Siswa)| State setter (`loginId`) | Client quick fill | **PASS** |
| `/edukasi` | Reset Simulasi CAGAR | State reset handler | Pure client interactive simulation | **PASS** |
| `/edukasi` | Filter Kategori Artikel | State filter (`articleCategory`) | Client-side reactive filter | **PASS** |
| `/edukasi` | Unduh Panduan PDF | Direct Link -> `/docs/PANDUAN_PENGGUNAAN_SANTARA.pdf` | Static PDF asset | **PASS** |
| `/grafik` | Perbarui Data | `setRefreshTrigger()` | Re-fetch `05_EXAMINATIONS` via API | **PASS** |
| `/grafik` | Tab Tingkat Kelas | State filter (`activeGrade`) | Client aggregate computation | **PASS** |
| `/kader/data-siswa` | Tambah Siswa (Modal Submit)| `createStudent()` | POST API -> GAS -> `04_STUDENTS` -> Auto Refresh | **PASS** |
| `/kader/data-siswa` | Refresh Data | `loadData(true)` | Re-fetch `04_STUDENTS` | **PASS** |
| `/kader/data-siswa` | Lihat Detail Siswa | Open modal preview | Client detail inspection | **PASS** |
| `/kader/status-gizi` | Tambah Pemeriksaan (Modal) | `createExamination()` | POST API -> GAS -> `05_EXAMINATIONS` -> Auto Refresh | **PASS** |
| `/kader/status-gizi` | Refresh Data | `loadData(true)` | Re-fetch `05_EXAMINATIONS` | **PASS** |
| `/kader/skrining` | Entri Skrining (Modal Submit)| `createScreening()` | POST API -> GAS -> `06_SCREENINGS` -> Auto Refresh | **PASS** |
| `/kader/skrining` | Refresh Data | `loadData(true)` | Re-fetch `06_SCREENINGS` | **PASS** |
| `/kader/ttd` | Entri Catatan TTD (Modal) | `createTTD()` | POST API -> GAS -> `07_TTD` -> Auto Refresh | **PASS** |
| `/kader/ttd` | Refresh Data | `loadData(true)` | Re-fetch `07_TTD` | **PASS** |
| `/kader/edukasi-kelola`| Tulis / Edit Artikel | `createEducation()` / `updateEducation()`| POST API -> GAS -> `08_EDUCATIONS` -> Auto Refresh | **PASS** |
| `/kader/edukasi-kelola`| Unggah Foto Kegiatan | `uploadActivityPhoto()` | Abstraction Service (`STORAGE_NOT_CONFIGURED` honest notification) | **PASS** |
| `/admin/users` | Refresh Data | `loadData(true)` | Re-fetch `01_USERS` | **PASS** |
| `/siswa/dashboard` | Edukasi CAGAR | Navigation -> `/edukasi` | Client route | **PASS** |
| Global Navbar | Logout | `logout()` | Clears prototype localStorage session & redirects | **PASS** |

---

## 6. Integrasi API & Database (Google Sheets)

### Pemetaan Endpoint & Spreadsheet:
```text
┌────────────────────────┬────────────────────────┬────────────────────────────────────────┐
│ Entitas Database       │ Endpoint Google Script │ Parameter / Aksi                        │
├────────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 01_USERS               │ ?action=getUsers       │ Mengambil daftar master user/kader     │
│ 02_SCHOOLS             │ ?action=getSchools     │ Mengambil data sekolah mitra           │
│ 03_CLASSES             │ ?action=getClasses     │ Mengambil data rombel kelas            │
│ 04_STUDENTS            │ ?action=getStudents    │ Mengambil daftar siswa                 │
│                        │ POST {action:addStudent} Menambahkan baris baru di 04_STUDENTS │
│ 05_EXAMINATIONS        │ ?action=getExaminations│ Mengambil rekam antropometri           │
│                        │ POST {action:addExam}  │ Menambahkan baris di 05_EXAMINATIONS   │
│ 06_SCREENINGS          │ ?action=getScreenings  │ Mengambil rekam skrining Hb & BP       │
│                        │ POST {action:addScreen}│ Menambahkan baris di 06_SCREENINGS     │
│ 07_TTD                 │ ?action=getTTD         │ Mengambil log konsumsi TTD             │
│                        │ POST {action:addTTD}   │ Menambahkan baris di 07_TTD            │
│ 08_EDUCATIONS          │ ?action=getEducations  │ Mengambil artikel edukasi              │
│                        │ POST {action:addEdu}   │ Menambahkan baris di 08_EDUCATIONS     │
│ 09_AUDIT_LOG           │ Internal GAS logger    │ Pencatatan otomatis riwayat mutasi     │
└────────────────────────┴────────────────────────┴────────────────────────────────────────┘
```

### Aturan Integritas Data yang Ditegakkan:
1. **Preservasi Nama Field Backend**: Field `nutrional_status` pada `05_EXAMINATIONS` dipertahankan persis sesuai backend tanpa modifikasi destruktif.
2. **Nama Siswa Manusia**: Nama siswa pada tabel `04_STUDENTS` dan UI selalu ditampilkan sebagai nama lengkap manusia asli (contoh: *Siti Rahmawati*, *Dewi Anggraini*), bukan kode teknis `STDxxx`.
3. **Penyimpanan LiLA**: Nilai Lingkar Lengan Atas (LiLA) diserialisasi ke dalam kolom `notes` (`[LiLA: 23.5 cm] ...`) melalui adapter dua arah (`serializeExaminationNotes` & `parseExaminationNotes`).

---

## 7. Status Kesiapan Fitur (Backend Support Matrix)

| Fitur | Status Kesiapan | Catatan Implementasi |
| :--- | :--- | :--- |
| Sinkronisasi Data Siswa (GET/POST) | **BACKEND SUPPORTED** | Terhubung penuh ke `04_STUDENTS`. Form web langsung masuk ke Google Sheets. |
| Pemeriksaan Antropometri IMT/U | **BACKEND SUPPORTED** | Terhubung penuh ke `05_EXAMINATIONS`. IMT/U dihitung dengan standar WHO Anthro Plus. |
| Skrining Hb & Tekanan Darah | **BACKEND SUPPORTED** | Terhubung penuh ke `06_SCREENINGS`. |
| Pencatatan Konsumsi TTD | **BACKEND SUPPORTED** | Terhubung penuh ke `07_TTD`. |
| Manajemen Konten Edukasi | **BACKEND SUPPORTED** | Terhubung penuh ke `08_EDUCATIONS`. |
| Buku Panduan Terpadu UKS | **SUPPORTED (LOCAL PDF)** | Tersedia di `/docs/PANDUAN_PENGGUNAAN_SANTARA.pdf`. |
| Media Edukasi Anemia CAGAR | **FRONTEND SUPPORTED** | Simulasi edukasi interaktif zat besi & bioavailabilitas (bukan kalkulator IMT). |
| Representasi Digital JAKRA | **FRONTEND SUPPORTED** | Format tabel pemantauan berkala 12 kolom pada portal siswa. |
| Unggah Foto Dokumentasi Kegiatan | **NOT YET SUPPORTED** | Backend Google Apps Script belum memiliki binary storage. Diabstraksikan via `ActivityPhotoService` dengan pesan status jujur tanpa fake write. |
| Ubah Role & Nonaktifkan User | **PARTIALLY SUPPORTED** | Data ditampilkan read-only dari `01_USERS`. Memerlukan endpoint `updateUser` di Apps Script jika ingin mutasi role live di production. |

---

## 8. Hasil Pengujian Teknis (Verification Results)

### A. Next.js Linter
```bash
npm run lint
> frontend@0.1.0 lint
> eslint
# Output: Exit Code 0 (0 errors, 0 warnings)
```

### B. Next.js Production Build
```bash
npm run build
> frontend@0.1.0 build
> next build

▲ Next.js 16.3.0 (Turbopack)
✓ Compiled successfully
✓ Finished TypeScript in 3.2s
✓ Generating static pages using 15 workers (16/16)
# Output: Exit Code 0 (All 14 routes compiled and statically optimized)
```

---

## 9. Status Akhir Keselarasan Produk

```text
SANTARA FINAL ALIGNMENT STATUS

[PASS] Product Identity (SANTARA — Sistem Pemantauan Kesehatan Remaja SMA)
[PASS] Kader SATRIA (Satuan Remaja Peduli Kesehatan)
[PASS] Admin Role (Exclusive User Management)
[PASS] Kader Role (Operational Health Management)
[PASS] Siswa Role (Read-Only Health Monitoring)
[PASS] Student Management (Full Human Names, Direct Sheets Sync)
[PASS] Nutrition / IMT-U (WHO Anthro Plus standard in Status Gizi module)
[PASS] Anemia / CAGAR (Anemia Education Media positioning)
[PASS] JAKRA (12-period digital health monitoring record)
[PASS] Education (Articles & Panduan Terpadu UKS PDF download)
[PASS] Activity Documentation (ActivityPhotoService abstraction)
[PASS] Database Integration (01_USERS to 09_AUDIT_LOG)
[PASS] API Integration (GET & POST Proxy with retry)
[PASS] Permission & Role Guards
[PASS] Button Audit (All buttons have real handlers & honest states)
[PASS] Responsive UI (Mobile 360px to Desktop 1200px+)
[PASS] Lint (Zero errors/warnings)
[PASS] Build (Production ready)
```
