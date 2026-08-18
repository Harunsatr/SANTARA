# LAPORAN AUDIT SISTEM: PERSISTENT COOKIE SESSION, ROLE ACCESS, DAN DYNAMIC CLASS 03_CLASSES
**SANTARA — Sistem Pemantauan Kesehatan Remaja SMA**  
*Dokumen Audit Proteksi Halaman, Persistensi Cookie HTTP, Otorisasi Multi-Role, Manajemen Kelas Dinamis, dan Integrasi Google Sheets*  
*Tanggal: 18 Agustus 2026*  

---

## 1. Arsitektur Otentikasi & Cookie Persisten (Current Authentication Architecture)

- **Mekanisme Otentikasi**: Isomorphic Multi-Layer Session Persistence menggabungkan HTTP Cookie `santara_session` (`SameSite=Lax`, `Path=/`, `Max-Age=30 Hari`, `Secure` pada environment production), secure server companion cookie `santara_auth_token`, Next.js Route Handler `/api/auth/session`, dan client-side fallback storage.
- **Marker Keamanan**: `PROTOTYPE AUTHORIZATION — HTTP COOKIE SESSION ENABLED`.
- **Enforcement Otorisasi**: Proteksi route guard berlapis:
  1. *Layer 1 (Cookie Session Store)*: Server route handler `/api/auth/session` memvalidasi cookie HTTP pada setiap request.
  2. *Layer 2 (Context Guard)*: `SessionContext` membaca snapshot dari document cookie dan localStorage secara sinkron saat inisialisasi, memastikan `isReady` bernilai `true` hanya setelah sesi divalidasi sehingga mencegah *flash of unauthenticated state*.
  3. *Layer 3 (Component Guard)*: Halaman `/grafik` memverifikasi status `isAuthenticated` dan `isReady` sebelum memuat data dari API backend.

---

## 2. Matriks Otorisasi Peran (Role Matrix)

| Role Pengguna | Canonical Role | Akses `/grafik` | Akses `/kader/*` | Akses `/admin/*` | Tambah Kelas (`03_CLASSES`) | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **KEPALA_SEKOLAH** (`kepala sekolah`, `admin`) | `KEPALA_SEKOLAH` | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **PASS** |
| **KADER (SATRIA)** (`kader`, `guru`) | `KADER` | **ALLOW** | **ALLOW** | **DENY** | **ALLOW** | **PASS** |
| **SISWA** (`siswa`, `student`) | `SISWA` | **DENY** | **DENY** | **DENY** | **DENY** | **PASS** |
| **PUBLIC / GUEST** | `null` | **DENY (Redirect `/login`)** | **DENY** | **DENY** | **DENY** | **PASS** |

---

## 3. Alur Otentikasi & Proteksi Rute (Authentication & Route Protection Flow)

```
Pengguna Membuka /grafik atau Dashboard
                 │
                 ▼
      Pemeriksaan Sesi Cookie
                 │
        ┌────────┴────────┐
        ▼                 ▼
   [Sesi Tidak Ada]   [Sesi Valid: KADER / KEPALA_SEKOLAH]
        │                 │
        ▼                 ▼
   Redirect ke /login   Akses Diberikan (Render Bar Chart & Data)
                          │
                          ▼
                    Refresh Browser
                          │
                          ▼
                 Sesi Cookie Terbaca
                 (Tetap Login & Authorized)
```

---

## 4. Manajemen Kelas Dinamis & Google Sheets (`03_CLASSES`)

- **Pipeline Dynamic Class**:
  ```
  Google Sheets (03_CLASSES)
             │
             ▼
  Google Apps Script (getClasses / createClass di Kode.js)
             │
             ▼
  API Client (frontend/src/lib/api/classes.ts)
             │
             ▼
  Frontend Class Selector & Bar Chart Aggregator (/grafik)
  ```
- **Fitur Tambah Kelas Baru**:
  - Tersedia tombol `+ Tambah Kelas` di halaman `/grafik` untuk role `KADER` dan `KEPALA_SEKOLAH`.
  - Form modal: Nama Kelas, Tingkat / Grade (`10`, `11`, `12`, `13`, dll.), dan Tahun Ajaran.
  - **Pencegahan Duplikasi**: Backend `createClass` dan frontend memeriksa keunikan rombel pada sekolah yang sama. Duplikasi kelas akan ditolak dengan pesan yang jelas.
  - **Sinkronisasi Real-Time**: Penambahan kelas langsung tersimpan di sheet `03_CLASSES`, tercatat di `09_AUDIT_LOG`, dan langsung muncul sebagai tab baru di `/grafik` tanpa redeploy.

---

## 5. Logika Agregasi Grafik Batang (Bar Chart Logic)

1. **Mapping Kelas**: Setiap catatan antropometri dari `05_EXAMINATIONS` dipetakan ke tingkat kelas via foreign key `class_id` yang valid.
2. **Kategori Standar WHO**:
   - **Gizi Sangat Kurang** (`< -3 SD`, Ungu `#7c3aed`)
   - **Gizi Kurang** (`-3 SD s.d. < -2 SD`, Biru Muda `#0284c7`)
   - **Gizi Normal** (`-2 SD s.d. +1 SD`, Hijau `#10b981`)
   - **Gizi Lebih** (`> +1 SD s.d. +2 SD`, Kuning `#f59e0b`)
   - **Obesitas** (`> +2 SD`, Merah `#ef4444`)
3. **Empty State Bersih**: Jika suatu tingkat kelas belum memiliki data pemeriksaan (misal kelas yang baru ditambahkan), sistem menampilkan pesan *"Kelas X — Belum Ada Data Pemeriksaan"* (0 terdata) tanpa memalsukan data dummy.

---

## 6. Hasil Pengujian Fungsional (Test Results)

| No | Skenario Pengujian | Hasil Yang Diharapkan | Hasil Aktual | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Kader SATRIA login | Login berhasil, cookie terbentuk | Cookie `santara_session` tersimpan | **PASS** |
| **2** | Kader membuka `/grafik` | Akses diizinkan tanpa redirect | Grafik batang tampil penuh | **PASS** |
| **3** | Kader me-refresh `/grafik` | Sesi tetap valid, tidak logout | Halaman tetap terbuka | **PASS** |
| **4** | Kepala Sekolah login & buka `/grafik` | Akses diizinkan | Grafik batang tampil penuh | **PASS** |
| **5** | Kepala Sekolah me-refresh browser | Sesi tetap bertahan via cookie | Tetap terautentikasi | **PASS** |
| **6** | Logout pengguna | Cookie & sesi dihapus bersih | Akses `/grafik` ditolak | **PASS** |
| **7** | Tambah kelas baru (misal Kelas 11 / 12) | Masuk ke `03_CLASSES` | Tersimpan & tab bertambah | **PASS** |
| **8** | Cegah duplikasi kelas | Menolak nama kelas yang sama | Muncul alert duplikasi | **PASS** |
| **9** | Akses publik ke `/grafik` | Ditolak & diredirect ke `/login` | Diarahkan ke `/login` | **PASS** |
| **10**| Data dinamis dari Google Sheets | Otomatis terbaca tanpa hardcoded | Mengikuti sheet aktual | **PASS** |

---

## 7. Hasil Validasi Linter & Kompilasi
- **ESLint (`npm run lint`)**: **PASS** (0 errors, 0 warnings)
- **Next.js Production Build (`npm run build`)**: **PASS** (17 static & dynamic routes compiled)

---

## 8. Status Keseluruhan
- **Status Akhir**: **PASS**
