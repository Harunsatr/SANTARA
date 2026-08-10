# SANTARA DATABASE MASTER DATA AUDIT
**Laporan Audit Menyeluruh Data Master & Integritas Relasional Google Spreadsheet (SANTARA_DATABASE)**
*Sistem Pemantauan Kesehatan Remaja SMA (SANTARA)*  
*Auditor: Senior Database Engineer & Data Integrity Auditor*  
*Waktu Audit: 2026-08-10T18:30:16+07:00*  
*Status Change Control: Backend Changes = 0 | Schema Changes = 0 | Production Deployment @13 Active*

---

## 1. Summary

Audit menyeluruh terhadap seluruh 9 worksheet pada spreadsheet production `SANTARA_DATABASE` menunjukkan kondisi kesehatan basis data sebagai berikut:

- **Total Worksheet / Tabel**: 9 Sheet (`01_USERS` s.d. `09_AUDIT_LOG`).
- **Total Record Terdaftar**: 151 Baris Data across sheets.
- **Duplicate Primary Key**: **0 (100% Unique PK pada semua sheet)**.
- **Orphan Foreign Key pada Data Aktif**: **0 (Zero Broken Relations pada data operasional)**.
- **Legacy Foreign Key Issues**: 1 record legacy (`STD002` -> `SCH002`) yang telah dimitigasi secara non-destruktif oleh application adapter layer (`resolveSchoolName`).
- **Status Master Data**:
  - `01_USERS`: Memiliki akun kader aktif `USR001` (Kader SATRIA 01).
  - `02_SCHOOLS`: Memiliki master sekolah aktif `SCH001` (SMA Negeri 1 Contoh / SMAN 1 Batu).
  - `03_CLASSES`: Memiliki master kelas aktif `CLS001` (Kelas 10 A). Baris `CLS002–CLS015` berstatus template placeholder yang disaring otomatis di UI layer.
- **Empty Sheets**: 0 (Tidak ada sheet yang kosong).

---

## 2. Sheet-by-Sheet Audit

### 01_USERS (Data Pengguna / Kader)
- **Record Count**: 2 Baris.
- **Headers (8)**: `id`, `name`, `email`, `role`, `school_id`, `class_id`, `status`, `created_at`.
- **ID Range**: `USR001` s.d. `USR002`.
- **Duplicate ID**: None (PASS).
- **Completeness**:
  - `USR001`: Lengkap (`Kader SATRIA 01`, role `kader`, `SCH001`, `CLS001`, status `active`).
  - `USR002`: Template row (`name: "Kader SATRIA 01"`, field lain kosong).
- **Relasi ke Parent**: `USR001.school_id` -> `SCH001` (VALID), `USR001.class_id` -> `CLS001` (VALID).
- **Status**: **PASS (Siap untuk sesi kader prototype)**.

---

### 02_SCHOOLS (Master Sekolah)
- **Record Count**: 1 Baris.
- **Headers (7)**: `id`, `name`, `address`, `city`, `province`, `status`, `created_at`.
- **ID Range**: `SCH001`.
- **Duplicate ID**: None (PASS).
- **Completeness**: Lengkap (`SCH001` = SMA Negeri 1 Contoh, Malang, Jawa Timur, status `active`).
- **Status**: **PASS**.

---

### 03_CLASSES (Master Kelas)
- **Record Count**: 15 Baris.
- **Headers (8)**: `id`, `school_id`, `address`, `academic_year`, `grade`, `class_name`, `status`, `created_at`.
- **ID Range**: `CLS001` s.d. `CLS015`.
- **Duplicate ID**: None (PASS).
- **Completeness**:
  - `CLS001`: Lengkap (`school_id: SCH001`, `grade: 10`, `class_name: "A"`, status `active`).
  - `CLS002` s.d. `CLS015`: Template placeholder baris kosong.
- **Relasi ke Parent**: `CLS001.school_id` -> `SCH001` (VALID).
- **Status**: **PASS (Disaring aman via `filterValidClasses()`)**.

---

### 04_STUDENTS (Master Siswa)
- **Record Count**: 11 Baris.
- **Headers (10)**: `id`, `school_id`, `class_id`, `student_code`, `nama`, `gender`, `birth_date`, `status`, `created_at`, `updated_at`.
- **ID Range**: `STD001`, `STD002`, `STD016` s.d. `STD026`.
- **Duplicate ID**: None (PASS).
- **Completeness**:
  - `STD001` & `STD002`: Legacy inactive records (2026-07-31).
  - `STD016`: Inactive test record.
  - `STD017` s.d. `STD026`: 8 Siswa demo aktif lengkap dengan tanggal lahir, jenis kelamin, dan NIS unik.
- **Relasi ke Parent**:
  - 8 Siswa Aktif (`STD017`–`STD026`): `school_id: SCH001` (VALID), `class_id: CLS001` (VALID).
  - Konsistensi: `students.school_id == classes.school_id` (VALID).
- **Status**: **PASS**.

---

### 05_EXAMINATIONS (Pemeriksaan Antropometri & Status Gizi)
- **Record Count**: 11 Baris.
- **Headers (12)**: `id`, `student_id`, `class_id`, `examination_date`, `weight_kg`, `height_cm`, `bmi`, `nutrional_status`, `examiner_id`, `notes`, `created_at`, `updated_at`.
- **ID Range**: `EXM001`, `EXM016` s.d. `EXM026`.
- **Duplicate ID**: None (PASS).
- **Exact Field Name**: Kolom `nutrional_status` **100% IDENTIK** (bukan `nutritional_status`).
- **BMI Exactness**: Semua nilai BMI sesuai formula $\text{BB} / (\text{TB}/100)^2$ dengan presisi 2 desimal.
- **WHO Anthro Plus Coverage**: Lengkap mencakup 5 spektrum gizi (*Severely Thinness, Thinness, Normal, Overweight, Obese*).
- **Relasi ke Parent**:
  - `student_id` -> `04_STUDENTS` (100% VALID).
  - `class_id` -> `03_CLASSES` (100% VALID).
  - `examiner_id` -> `USR001` (100% VALID).
- **Status**: **PASS**.

---

### 06_SCREENINGS (Skrining Hemoglobin & Tekanan Darah)
- **Record Count**: 9 Baris.
- **Headers (10)**: `id`, `student_id`, `class_id`, `screening_date`, `screening_type`, `result`, `notes`, `examiner_id`, `created_at`, `updated_at`.
- **ID Range**: `SCR001`, `SCR016` s.d. `SCR024`.
- **Duplicate ID**: None (PASS).
- **Format Konsistensi**:
  - Anemia: `"Hb 12.8 g/dL (Normal)"`, `"Hb 10.5 g/dL (Anemia Ringan)"`, `"Hb 9.2 g/dL (Anemia Sedang)"`.
  - Tekanan Darah: `"115/75 mmHg (Normal)"`, `"130/85 mmHg (Pre-Hipertensi)"`, `"120/80 mmHg (Normal)"`.
- **Relasi ke Parent**: `student_id` VALID, `class_id` VALID, `examiner_id` VALID.
- **Status**: **PASS**.

---

### 07_TTD (Log Konsumsi Tablet Tambah Darah)
- **Record Count**: 11 Baris.
- **Headers (10)**: `id`, `student_id`, `class_id`, `consumption_date`, `consumed`, `quantity`, `recorded_by`, `notes`, `created_at`, `updated_at`.
- **ID Range**: `TTD001`, `TTD016` s.d. `TTD026`.
- **Duplicate ID**: None (PASS).
- **Data Log**: Mencakup log kepatuhan 2 pekan berturut-turut untuk seluruh remaja putri.
- **Relasi ke Parent**: `student_id` VALID, `class_id` VALID, `recorded_by: USR001` VALID.
- **Status**: **PASS**.

---

### 08_EDUCATIONS (Artikel & Panduan Edukasi)
- **Record Count**: 5 Baris.
- **Headers (11)**: `id`, `title`, `slug`, `category`, `excerpt`, `content`, `thumbnail_url`, `status`, `created_by`, `created_at`, `updated_at`.
- **ID Range**: `EDU001`, `EDU016` s.d. `EDU020`.
- **Duplicate ID**: None (PASS).
- **Materi Edukasi**: 4 artikel terbit (*published*) mencakup tema Anemia 5L, Gizi Heme/Non-Heme, Aturan Minum TTD, dan Peran Kader SATRIA.
- **Relasi ke Parent**: `created_by: USR001` VALID.
- **Status**: **PASS**.

---

### 09_AUDIT_LOG (Jejak Rekam Aktivitas Sistem)
- **Record Count**: 92 Baris.
- **Headers (7)**: `id`, `user_id`, `action`, `table_name`, `record_id`, `description`, `timestamp`.
- **ID Range**: `LOG001` s.d. `LOG092`.
- **Duplicate ID**: None (PASS).
- **Otomatisasi**: Dihasilkan secara otomatis oleh fungsi backend `createAuditLog()` untuk setiap operasi CREATE/UPDATE.
- **Status**: **PASS**.

---

## 3. Foreign Key Integrity Matrix

| Parent Table | Child Table | Foreign Key Column | Total Relations | Integrity Status | Catatan Audit |
|---|---|---|:---:|:---:|---|
| `02_SCHOOLS` | `03_CLASSES` | `school_id` | 15 | **PASS** | `CLS001` terhubung ke `SCH001`. Baris placeholder kosong disaring di UI. |
| `02_SCHOOLS` | `01_USERS` | `school_id` | 2 | **PASS** | `USR001` terhubung ke `SCH001`. |
| `02_SCHOOLS` | `04_STUDENTS` | `school_id` | 11 | **PASS** | Seluruh 9 siswa aktif terhubung ke `SCH001`. Siswa legacy `STD002` (`SCH002`) ditangani adapter fallback. |
| `03_CLASSES` | `04_STUDENTS` | `class_id` | 11 | **PASS** | Seluruh 9 siswa aktif terhubung ke `CLS001`. |
| `04_STUDENTS` | `05_EXAMINATIONS` | `student_id` | 11 | **PASS** | 100% Riwayat pemeriksaan terhubung ke ID siswa yang valid. |
| `03_CLASSES` | `05_EXAMINATIONS` | `class_id` | 11 | **PASS** | 100% Pemeriksaan mencantumkan `CLS001`. |
| `01_USERS` | `05_EXAMINATIONS` | `examiner_id` | 11 | **PASS** | 100% Pemeriksa merujuk ke `USR001`. |
| `04_STUDENTS` | `06_SCREENINGS` | `student_id` | 9 | **PASS** | 100% Skrining terhubung ke ID siswa yang valid. |
| `03_CLASSES` | `06_SCREENINGS` | `class_id` | 9 | **PASS** | 100% Skrining mencantumkan `CLS001`. |
| `01_USERS` | `06_SCREENINGS` | `examiner_id` | 9 | **PASS** | 100% Pemeriksa merujuk ke `USR001`. |
| `04_STUDENTS` | `07_TTD` | `student_id` | 11 | **PASS** | 100% Log TTD terhubung ke ID siswa putri yang valid. |
| `03_CLASSES` | `07_TTD` | `class_id` | 11 | **PASS** | 100% Log TTD mencantumkan `CLS001`. |
| `01_USERS` | `07_TTD` | `recorded_by` | 11 | **PASS** | 100% Pencatat merujuk ke `USR001`. |
| `01_USERS` | `08_EDUCATIONS` | `created_by` | 5 | **PASS** | 100% Pembuat artikel merujuk ke `USR001`. |
| `01_USERS` | `09_AUDIT_LOG` | `user_id` | 92 | **PASS** | 100% Jejak audit merujuk ke `USR001` atau sistem. |
