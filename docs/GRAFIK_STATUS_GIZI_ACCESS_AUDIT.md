# LAPORAN AUDIT AKSES KONTROL & GRAFIK STATUS GIZI (BAR CHART)
**SANTARA — Sistem Pemantauan Kesehatan Remaja SMA**  
*Dokumen Audit Proteksi Halaman, Otorisasi Multi-Role, Agregasi Kelas 10/11/12, dan Transformasi Grafik Batang*  
*Tanggal: 18 Agustus 2026*  

---

## 1. Arsitektur Otentikasi & Sesi (Current Authentication Architecture)

- **Mekanisme Otentikasi**: Client-Side Session State Management dengan `SessionContext` berbasis `useSyncExternalStore` (Hydration-Safe) dan sinkronisasi basis data `01_USERS` melalui API Google Apps Script.
- **Marker Keamanan**: `PROTOTYPE AUTHORIZATION — PRODUCTION AUTH BACKEND REQUIRED`.
- **Enforcement Otorisasi**: Proteksi route guard berlapis ganda:
  1. *Layer 1 (Context Guard)*: `SessionContext` memvalidasi sesi aktif pada setiap transisi pathname URL.
  2. *Layer 2 (Component Guard)*: Halaman `/grafik` memverifikasi status `isAuthenticated` dan `isReady` sebelum memuat data dari API backend.

---

## 2. Matriks Otorisasi Peran (Role Matrix)

| Role Pengguna | Akses `/grafik` (Grafik Status Gizi) | Akses `/kader/*` (Input Data) | Akses `/admin/*` (Kelola Kader) | Status Otorisasi |
| :--- | :---: | :---: | :---: | :---: |
| **KEPALA_SEKOLAH** | **ALLOW** | **ALLOW** | **ALLOW** (Istimewa) | **PASS** |
| **KADER (SATRIA)** | **ALLOW** | **ALLOW** | **DENY** | **PASS** |
| **ADMIN** | **ALLOW** | **ALLOW** | **ALLOW** | **PASS** |
| **PUBLIC / GUEST** | **DENY (Redirect ke `/login`)** | **DENY** | **DENY** | **PASS** |

---

## 3. Proteksi Rute (Route Protection)

- **Alur Intersepsi**:
  ```
  Pengguna Publik Membuka /grafik
           │
           ▼
  Verifikasi Sesi (SessionContext & Component Guard)
           │
     ┌─────┴─────┐
     ▼           ▼
  [Tidak Ada Sesi]  [Sesi Valid: KADER / KEPALA_SEKOLAH]
     │           │
     ▼           ▼
  Redirect       Izinkan Akses & Fetch Data
  ke /login      Grafik Batang (/grafik)
  ```
- **Kondisi Tanpa Sesi**: Akses ditolak secara otomatis dan diarahkan ke `/login` tanpa mengeksekusi fetch data privat dari Google Sheets.

---

## 4. Perubahan Database & Google Sheets (`03_CLASSES`)

- **Kepatuhan Schema**: Relasi `02_SCHOOLS` → `03_CLASSES` → `04_STUDENTS` → `05_EXAMINATIONS` terverifikasi utuh tanpa *orphan records*.
- **Dukungan Tingkat Kelas**: Skema `03_CLASSES` mendukung rombel Kelas 10, Kelas 11, dan Kelas 12 (e.g. `CLS001` - `CLS006`).
- **Integritas Kontrak**: Field backend `nutrional_status` dipertahankan 100% tanpa modifikasi nama kolom.

---

## 5. Data Kelas Sebelum & Sesudah (Class Data Before / After)

| Parameter | Sebelum Revisi | Sesudah Revisi |
| :--- | :--- | :--- |
| **Dukungan Rombel** | Dinamis terbatas (Kelas 10 A) | **Tingkat Kelas 10, 11, dan 12** teragregasi otomatis dari database. |
| **Filter Tab** | Tab statis campuran | **Tab Dinamis** ("Semua Tingkat (Gabungan)", "Kelas 10", "Kelas 11", "Kelas 12") yang adaptif terhadap isi database. |
| **Empty State Kelas** | Berpotensi crash jika data 0 | **Empty State Bersih**: Menampilkan keterangan jelas *"Kelas X — Belum Ada Data Pemeriksaan"* tanpa manipulasi data dummy. |

---

## 6. Aliran Data API (API Data Flow)

```
03_CLASSES (Master Kelas)
04_STUDENTS (Master Siswa)
05_EXAMINATIONS (Pemeriksaan Gizi)
07_TTD (Kepatuhan Tablet Tambah Darah)
          │
          ▼
   Centralized API Client (`frontend/src/lib/api`)
          │
          ▼
   Aggregation Adapter (Grade & Nutrition Aggregation)
          │
          ▼
   NutritionBarChart Component (Render Pure SVG/CSS)
          │
          ▼
   Antarmuka Kader SATRIA & Kepala Sekolah
```

---

## 7. Logika Agregasi Grafik Batang (Chart Aggregation Logic)

1. **Mapping Kelas**: Setiap pemeriksaan antropometri dipetakan ke tingkat kelas (`10`, `11`, `12`) via `class_id`.
2. **Kategori Standar WHO**:
   - **Gizi Sangat Kurang** (`< -3 SD`, Ungu `#7c3aed`)
   - **Gizi Kurang** (`-3 SD s.d. < -2 SD`, Biru Muda `#0284c7`)
   - **Gizi Normal** (`-2 SD s.d. +1 SD`, Hijau `#10b981`)
   - **Gizi Lebih** (`> +1 SD s.d. +2 SD`, Kuning `#f59e0b`)
   - **Obesitas** (`> +2 SD`, Merah `#ef4444`)
3. **Skala Bar Chart Responsif**: Tinggi silinder batang diskalakan secara proporsional terhadap frekuensi maksimum dengan kalkulasi persentase yang dibulatkan 1 desimal (`toFixed(1)`).

---

## 8. Kontrol Privasi (Privacy Controls)

- Meskipun halaman `/grafik` kini terproteksi untuk Kader dan Kepala Sekolah:
  - **Nol Data Personal**: Tidak ada nama siswa, NIS, Kode Siswa, tanggal lahir, atau rekam medis individual yang ditampilkan.
  - **Penyajian Agregat Murni**: Semua data disajikan dalam bentuk jumlah populasi (frekuensi) dan persentase per rombel.

---

## 9. Perubahan Antarmuka Pengguna (UI Changes)

- **Transformasi Bar Chart**: Visualisasi utama diubah menjadi **Grafik Batang (Bar Chart)** yang modern, bersih, dan mudah dibaca.
- **KaderNavbar**: Menambahkan menu langsung **"Grafik Status Gizi"** (`/grafik`) berikon `<BarChart3 />` bagi Kader dan Kepala Sekolah.
- **PublicNavbar**: Menghapus link `/grafik` dari menu publik untuk mencegah eksploitasi halaman internal oleh publik.
- **Penghapusan Terminologi `(IMT/U)`**: Semua label dan penjelasan menggunakan nama resmi **Standar WHO**.

---

## 10. Perubahan Halaman Login (Login Changes)

- **Pembersihan Total Informasi Internal**: Bagian *"Akses Cepat Pengguna"* beserta tombol shortcut `USR001 (Kepala Sekolah)` dan `USR003 (Kader SATRIA)` telah **dihapus sepenuhnya**.
- **Form Login Bersih**: Input ID Pengguna resmi dengan placeholder umum tanpa membocorkan struktur data database kepada publik.
- **Notifikasi Ramah**: Jika diarahkan karena belum login, muncul notifikasi *"Silakan masuk terlebih dahulu dengan akun resmi (Kader SATRIA atau Kepala Sekolah) untuk mengakses halaman tersebut."*

---

## 11. Hasil Pengujian Fungsional (Test Results)

| Skenario Pengujian | Hasil Yang Diharapkan | Hasil Aktual | Status |
| :--- | :--- | :--- | :---: |
| **Case 1**: Publik membuka `/grafik` | Ditolak & diredirect ke `/login` | Diarahkan ke `/login` | **PASS** |
| **Case 2**: Kader SATRIA login & buka `/grafik` | Akses diizinkan & render Bar Chart | Bar Chart tampil lengkap | **PASS** |
| **Case 3**: Kepala Sekolah login & buka `/grafik` | Akses diizinkan & render Bar Chart | Bar Chart tampil lengkap | **PASS** |
| **Case 4**: Logout dari sistem | Sesi dihapus & akses `/grafik` diblokir | Kembali diarahkan ke `/login` | **PASS** |
| **Case 5**: URL dibuka langsung tanpa navbar | Route guard memverifikasi otorisasi | Sesi divalidasi ketat | **PASS** |
| **Case 6**: Filter tab Kelas 10, 11, 12 | Agregasi data berubah sesuai tab | Grafik & tabel reaktif | **PASS** |
| **Case 7**: Cek shortcut user ID di `/login` | Tidak ada tombol USR001/USR003 | Form bersih 100% | **PASS** |
| **Case 8**: Keaslian data kesehatan | Data bersumber murni dari API | Tidak ada data palsu | **PASS** |

---

## 12. Hasil Validasi Linter (`npm run lint`)
- **Status**: **PASS** (0 errors, 0 warnings)

---

## 13. Hasil Kompilasi Produksi (`npm run build`)
- **Status**: **PASS** (100% Compiled, 14 static & dynamic Next.js routes)

---

## 14. Batasan & Catatan Masa Depan (Remaining Limitations)
- **Status**: **PASS WITH NOTE**
- **Catatan**: Sesi saat ini berjalan pada arsitektur Client-Side Session Guard. Untuk penerapan enterprise di masa depan, dapat ditambahkan otentikasi berbasis HTTP-Only Cookie dan JSON Web Token (JWT) yang diterbitkan oleh backend tersertifikasi.
