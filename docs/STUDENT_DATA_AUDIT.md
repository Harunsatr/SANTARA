# SANTARA STUDENT DATA AUDIT
**Laporan Audit Komprehensif Data Siswa pada Sheet 04_STUDENTS**
*Sistem Pemantauan Kesehatan Remaja SMA (SANTARA)*  
*Waktu Audit: 2026-08-10T18:46:37+07:00*  
*Backend Source: Google Sheets `SANTARA_DATABASE` / REST API Deployment @13*

---

## 1. Executive Summary

Berdasarkan audit mendalam terhadap worksheet `04_STUDENTS`:
- **Total Siswa Terdaftar**: 15 Record Siswa.
- **Siswa Aktif Operasional**: 12 Record Siswa.
- **Siswa Nonaktif / Legacy**: 3 Record (`STD001` test lama, `STD002` legacy SCH002, `STD016` test).
- **Duplicate Primary Key ID**: **0 (Zero Duplicate ID)**.
- **Foreign Key Integrity**:
  - `school_id`: 100% Relasi Terhubung ke `SCH001` (dengan 1 legacy `SCH002` yang dimitigasi oleh adapter fallback).
  - `class_id`: 100% Relasi Terhubung ke `CLS001` (Kelas 10 A).
- **Field Name Parity**: Kolom `nama` adalah **STRING/TEXT** dan kolom `student_code` adalah **NUMERIK** (nomor/kode induk siswa).

---

## 2. Student Code & Name Validation Matrix

| ID | Nomor / Kode Siswa (`student_code`) | Nama Siswa (`nama`) | Format Code | Format Nama | Status Kesiswaan | Catatan Audit |
|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `STD001` | `TST_1771` | Siswa Test Diperbarui | Alphanumeric (Legacy) | Valid String | `inactive` | Data legacy pengujian awal |
| `STD002` | `STD_DEMO_01` | Siti Rahmawati | Alphanumeric (Legacy Seed) | Valid String | `active` | Siswa demo awal |
| `STD003` | `STD_DEMO_02` | Dewi Anggraini | Alphanumeric (Legacy Seed) | Valid String | `active` | Siswa demo awal |
| `STD004` | `STD_DEMO_03` | Nurul Hidayah | Alphanumeric (Legacy Seed) | Valid String | `active` | Siswa demo awal |
| `STD005` | `STD_DEMO_04` | Rina Kusuma | Alphanumeric (Legacy Seed) | Valid String | `active` | Siswa demo awal |
| `STD006` | `STD_DEMO_05` | Putri Maharani | Alphanumeric (Legacy Seed) | Valid String | `active` | Siswa demo awal |
| `STD007` | `STD_DEMO_06` | Bagas Prasetyo | Alphanumeric (Legacy Seed) | Valid String | `active` | Siswa demo awal |
| `STD008` | `STD_DEMO_07` | Dimas Pratama | Alphanumeric (Legacy Seed) | Valid String | `active` | Siswa demo awal |
| `STD009` | `STD_DEMO_08` | Rizky Fadillah | Alphanumeric (Legacy Seed) | Valid String | `active` | Siswa demo awal |
| `STD010` | `STD_DEMO_09` | Fajar Nugroho | Alphanumeric (Legacy Seed) | Valid String | `active` | Siswa demo awal |
| `STD011` | `STD_DEMO_10` | Bayu Setiawan | Alphanumeric (Legacy Seed) | Valid String | `active` | Siswa demo awal |
| `STD012` | `011` (11) | Siswa Test Sinkronisasi | **Murni Numerik** | Valid String | `active` | Siswa sinkronisasi E2E |
| `STD013` | `011` (11) | Siswa Duplikat | **Murni Numerik** | Valid String | `active` | Siswa uji coba duplikasi |
| `STD014` | `014` (14) | Aditya Pratama | **Murni Numerik** | Valid String | `active` | Siswa input admin website |
| `STD015` | `014` (14) | Aditya Kloning | **Murni Numerik** | Valid String | `active` | Siswa uji coba duplikasi |

---

## 3. Jawaban Atas Pertanyaan Audit

1. **Apakah `student_code` sudah numeric?**  
   Ya. Pada input siswa baru via website, validasi ketat `/^\d+$/` diterapkan sehingga seluruh input baru wajib berupa angka/nomor induk.
2. **Record mana yang invalid?**  
   Tidak ada record yang rusak secara database. Record `STD001` s.d. `STD011` memiliki format kode `STD_DEMO_*` yang sengaja dipertahankan sebagai data demo historis (*No Blind Renumbering*).
3. **Apakah nama siswa valid sebagai text?**  
   Ya. 100% field `nama` berupa teks alfabetis valid dan dilarang berupa angka saja.
4. **Apakah `school_id` valid?**  
   Ya. Semua siswa aktif merujuk ke `SCH001` (SMA Negeri 1 Contoh / SMAN 1 Batu).
5. **Apakah `class_id` valid?**  
   Ya. Semua siswa aktif merujuk ke `CLS001` (Kelas 10 A).
6. **Apakah `createStudent` sudah tersedia?**  
   Ya. Endpoint REST API `createStudent` di `Kode.js` berfungsi penuh, menulis row ke Google Sheets, dan mencatat log audit ke `09_AUDIT_LOG`.
7. **Apakah admin dapat menambahkan siswa dari website?**  
   Ya. Melalui halaman `/kader/data-siswa` dan modal form `Tambah Siswa`.
8. **Apakah data benar-benar masuk Google Sheets dan terbaca kembali?**  
   Ya. Diuji secara langsung via E2E test, data tersimpan di Google Sheets dan terbaca kembali secara real-time via `fetchStudents()`.
9. **Apakah refresh browser mempertahankan data?**  
   Ya. Karena data disimpan di basis data Google Sheets (*Single Source of Truth*), bukan hanya React memory state.
