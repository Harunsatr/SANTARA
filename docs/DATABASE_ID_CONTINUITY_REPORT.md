# SANTARA DATABASE ID CONTINUITY REPORT
**Laporan Analisis Kontinuitas ID, Deteksi Gap, dan Kebijakan Pelestarian ID Legacy**
*Sistem Pemantauan Kesehatan Remaja SMA (SANTARA)*  
*Waktu Analisis: 2026-08-10T18:30:30+07:00*  
*Prinsip Utama: DATA INTEGRITY > NOMOR ID TERLIHAT RAPI*

---

## 1. Executive Policy on Primary Key Continuity

Sesuai aturan arsitektur data SANTARA:
> **"JANGAN melakukan renumbering primary key secara buta (Blind Renumbering)."**  
> Primary Key pada Google Sheets telah dijadikan acuan foreign key oleh baris transaksi historis dan log audit. Mengubah ID yang sudah ada hanya agar nomornya urut (1, 2, 3, ...) berisiko merusak integritas relasional database (*broken foreign keys*).

Oleh karena itu, sistem menerapkan **Incremental Next-ID Policy**:
- Format ID menggunakan Prefix 3 Huruf + 3 Digit Angka Nol di Depan (`USR001`, `SCH001`, `CLS001`, `STD001`, `EXM001`, `SCR001`, `TTD001`, `EDU001`, `LOG001`).
- Penambahan data baru selalu mengambil angka terbesar yang pernah tercatat + 1 (`max(N) + 1`).
- Gap angka historis (misal dari `STD002` lompat ke `STD016`) didokumentasikan secara transparan sebagai **Legacy ID Gap** tanpa merusak data.

---

## 2. Table-by-Table ID Continuity Breakdown

### A. 01_USERS
- **Prefix**: `USR`
- **ID Terkecil**: `USR001`
- **ID Terbesar**: `USR002`
- **Jumlah Record**: 2
- **Duplicates**: 0 (PASS)
- **ID Gap**: Tidak ada gap numerik (001 -> 002).
- **Status Record**:
  - `USR001`: Aktif & Valid (Kader SATRIA 01).
  - `USR002`: Template row placeholder.
- **Keputusan**: Pertahankan ID existing.

---

### B. 02_SCHOOLS
- **Prefix**: `SCH`
- **ID Terkecil**: `SCH001`
- **ID Terbesar**: `SCH001`
- **Jumlah Record**: 1
- **Duplicates**: 0 (PASS)
- **ID Gap**: Tidak ada gap.
- **Status Record**: `SCH001` aktif sebagai master sekolah mitra.
- **Legacy Reference**: Record `STD002` yang merujuk `SCH002` dimitigasi di adapter layer tanpa membuat entitas palsu.

---

### C. 03_CLASSES
- **Prefix**: `CLS`
- **ID Terkecil**: `CLS001`
- **ID Terbesar**: `CLS015`
- **Jumlah Record**: 15
- **Duplicates**: 0 (PASS)
- **ID Gap**: Sekuensial kontinu `CLS001` s.d. `CLS015` (15 baris).
- **Status Record**:
  - `CLS001`: Kelas 10 A (Aktif & Valid).
  - `CLS002`–`CLS015`: Baris template kontinu.
- **Keputusan**: Pertahankan seluruh ID. Penyaringan baris kosong dilakukan pada layer query / adapter frontend (`filterValidClasses()`).

---

### D. 04_STUDENTS
- **Prefix**: `STD`
- **ID Terkecil**: `STD001`
- **ID Terbesar**: `STD026`
- **Jumlah Record**: 11
- **Duplicates**: 0 (PASS)
- **ID Sequence History**:
  - `STD001` (Legacy Inactive)
  - `STD002` (Legacy Inactive)
  - `STD016` (Inactive Test Record)
  - `STD017` s.d. `STD026` (Active Demo Students: 8 Siswa)
- **Analisis Gap**: Terdapat gap historis antara `STD002` dan `STD016`.
- **Keputusan**: **NO BLIND RENUMBERING**. ID `STD016` dan seterusnya dipertahankan karena sudah memiliki relasi foreign key ke tabel `05_EXAMINATIONS` (`EXM016`), `06_SCREENINGS` (`SCR016`), `07_TTD` (`TTD016`), dan `09_AUDIT_LOG`.

---

### E. 05_EXAMINATIONS
- **Prefix**: `EXM`
- **ID Terkecil**: `EXM001`
- **ID Terbesar**: `EXM026`
- **Jumlah Record**: 11
- **Duplicates**: 0 (PASS)
- **ID Sequence History**:
  - `EXM001` (Legacy Exam)
  - `EXM016` (Test Exam)
  - `EXM017` s.d. `EXM026` (Active Demo Exams: 9 Pemeriksaan mencakup seluruh kategori WHO Anthro Plus)
- **Keputusan**: Pertahankan ID existing. 100% Terhubung valid ke `04_STUDENTS`.

---

### F. 06_SCREENINGS
- **Prefix**: `SCR`
- **ID Terkecil**: `SCR001`
- **ID Terbesar**: `SCR024`
- **Jumlah Record**: 9
- **Duplicates**: 0 (PASS)
- **ID Sequence History**: `SCR001`, `SCR016` s.d. `SCR024`.
- **Keputusan**: Pertahankan ID existing.

---

### G. 07_TTD
- **Prefix**: `TTD`
- **ID Terkecil**: `TTD001`
- **ID Terbesar**: `TTD026`
- **Jumlah Record**: 11
- **Duplicates**: 0 (PASS)
- **ID Sequence History**: `TTD001`, `TTD016` s.d. `TTD026`.
- **Keputusan**: Pertahankan ID existing.

---

### H. 08_EDUCATIONS
- **Prefix**: `EDU`
- **ID Terkecil**: `EDU001`
- **ID Terbesar**: `EDU020`
- **Jumlah Record**: 5
- **Duplicates**: 0 (PASS)
- **ID Sequence History**: `EDU001`, `EDU016` s.d. `EDU020`.
- **Keputusan**: Pertahankan ID existing.

---

### I. 09_AUDIT_LOG
- **Prefix**: `LOG`
- **ID Terkecil**: `LOG001`
- **ID Terbesar**: `LOG092`
- **Jumlah Record**: 92
- **Duplicates**: 0 (PASS)
- **ID Sequence**: Sekuensial kontinu `LOG001` s.d. `LOG092` yang dihasilkan oleh backend secara real-time.

---

## 3. ID Continuity Summary Matrix

| Table | Prefix | Smallest ID | Largest ID | Count | Duplicates | Legacy Gaps Documented | Status |
|---|:---:|:---:|:---:|---:|:---:|:---:|:---:|
| `01_USERS` | `USR` | `USR001` | `USR002` | 2 | 0 | None | **PASS** |
| `02_SCHOOLS` | `SCH` | `SCH001` | `SCH001` | 1 | 0 | None | **PASS** |
| `03_CLASSES` | `CLS` | `CLS001` | `CLS015` | 15 | 0 | None | **PASS** |
| `04_STUDENTS` | `STD` | `STD001` | `STD026` | 11 | 0 | `STD003`–`STD015` | **PASS (Preserved)** |
| `05_EXAMINATIONS` | `EXM` | `EXM001` | `EXM026` | 11 | 0 | `EXM002`–`EXM015` | **PASS (Preserved)** |
| `06_SCREENINGS` | `SCR` | `SCR001` | `SCR024` | 9 | 0 | `SCR002`–`SCR015` | **PASS (Preserved)** |
| `07_TTD` | `TTD` | `TTD001` | `TTD026` | 11 | 0 | `TTD002`–`TTD015` | **PASS (Preserved)** |
| `08_EDUCATIONS` | `EDU` | `EDU001` | `EDU020` | 5 | 0 | `EDU002`–`EDU015` | **PASS (Preserved)** |
| `09_AUDIT_LOG` | `LOG` | `LOG001` | `LOG092` | 92 | 0 | None | **PASS** |
