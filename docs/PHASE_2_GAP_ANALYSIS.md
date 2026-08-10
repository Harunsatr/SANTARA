# SANTARA — PHASE 2 PRE-IMPLEMENTATION GAP ANALYSIS
**Audit Kesenjangan Kebutuhan Produk (Rancangan Produk Santara) vs Backend Production (Google Apps Script & Sheets)**
*Status: Pre-Implementation Audit Gate*  
*Audit Scope: Non-Destructive Cross-Check (0 Code/DB Changes)*

---

## 1. Executive Summary

Audit kesenjangan pra-implementasi (*Pre-Implementation Gap Audit*) dilakukan untuk membandingkan secara komparatif antara requirement produk pada dokumen resmi **"Rancangan Produk Santara"** dengan kapabilitas aktual backend **Google Apps Script REST API** dan skema database **Google Sheets `SANTARA_DATABASE`**.

### Hasil Evaluasi Kategori:
- **Total Requirement**: **17 Domain Kebutuhan**
- **SUPPORTED**: **10 Requirement (58.8%)**
- **PARTIALLY SUPPORTED**: **4 Requirement (23.5%)**
- **NOT SUPPORTED BY CURRENT API**: **3 Requirement (17.6%)**
- **AMBIGUOUS**: **0 Requirement (0.0%)**

---

## 2. Klasifikasi Requirement

### A. SUPPORTED (Didukung Penuh oleh Backend & API Saat Ini)
1. **Manajemen Siswa (`04_STUDENTS`)**:
   - Endpoint: `getStudents`, `createStudent`, `updateStudent`, `archiveStudent`.
   - Field lengkap: `id`, `school_id`, `class_id`, `student_code`, `nama`, `gender`, `birth_date`, `status`.
2. **Pemeriksaan Antropometri (`05_EXAMINATIONS`)**:
   - Endpoint: `getExaminations`, `createExamination`, `updateExamination`.
   - Field lengkap: `weight_kg`, `height_cm`, `examination_date`, `student_id`, `class_id`, `examiner_id`, `notes`.
3. **Kalkulasi BMI Otomatis**:
   - Backend menghitung `bmi = Number((weight / (height/100)^2).toFixed(2))` secara real-time saat create/update.
4. **Klasifikasi Status Gizi (`nutrional_status`)**:
   - Field `nutrional_status` tersimpan dan terkelola secara utuh di `05_EXAMINATIONS`.
5. **Dokumentasi Konsumsi TTD (`07_TTD`)**:
   - Endpoint: `getTTD`, `createTTD`, `updateTTD`.
   - Field: `student_id`, `class_id`, `consumption_date`, `consumed`, `quantity`, `recorded_by`, `notes`.
6. **Edukasi Anemia & Gizi Remaja (`08_EDUCATIONS`)**:
   - Endpoint: `getEducations`, `createEducation`, `updateEducation`.
   - Field: `title`, `slug`, `category`, `excerpt`, `content`, `thumbnail_url`, `status`, `created_by`.
7. **Master Data Sekolah & Kelas (`02_SCHOOLS`, `03_CLASSES`)**:
   - Endpoint: `getSchools`, `getClasses`.
8. **Master Data Pengguna / Kader (`01_USERS`)**:
   - Endpoint: `getUsers` (Read daftar kader dan sekolah binaan).
9. **Visualisasi Grafik Status Gizi Publik**:
   - Data pemeriksaan per kelas dapat diagregasikan oleh frontend dari kombinasi `getClasses` + `getExaminations`.
10. **Internal Audit Logging (`09_AUDIT_LOG`)**:
    - Seluruh operasi create, update, dan archive secara otomatis dicatat oleh backend.

---

### B. PARTIALLY SUPPORTED (Didukung dengan Solusi Frontend / Data Generik)
1. **Perhitungan Umur Siswa pada Form Pemeriksaan**:
   - *Kondisi*: Tabel `05_EXAMINATIONS` tidak memiliki kolom `age` / `umur`.
   - *Solusi Frontend*: Frontend menghitung umur secara dinamis (Tahun & Bulan) dari `04_STUDENTS.birth_date` terhadap `examination_date`.
2. **Skrining Kadar Hemoglobin (Hb) & Tekanan Darah (`06_SCREENINGS`)**:
   - *Kondisi*: Tabel `06_SCREENINGS` tidak memiliki kolom terpisah `hb_value` atau `blood_pressure_systolic`/`diastolic`.
   - *Solusi Frontend*: Menggunakan kolom generik `screening_type` ("Anemia" / "Tekanan Darah") dan `result` (contoh: "Hb 12.5 g/dL (Normal)" atau "110/70 mmHg").
3. **Role-Based Navigation & Access Control**:
   - *Kondisi*: Database menyimpan field `role` ("kader", "admin"), tetapi tidak ada middleware authorization token di backend.
   - *Solusi Frontend*: Frontend mengelola state sesi lokal (Client-side Session) berdasarkan profil kader yang dipilih.
4. **Penanganan Data Placeholder Kelas (`CLS002`–`CLS015`)**:
   - *Kondisi*: Baris template kelas di database belum memiliki nama kelas.
   - *Solusi Frontend*: UI dropdown memfilter kelas yang memiliki nama (`classes.filter(c => c.class_name && c.class_name.trim() !== '')`).

---

### C. NOT SUPPORTED (Belum Didukung oleh API Backend Phase 1)
1. **Pengukuran LiLA (Lingkar Lengan Atas) Kolom Khusus**:
   - *Temuan*: Pada formulir JAKRA fisik terdapat kolom LiLA. Namun tabel `05_EXAMINATIONS` **tidak memiliki kolom `lila_cm`**.
   - *Mitigasi Phase 2*: Nilai LiLA diinputkan ke dalam field `notes` (contoh: `"LiLA: 23.5 cm | Normal"`) tanpa memodifikasi skema database.
2. **Unggah Foto Bukti Dokumentasi Minum TTD Bersama**:
   - *Temuan*: Mockup UI mencantumkan tombol `UPLOAD` foto bersama. Namun tabel `07_TTD` **tidak memiliki kolom `photo_url`** dan Apps Script belum memiliki multipart file upload handler.
   - *Mitigasi Phase 2*: Input upload foto ditandai `NOT_SUPPORTED_BY_CURRENT_API`. Dokumentasi dicatat dalam bentuk teks keterangan di kolom `notes` (Opsi integrasi Google Drive ditunda ke Phase 3).
3. **Sistem Autentikasi Produksi (Password Hash & Session Token)**:
   - *Temuan*: Tabel `01_USERS` tidak menyimpan hash password dan tidak ada endpoint `POST login`.
   - *Status*: **AUTHENTICATION NOT IMPLEMENTED IN PHASE 1 BACKEND**.
   - *Mitigasi Phase 2*: UI Login dibuat sebagai antarmuka seleksi profil kader terverifikasi (Kader Session Switcher) dengan label jelas: `AUTH BACKEND REQUIRED FOR PRODUCTION SECURITY`.

---

### D. AMBIGUOUS (Kebutuhan yang Memerlukan Keputusan Bisnis)
- *Tidak ada ambiguitas kritis*. Seluruh alur utama UKS dan pemantauan gizi kader SATRIA telah terdefinisi secara jelas.

---

## 3. Deep-Dive Audit Domain Spesifik

### A. Audit Status Gizi (`05_EXAMINATIONS`)
| Parameter UI | Ketersediaan di Database | Tindakan Frontend Next.js |
|---|---|---|
| Tanggal Pemeriksaan | `examination_date` (VALID) | Komponen DatePicker format ISO |
| Siswa | `student_id` (VALID) | Dropdown Combobox Siswa |
| Umur Siswa | Dihitung dari `birth_date` (VALID) | Computed field otomatis |
| Tinggi Badan (cm) | `height_cm` (VALID) | Input Numeric (Step 0.1 cm) |
| Berat Badan (kg) | `weight_kg` (VALID) | Input Numeric (Step 0.1 kg) |
| IMT / BMI | `bmi` (VALID) | Auto-calculate live di form + dihitung ulang di backend |
| Status Gizi | `nutrional_status` (VALID) | Klasifikasi WHO Anthro Plus otomatis |
| LiLA (cm) | *Tidak ada kolom khusus* | Simpan ke kolom `notes` |
| Catatan | `notes` (VALID) | Input Textarea |
| Petugas Pemeriksa | `examiner_id` (VALID) | Diisi ID Kader yang sedang aktif |

---

### B. Audit Skrining Kesehatan (`06_SCREENINGS`)
| Parameter UI | Ketersediaan di Database | Tindakan Frontend Next.js |
|---|---|---|
| Jenis Skrining | `screening_type` (VALID) | Select option: `"Anemia (Hb)"`, `"Tekanan Darah"`, `"Skrining Umum"` |
| Nilai Hb / Tekanan Darah | `result` (VALID - String) | Formated string: `"12.4 g/dL"` atau `"115/75 mmHg"` |
| Catatan / Saran | `notes` (VALID) | Textarea catatan tindakan kader |
| Petugas | `examiner_id` (VALID) | Diisi ID Kader aktif |

---

### C. Audit Tablet Tambah Darah (`07_TTD`)
| Parameter UI | Ketersediaan di Database | Tindakan Frontend Next.js |
|---|---|---|
| Tanggal Konsumsi | `consumption_date` (VALID) | DatePicker |
| Siswa | `student_id` (VALID) | Multi-select / Single-select siswa putri |
| Status Minum | `consumed` (VALID - Boolean/String) | Checkbox / Radio "Sudah Minum" |
| Jumlah Tablet | `quantity` (VALID - Numeric) | Default `1` |
| Upload Foto Bersama | *Tidak didukung backend* | Non-aktif / Catatan di `notes` |
| Keterangan | `notes` (VALID) | Textarea keterangan kegiatan |

---

### D. Audit Public Dashboard & Perlindungan Privasi Data
Platform SANTARA memiliki dua area akses:

```
┌─────────────────────────────────────────────────────────────┐
│                       SANTARA PLATFORM                      │
├──────────────────────────────┬──────────────────────────────┤
│         PUBLIC MODE          │      AUTHENTICATED MODE      │
│      (Sebelum Login)         │        (Kader SATRIA)        │
├──────────────────────────────┼──────────────────────────────┤
│ • Edukasi Anemia & CAGAR     │ • Entri Pemeriksaan Siswa    │
│ • Informasi Penyerapan Gizi  │ • Entri Skrining Hb & Tekanan│
│ • GRAFIK DISTRIBUSI GIZI     │ • Pencatatan Konsumsi TTD    │
│   (Agregat Per Kelas 10/11/12)│ • Direktori Data Siswa      │
│                              │ • Profil Siswa Individual    │
└──────────────────────────────┴──────────────────────────────┘
```

**Aturan Privasi Publik Wajib:**
1. **Dilarang Menampilkan Data Individu**: Halaman publik **TIDAK BOLEH** menampilkan nama siswa, NIS/student_code, foto, atau riwayat medis personal.
2. **Hanya Menampilkan Data Agregat**: Halaman `Grafik Status Gizi` publik hanya menampilkan grafik batang jumlah / persentase siswa per kategori status gizi per tingkat kelas (Kelas 10, Kelas 11, Kelas 12).

---

### E. Role Matrix
| Role | Product Requirement | Database Support (`01_USERS.role`) | API Support | Frontend Handling |
|---|---|---|---|---|
| **Public** | Melihat edukasi & grafik agregat gizi | — (Unauthenticated) | Read-only GET | Halaman publik bebas akses |
| **Kader SATRIA** | Input pemeriksaan gizi, skrining Hb, TTD | `role: "kader"` (Tersedia) | `getUsers` + Full POST | Mode kerja utama kader UKS |
| **Admin / Guru** | Monitoring data & audit log | `role: "admin"` (Tersedia) | `getUsers` + Full POST | Panel monitoring lanjutan |

---

### F. Responsive & Usability Standards
- **Target Viewport**:
  - Desktop: `>= 1200px` (Layout optimal untuk admin sekolah & dashboard grafik)
  - Tablet: `768px - 1024px`
  - Mobile: `360px - 480px` (**Prioritas Utama**: Form entri satu tangan untuk kader saat berkeliling kelas)
- **Design Tokens Validated**:
  - Primary Cyan/Teal: `#0284c7`
  - Medical Blue: `#1e40af`
  - Accent Pink: `#f43f5e`
  - Ochre Display Header: `#c2410c`
  - Status Gizi WHO: Severely Thinness (`#7c3aed`), Thinness (`#0284c7`), Normal (`#10b981`), Overweight (`#f59e0b`), Obese (`#ef4444`).

---

## 4. Prioritization Matrix (Gap Analysis)

| ID | Gap / Keterbatasan | Dampak terhadap Frontend | Prioritas | Rekomendasi Mitigasi Frontend Phase 2 |
|---|---|---|---|---|
| **GAP-01** | Tidak ada backend auth password / token | Pengguna tidak bisa login dengan password riil | **P2 (Dapat Ditunda)** | Gunakan *Kader Profile Switcher* di sisi client dengan label prototype jelas. Backend auth formal dapat dibuat di Phase 3. |
| **GAP-02** | Upload foto TTD belum didukung | Tombol upload foto tidak menyimpan file ke cloud | **P2 (Dapat Ditunda)** | Nonaktifkan widget file upload, alihkan dokumentasi ke field teks `notes`. |
| **GAP-03** | Kolom khusus `lila_cm` belum ada | Nilai LiLA tidak tersimpan di kolom terpisah | **P3 (Enhancement)** | Masukkan angka LiLA ke dalam field `notes` secara terformat: `"LiLA: 23 cm"`. |
| **GAP-04** | Skrining Hb & BP menggunakan kolom generik `result` | Butuh parsing format jika ingin visualisasi tren Hb numerik | **P3 (Enhancement)** | Simpan teks terstruktur: `"Hb 12.5 g/dL"` dan sediakan helper parser di frontend. |
| **GAP-05** | Siswa legacy `STD002` memiliki `school_id: SCH002` | Potensi relasi sekolah kosong di UI | **P3 (Data Note)** | UI menampilkan fallback `"Sekolah SCH002 (Belum Terdaftar)"` tanpa error. |
| **GAP-06** | Kelas placeholder `CLS002`–`CLS015` | Dropdown kelas bisa menampilkan opsi kosong | **P2 (Dapat Ditunda)** | UI memfilter hanya kelas yang memiliki atribut `class_name` valid. |

*Definisi Prioritas: P0 = Blocker (0 isu) | P1 = Harus selesai sebelum prod (0 isu) | P2 = Dapat ditunda / work around (3 isu) | P3 = Minor / Enhancement (3 isu).*

---

## 5. Frontend Implementation Decision

# ============================================================
# PHASE 2 FRONTEND READINESS: READY WITH LIMITATIONS
# ============================================================

### Justifikasi Keputusan:
1. **Tidak Ada Isu P0 (Blocker)**: Seluruh fungsi inti pemantauan gizi, skrining Hb, pencatatan TTD, visualisasi grafik agregat per kelas, dan edukasi anemia dapat dibangun 100% menggunakan API backend yang tersedia.
2. **Keterbatasan Teridentifikasi & Terisolasi**: Keterbatasan upload file, ketiadaan password hash di database, dan kolom terdedikasi LiLA telah dimitigasi secara elegan tanpa melanggar prinsip *Zero Code Changes* pada backend.
3. **Keamanan Data Terjaga**: Pemisahan tegas antara data agregat publik dan data individual kader menjamin privasi siswa terlindungi penuh.

---

## 6. Recommended Frontend Implementation Order

```
┌─────────────────────────────────────────────────────────────┐
│         URUTAN IMPLEMENTASI FRONTEND NEXT.JS (PHASE 2)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
 1. [App Shell & Design System]│ Token warna, Shell Navbar, Footer Mitra, Responsive Layout
                               ▼
 2. [Public Home Page]         │ Hero section, ringkasan program UKS & kader SATRIA
                               ▼
 3. [Public Education]         │ Informasi Anemia, Gejala 5L, Media interaktif CAGAR Online
                               ▼
 4. [Public Nutrition Chart]   │ Grafik status gizi agregat Kelas 10, 11, 12 (Recharts / Chart.js)
                               ▼
 5. [Kader Session & Auth UI]  │ Pemilihan kader SATRIA aktif & guard route kader
                               ▼
 6. [Kader Dashboard]          │ Metrik sekolah, total pemeriksaan, alert gizi berisiko
                               ▼
 7. [Directory Siswa]          │ Daftar siswa per kelas, profil JAKRA digital, filter kelas
                               ▼
 8. [Form Pemeriksaan Gizi]    │ Entri TB/BB, kalkulasi IMT live, badge WHO Anthro Plus
                               ▼
 9. [Form Skrining Kesehatan]  │ Entri kadar Hb & Tekanan Darah
                               ▼
10. [Form Konsumsi TTD]        │ Logging kepatuhan minum Tablet Tambah Darah mingguan
                               ▼
11. [Integrasi & Verifikasi]   │ Testing end-to-end dengan REST API production Apps Script
```

---
*Dokumen ini disusun sebagai panduan resmi pengembangan Frontend Phase 2 SANTARA.*
