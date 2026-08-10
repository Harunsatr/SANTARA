# SANTARA — API CAPABILITY MATRIX
**Pemetaan Kebutuhan Produk & UI terhadap Kemampuan Backend Google Apps Script & Google Sheets**
*Audit Date: 2026-08-10*  
*Backend Status: Phase 1 Frozen (Zero Modifications Enforced)*

---

## 1. Matrix Kemampuan API & Backend

| # | Product Requirement | UI Requirement | Backend Sheet | API Endpoint | Field Available di Database | CRUD Support | Status Kemampuan |
|---|---|---|---|---|---|---|---|
| 1 | **Identitas Siswa** | Menampilkan daftar siswa, detail profil, jenis kelamin, tanggal lahir | `04_STUDENTS` | `getStudents`<br>`createStudent`<br>`updateStudent`<br>`archiveStudent` | `id`, `school_id`, `class_id`, `student_code`, `nama`, `gender`, `birth_date`, `status`, `created_at`, `updated_at` | **C, R, U, D (Soft)** | **SUPPORTED** |
| 2 | **Kalkulasi Umur Siswa** | Menampilkan umur siswa saat pemeriksaan | `04_STUDENTS` | `getStudents` | `birth_date` (Dihitung di frontend: `today - birth_date`) | **R (Computed)** | **SUPPORTED** *(Computed via `birth_date`)* |
| 3 | **Pemeriksaan Antropometri (TB & BB)** | Input tinggi badan (cm) dan berat badan (kg) | `05_EXAMINATIONS` | `getExaminations`<br>`createExamination`<br>`updateExamination` | `weight_kg`, `height_cm`, `examination_date`, `student_id`, `class_id`, `examiner_id` | **C, R, U** | **SUPPORTED** |
| 4 | **Perhitungan IMT / BMI** | Menampilkan nilai IMT otomatis 2 desimal | `05_EXAMINATIONS` | `getExaminations`<br>`createExamination`<br>`updateExamination` | `bmi` (Dihitung otomatis di backend: `weight / (height/100)^2`) | **C, R, U (Computed)** | **SUPPORTED** |
| 5 | **Klasifikasi Status Gizi (WHO Anthro Plus)** | Menampilkan kategori gizi (Severely Thinness, Thinness, Normal, Overweight, Obese) | `05_EXAMINATIONS` | `getExaminations`<br>`createExamination`<br>`updateExamination` | `nutrional_status` *(Kolom persis)* | **C, R, U** | **SUPPORTED** |
| 6 | **Pengukuran LiLA (Lingkar Lengan Atas)** | Input nilai LiLA (cm) pada formulir JAKRA | `05_EXAMINATIONS` | `createExamination`<br>`updateExamination` | *Tidak ada kolom `lila_cm` khusus.* Dapat disimpan di kolom `notes` | **C, R (via `notes`)** | **NOT_SUPPORTED_BY_CURRENT_API** *(Khusus kolom terdedikasi)* |
| 7 | **Catatan Pemeriksaan Gizi** | Catatan tambahan kondisi fisik siswa | `05_EXAMINATIONS` | `getExaminations`<br>`createExamination`<br>`updateExamination` | `notes` | **C, R, U** | **SUPPORTED** |
| 8 | **Skrining Anemia (Kadar Hb)** | Input kadar Hemoglobin (g/dL) dan hasil skrining | `06_SCREENINGS` | `getScreenings`<br>`createScreening`<br>`updateScreening` | `screening_type` ("Anemia"), `result` ("Hb 12.5 g/dL"), `screening_date`, `student_id`, `class_id`, `examiner_id` | **C, R, U** | **PARTIALLY_SUPPORTED** *(Generic string `result`)* |
| 9 | **Skrining Tekanan Darah** | Input tekanan darah (Systolic/Diastolic mmHg) | `06_SCREENINGS` | `getScreenings`<br>`createScreening`<br>`updateScreening` | `screening_type` ("Tekanan Darah"), `result` ("110/70 mmHg"), `screening_date`, `student_id`, `class_id`, `examiner_id` | **C, R, U** | **PARTIALLY_SUPPORTED** *(Generic string `result`)* |
| 10 | **Dokumentasi Konsumsi TTD** | Pencatatan konsumsi Tablet Tambah Darah (Sudah/Belum, jumlah) | `07_TTD` | `getTTD`<br>`createTTD`<br>`updateTTD` | `student_id`, `class_id`, `consumption_date`, `consumed`, `quantity`, `recorded_by`, `notes` | **C, R, U** | **SUPPORTED** |
| 11 | **Unggah Bukti Foto TTD Bersama** | Upload foto kegiatan minum TTD bersama di kelas | `07_TTD` | — | *Tidak ada kolom `photo_url` / drive upload handler* | — | **NOT_SUPPORTED_BY_CURRENT_API** |
| 12 | **Grafik Distribusi Status Gizi Publik** | Visualisasi diagram batang status gizi per kelas (10, 11, 12) | `03_CLASSES`<br>`05_EXAMINATIONS` | `getClasses`<br>`getExaminations` | `grade`, `class_name`, `nutrional_status`, `class_id` (Agregasi di frontend) | **R (Aggregated)** | **SUPPORTED** |
| 13 | **Edukasi Anemia & Gizi (CAGAR Online)** | Menampilkan artikel edukasi, penyebab anemia, sumber zat besi | `08_EDUCATIONS` | `getEducations`<br>`createEducation`<br>`updateEducation` | `id`, `title`, `slug`, `category`, `excerpt`, `content`, `thumbnail_url`, `status`, `created_by` | **C, R, U** | **SUPPORTED** |
| 14 | **Master Sekolah & Kelas** | Dropdown pemilihan sekolah dan kelas di form/filter | `02_SCHOOLS`<br>`03_CLASSES` | `getSchools`<br>`getClasses` | `id`, `name`, `grade`, `class_name`, `status` | **R** | **SUPPORTED** *(CLS002–015 placeholder ditangani via filter UI)* |
| 15 | **Autentikasi & Login Kader SATRIA** | Halaman login dengan username/email & password | `01_USERS` | `getUsers` | `id`, `name`, `email`, `role`, `status` (*Tidak ada field `password_hash` / endpoint login*) | **R (List only)** | **NOT_SUPPORTED_BY_CURRENT_API** *(Auth backend belum diimplementasikan di Phase 1)* |
| 16 | **Role-Based Access Control** | Pembatasan akses halaman publik vs kader | `01_USERS` | `getUsers` | `role` ("kader", "admin") (*Enforcement di sisi client*) | **R** | **PARTIALLY_SUPPORTED** |
| 17 | **Riwayat Audit Aktivitas** | Pelacakan siapa yang menginput data pemeriksaan | `09_AUDIT_LOG` | — | `user_id`, `action`, `table_name`, `record_id`, `description`, `timestamp` (*Tercatat otomatis saat mutasi*) | **C (Automatic)** | **SUPPORTED (Internal Backend)** |

---

## 2. Definisi Status Kemampuan

- **SUPPORTED**: Requirement produk didukung 100% oleh skema database dan endpoint API yang ada.
- **PARTIALLY_SUPPORTED**: Requirement didukung secara fungsional menggunakan field generik atau kalkulasi agregasi di frontend.
- **NOT_SUPPORTED_BY_CURRENT_API**: Requirement memerlukan field atau handler backend khusus yang belum ada di Phase 1 (misal: file upload, auth password hash).
- **AMBIGUOUS**: Requirement membutuhkan konfirmasi spesifikasi dari product owner.
