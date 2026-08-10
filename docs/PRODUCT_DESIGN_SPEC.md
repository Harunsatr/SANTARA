# SANTARA — PRODUCT DESIGN SPECIFICATION
**Dokumen Spesifikasi Desain Produk, UI/UX, dan Arsitektur Frontend**
*Berdasarkan Dokumen Resmi: Rancangan Produk Santara (Kemendikbudristek BIMA / UM / SMAN 1 Batu)*

---

## 1. Brand Identity & Filosofi Produk

### A. Definisi Produk
**SANTARA (Sistem Pemantauan Kesehatan Remaja SMA)** adalah platform web terpadu untuk pencatatan, pemantauan, analisis, dan edukasi kesehatan siswa SMA secara berkala dan *real-time* per kelas.

Platform ini dikelola oleh kader kesehatan remaja **SATRIA (Siswa Terlatih Sadar Anemia & Gizi)** yang dibina melalui program UKS sekolah dan tim pengabdian masyarakat.

### B. Mitra & Ekosistem Pendukung
- **Program Pendanaan**: BIMA Kemendikbudristek (Basis Informasi Penelitian & Pengabdian Masyarakat).
- **Institusi Akademik**: Universitas Negeri Malang (UM) — Fakultas Ilmu Keolahragaan (FIK UM).
- **Tujuan Pembangunan Berkelanjutan**:
  - **SDGs 2**: *Zero Hunger* (Penurunan Malnutrisi & Anemia pada Remaja).
  - **SDGs 4**: *Quality Education* (Edukasi Kesehatan Terintegrasi Sekolah).
- **Sekolah Mitra Sasaran**: Sekolah Menengah Atas (misal: SMAN 1 Kota Batu).

### C. Media Fisik Pendamping (Integrasi Offline - Online)
1. **CAGAR (Cakram Gizi Anemia Remaja)**: Cakram edukasi interaktif 2 sisi (Biru/Pink untuk klasifikasi anemia berdasarkan jenis kelamin dan kadar Hb; Hijau untuk panduan nutrisi kaya zat besi & pencegah anemia).
2. **JAKRA (Jejak Kesehatan Remaja)**: Kartu fisik monitoring ukuran F4 berisi 12 kolom riwayat berkala (BB, TB, IMT, LiLA, Hb, Tekanan Darah).
3. **Buku Panduan Terpadu UKS**: Panduan standar pengukuran antropometri dan skrining kesehatan remaja.

---

## 2. Palet Warna & Visual Token (Design System)

### A. Palet Warna Utama
- **Primary Teal/Cyan (Medical Tech)**:
  - `santara-50`: `#f0f9ff`
  - `santara-100`: `#e0f2fe`
  - `santara-500`: `#0ea5e9`
  - `santara-600`: `#0284c7` (Brand Accent Primary)
  - `santara-700`: `#0369a1`
  - `santara-900`: `#0c4a6e`
- **Secondary Medical Blue**:
  - `med-blue`: `#1e40af` (Digunakan pada identitas laki-laki & header laporan)
- **Secondary Rose/Pink (Remaja Putri & Anemia Alert)**:
  - `santara-pink-50`: `#fff1f2`
  - `santara-pink-500`: `#f43f5e`
  - `santara-pink-600`: `#e11d48`
- **Warm Ochre / Coral Header**:
  - `ochre-header`: `#c2410c` / `#b45309` (Warna khas judul "STATUS GIZI SISWA SMAN 1 BATU" pada mockup)

### B. Skala Warna Status Gizi (WHO Anthro Plus Standar Remaja)
1. **Severely Thinness (Gizi Buruk / Sangat Kurus, < -3 SD)**:
   - Warna: Dark Violet / Purple (`#7c3aed`) | Background: `#f5f3ff`
2. **Thinness (Kurus / Kurang Gizi, -3 SD s.d. < -2 SD)**:
   - Warna: Sky Blue (`#0284c7`) | Background: `#e0f2fe`
3. **Normal (Gizi Baik, -2 SD s.d. +1 SD)**:
   - Warna: Emerald Green (`#10b981`) | Background: `#ecfdf5`
4. **Overweight (Gizi Lebih, > +1 SD s.d. +2 SD)**:
   - Warna: Amber / Orange (`#f59e0b`) | Background: `#fffbeb`
5. **Obese (Obesitas, > +2 SD)**:
   - Warna: Crimson Red (`#ef4444`) | Background: `#fef2f2`

### C. Tipografi
- **Primary Font**: `Plus Jakarta Sans` / `Inter`, `sans-serif` (Modern, clean, legible untuk angka medis).
- **Heading Font**: `Outfit` / `Inter`, bold, uppercase pada display titles.

---

## 3. Arsitektur Informasi & Navigasi (Application Shell)

Struktur antarmuka dirancang dalam 2 mode: **Public Mode** (tanpa login) dan **Kader/Authenticated Mode** (setelah login kader SATRIA).

### A. Public View (Sebelum Login)
1. **Header / Navbar**:
   - Logo SANTARA + Logo Mitra (UM, FIK, BIMA, SMAN 1 Batu)
   - Menu Navigasi:
     - `Informasi Anemia` (Materi edukasi, gejala 5L, sumber zat besi)
     - `Grafik Status Gizi` (Visualisasi distribusi status gizi per kelas 10, 11, 12)
     - `Log in` (Akses masuk kader)
2. **Halaman Utama (Home)**:
   - Hero banner interaktif "Sistem Pemantauan Kesehatan Remaja SMA".
   - Ringkasan cepat metrik kesehatan sekolah.
   - Akses cepat ke materi edukasi & kalkulator IMT remaja.
3. **Halaman Grafik Status Gizi Publik**:
   - Visualisasi diagram batang (*Bar Chart*) distribusi status gizi per tingkat (Kelas 10, 11, 12).
   - Filter sekolah & tingkat kelas.
   - Penjelasan klasifikasi WHO Anthro Plus.
4. **Halaman Edukasi Anemia & Gizi**:
   - Artikel interaktif, gejala 5L (Lesu, Letih, Lemah, Lelah, Lalai), faktor penghambat & peningkat penyerapan zat besi.

### B. Authenticated View (Kader SATRIA & UKS)
1. **Navbar Kader**:
   - `Dashboard` (Ringkasan pemeriksaan terbaru & alert siswa butuh perhatian)
   - `Status Gizi` (Entri & riwayat pemeriksaan: Tanggal, Siswa, Umur, TB, BB, IMT otomatis, LiLA, Catatan)
   - `Skrining Kesehatan` (Entri kadar Hb & Tekanan Darah)
   - `TTD` (Dokumentasi & log konsumsi bersama Tablet Tambah Darah + upload foto bukti)
   - `Data Siswa` (Direktori siswa per kelas)
   - `Edukasi` (Manajemen materi)
   - `Log out`
2. **Formulir Entri Medis**:
   - Input cepat teroptimasi mobile untuk kader SATRIA saat melakukan pengukuran langsung di kelas.

---

## 4. Kebutuhan Responsif & Performa
- **Target Resolusi**: Desktop (1200px+), Tablet (768px), Mobile (360px–480px).
- **Mobile First**: Kader SATRIA sering menggunakan smartphone saat mendata siswa di kelas.
- **Ukuran Aset**: Target payload ringan (< 2 MB) untuk koneksi internet sekolah.

---

## 5. Penanganan Data Khusus (Data Fallback Strategy)
1. **Placeholder Kelas (`CLS002`–`CLS015`)**:
   - Dropdown kelas di UI memfilter `classes.filter(c => c.class_name && c.class_name.trim() !== '')` agar hanya kelas yang sudah diberi nama lengkap yang dapat dipilih pengguna.
2. **Relasi Sekolah Belum Terdaftar (`STD002` -> `SCH002`)**:
   - Komponen UI menampilkan nama sekolah fallback `"Sekolah SCH002 (Belum Terdaftar)"` tanpa menyebabkan crash aplikasi.
