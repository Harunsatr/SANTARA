# SANTARA STUDENT MANAGEMENT IMPLEMENTATION
**Dokumentasi Implementasi Modul Manajemen Data Siswa & Sinkronisasi Google Sheets**
*Sistem Pemantauan Kesehatan Remaja SMA (SANTARA)*  
*Route Frontend: `/kader/data-siswa`*  
*Waktu Selesai: 2026-08-10T18:46:46+07:00*

---

## 1. Arsitektur Alur Data & Sinkronisasi

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Kader SATRIA
    participant UI as Next.js Web (/kader/data-siswa)
    participant Client as API Client (students.ts)
    participant API as Google Apps Script (@13)
    participant Sheets as Google Sheets (04_STUDENTS)

    Admin->>UI: Klik [+ Tambah Siswa] & Isi Form
    UI->>UI: Validasi Client-side (Code Numeric, Name Text, Duplicate Pre-check)
    UI->>Client: createStudent(payload)
    Client->>API: POST action="createStudent"
    API->>Sheets: Generate Next ID (e.g. STD027), Append Row & Audit Log
    Sheets-->>API: Row Saved
    API-->>Client: HTTP 200 { success: true, data: { id, nama, ... } }
    Client-->>UI: ApiResult<Student>
    UI->>UI: Tampilkan Success Toast & Tutup Modal
    UI->>Client: fetchStudents() (Automatic Re-fetch)
    Client->>API: GET action="getStudents"
    API->>Sheets: Read 04_STUDENTS Range
    Sheets-->>API: Array of Rows
    API-->>Client: HTTP 200 { data: [...] }
    Client-->>UI: Update React State from Live Google Sheets
    UI->>Admin: Tampilkan Siswa Baru di Tabel & Update Timestamp
```

---

## 2. Fitur-Fitur Utama yang Diimplementasikan

### A. Form Input & Validasi Siswa Baru (Modal Dialog)
1. **Nomor / Kode Siswa (`student_code`)**:
   - Wajib diisi (*Required*).
   - Wajib murni numerik (*Numeric Only* via regex `/^\d+$/`). Karakter huruf dan simbol langsung ditolak.
   - Pengecekan pra-duplikasi (*Pre-Duplicate Check*) secara real-time pada kelas/sekolah yang sama.
2. **Nama Lengkap Siswa (`nama`)**:
   - Wajib diisi (*Required*).
   - Murni teks alfabetis (*Alphabetical Text Only*). Input angka-saja seperti `"12345"` ditolak.
   - Minimal 2 karakter.
3. **Dropdown Sekolah & Kelas**:
   - Terhubung dinamis ke master sekolah (`02_SCHOOLS`) dan master kelas (`03_CLASSES`).
   - Otomatis membatasi opsi kelas yang valid untuk sekolah yang dipilih.
4. **Jenis Kelamin & Tanggal Lahir**:
   - Pilihan `P` (Perempuan - Sasaran TTD) dan `L` (Laki-laki).
   - Input tanggal standar `YYYY-MM-DD` untuk kalkulasi otomatis usia pada kartu JAKRA.

### B. Sinkronisasi Real-Time & Single Source of Truth
- **Auto Re-fetch**: Setelah penambahan siswa berhasil, sistem langsung memanggil `fetchStudents()` untuk mengambil snapshot terbaru langsung dari Google Sheets.
- **Tombol Manual Refresh**: Dilengkapi tombol `[ ↻ Refresh Data ]` dengan animasi loading dan timestamp akurat (`"Data diperbarui pada HH:mm:ss"`).
- **Background Auto-Sync**: Sinkronisasi pasif berjalan setiap 60 detik tanpa memblokir interaksi pengguna dan dibersihkan saat komponen unmount.

### C. Ringkasan Metrik & Kartu Jejak Kesehatan Remaja (JAKRA)
- Kartu statistik: **Total Siswa**, **Siswa Aktif**, **Remaja Putri (Sasaran TTD)**, dan **Remaja Putra**.
- Fitur pencarian instan berdasarkan Nama, Nomor Siswa, atau ID.
- Filter multi-kriteria (Kelas, Gender, Status Kesiswaan).
- Modal interaktif **Kartu Digital JAKRA** untuk melihat profil lengkap siswa, nomor induk, sekolah, dan usia terhitung.
