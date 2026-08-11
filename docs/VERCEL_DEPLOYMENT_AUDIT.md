# SANTARA — VERCEL DEPLOYMENT AUDIT REPORT
**Laporan Diagnosis Deployment Vercel & Penyelidikan 404 NOT_FOUND**  
*Sistem Pemantauan Kesehatan Remaja SMA (SANTARA)*  
*Status Akhir: SANTARA — VERCEL DEPLOYMENT AUDIT COMPLETE*

---

## 1. Deployment Error
- **Error Code**: `404: NOT_FOUND` / `Code: NOT_FOUND`
- **Deployment ID Reference**: `sin1::67fz9-1786417141985-7920ad318aa3`
- **Description**: Setiap kali mengakses URL deployment Vercel (`https://santara-iota.vercel.app`), Vercel mengembalikan halaman error 404 standar Vercel.

---

## 2. Project Structure
- **Lokasi `package.json`**: `frontend/package.json` (Terverifikasi di bawah folder subdirektori `/frontend`)
- **Next.js Root Directory**: `frontend/` adalah lokasi dari actual Next.js application root.
- **Repository Root**: Berisi file Apps Script `Kode.js`, metadata, dokumentasi `docs/`, dan folder Next.js `frontend/`.
- **Status Struktur**: `PASS`

---

## 3. Vercel Configuration
- **File `vercel.json`**: `NOT APPLICABLE` (Tidak ada file `vercel.json` baik di root maupun subdirektori. Penanganan build diserahkan secara native ke Vercel builder).
- **File `.vercelignore`**: `NOT APPLICABLE` (Tidak digunakan).
- **Root Directory Setting**: `FAIL` (Aplikasi dideploy dengan Root Directory di tingkat root repositori `/` sehingga Next.js tidak terdeteksi dan tidak dibuild secara semestinya).

---

## 4. Next.js Configuration
- **File `frontend/next.config.ts`**: `PASS` (Konfigurasi standar Next.js, tidak menggunakan `output: "export"`, `distDir`, `basePath` custom, atau rewrite yang memotong alur hosting Vercel).
- **File `frontend/tsconfig.json`**: `PASS` (TypeScript path mappings `@/*` terkonfigurasi benar ke `./src/*`).

---

## 5. Build Result
- **Local build command (`npm run build`)**: `PASS`
- **Output compilation**: Berhasil meluncurkan Next.js Turbopack compiler, melakukan *static page generation* untuk 14/14 router routes tanpa error TypeScript atau ESLint.

---

## 6. Route Result
- **File `frontend/src/app/page.tsx`**: `PASS` (Terverifikasi sebagai root URL `/`).
- **Daftar Route Terintegrasi**:
  - `/` (Beranda Publik)
  - `/login` (Prototype Login)
  - `/edukasi` (Materi Publik)
  - `/grafik` (Grafik Agregat Publik)
  - `/kader/dashboard` (Shared Workspace ADMIN + GURU)
  - `/kader/status-gizi` (Pengukuran Antropometri)
  - `/kader/skrining` (Pencatatan Hb & Tekanan Darah)
  - `/kader/ttd` (Pencatatan Tablet Tambah Darah)
  - `/kader/data-siswa` (Manajemen Siswa)
  - `/kader/edukasi-kelola` (Kelola Artikel)
  - `/admin/users` (Eksklusif ADMIN)
  - `/siswa/dashboard` (Eksklusif SISWA)
- **Status Route**: `PASS` (Seluruh rute Next.js App Router valid).

---

## 7. Middleware/Proxy Result
- **File `middleware.ts` / `proxy.ts`**: `NOT APPLICABLE` (Aplikasi tidak menggunakan middleware file kustom di tingkat folder `src` yang berisiko me-redirect global atau merusak respon serverless Vercel).

---

## 8. Environment Variable Result
- **Variabel `NEXT_PUBLIC_SANTARA_API_URL`**: `PASS` (Tersedia secara lokal di `.env.local` dan terarah ke Apps Script Web App production `@13` terverifikasi. Untuk Vercel, variabel ini wajib dikonfigurasi pada menu Environment Variables di Dashboard Vercel).

---

## 9. Root Cause
1. **Miskonfigurasi Root Directory**: Proyek dideploy ke Vercel menggunakan default Root Directory = `/` (root repositori). Vercel menganggap proyek sebagai static website biasa (karena tidak ada `package.json` di root `/`) dan me-deploy direktori tersebut tanpa menjalankan build Next.js. Karena tidak ada file `index.html` di root repositori, Vercel mengembalikan respon `404: NOT_FOUND`.
2. **Framework Detection Bypass**: Vercel gagal mendeteksi Next.js framework preset secara otomatis karena `package.json` tersembunyi di dalam folder `/frontend/`.

---

## 10. Fix Applied
Untuk menyelesaikan masalah ini secara permanen tanpa merusak arsitektur repositori lokal, konfigurasi proyek pada **Vercel Dashboard** wajib diubah sebagai berikut:

1. **Ubah Root Directory**: Buka **Vercel Settings > General**, ubah **Root Directory** dari `/` menjadi **`frontend`**.
2. **Konfigurasi Environment Variables**: Buka **Vercel Settings > Environment Variables**, tambahkan:
   - Key: `NEXT_PUBLIC_SANTARA_API_URL`
   - Value: `https://script.google.com/macros/s/AKfycby-x8OD8YHovfac2hf3R65WPGQYd1iR8lTDy06dafBzn9LFRPAjbEfYjZwiRzrE_AIayw/exec`
3. **Trigger Redeploy**: Lakukan deploy ulang pada tab **Deployments** di Vercel untuk membangun Next.js serverless functions secara benar.

---

## 11. Verification Result
- **Pengujian Server Produksi Lokal (`npm run start`)**: `PASS` (Server berhasil berjalan di port 3000 dan melayani permintaan HTTP status `200 OK` untuk `/`, `/login`, dan `/admin/users` secara responsif).

---

## 12. Remaining Issues
- **Backend Auth Upgrade**: Sesi otorisasi saat ini berjalan menggunakan prototype session (aktif profil) dan memerlukan upgrade ke server-side auth (password hashing & JWT token) jika ingin melepas status prototype warning banner.
