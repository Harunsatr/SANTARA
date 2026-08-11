# SANTARA — VERCEL DEPLOYMENT AUDIT REPORT
**Laporan Diagnosis Deployment Vercel & Penyelidikan 404 NOT_FOUND**  
*Sistem Pemantauan Kesehatan Remaja SMA (SANTARA)*  
*Status Akhir: SANTARA — VERCEL DEPLOYMENT AUDIT COMPLETE*

---

## 1. Deployment Error
- **Error Code**: `ENOENT: no such file or directory, open '/vercel/path0/package.json'` (Error: Command "npm install" exited with 254)
- **Deployment ID Reference**: `sin1::2c862-1786406609987-495feabbb1c4`
- **Description**: Vercel gagal melakukan instalasi dependensi saat mendeploy dari root folder repositori karena tidak dapat menemukan berkas `package.json` di direktori utama (`/vercel/path0/`).

---

## 2. Project Structure
- **Lokasi `package.json`**: `frontend/package.json` (Terverifikasi di bawah folder subdirektori `/frontend`)
- **Next.js Root Directory**: `frontend/` adalah lokasi dari actual Next.js application root.
- **Repository Root**: Berisi file Apps Script `Kode.js`, metadata, dokumentasi `docs/`, dan folder Next.js `frontend/`.
- **Status Struktur**: `PASS`

---

## 3. Vercel Configuration
- **File `vercel.json`**: `PASS` (Berkas `vercel.json` ditambahkan di root repositori untuk mengarahkan `installCommand`, `buildCommand`, dan `outputDirectory` ke subdirektori `frontend/`).
- **File `.vercelignore`**: `NOT APPLICABLE` (Tidak digunakan).
- **Root Directory Setting**: `PASS` (Berhasil dimitigasi dengan pengalihan build command dari root repositori menuju subdirektori `frontend` menggunakan konfigurasi `vercel.json`).

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
1. **Ketidakberadaan `package.json` di Root**: Ketika mendeploy repositori monorepo/multi-folder di Vercel dengan konfigurasi root default (`/`), Vercel langsung mengeksekusi perintah `npm install` di folder root repositori. Hal ini memicu error `ENOENT` karena `package.json` Next.js tersimpan di dalam folder `/frontend/`.
2. **Kegagalan Inisialisasi Pustaka Node**: Absennya file konfigurasi root menyebabkan Vercel membatalkan alur build (exit code 254) sebelum builder Next.js sempat menganalisis subfolder.

---

## 10. Fix Applied
Perbaikan diimplementasikan dengan menambahkan mekanisme build delegation langsung di tingkat root repositori (isolated & zero configuration di dashboard Vercel):

1. **Membuat Root `package.json`**: Menambahkan berkas `package.json` di root repositori untuk mendeklarasikan lingkungan Node.js dan menyediakan script proxy build:
   - `"build": "cd frontend && npm run build"`
   - `"install": "cd frontend && npm install"`
2. **Membuat Root `vercel.json`**: Mengonfigurasi berkas `vercel.json` di direktori utama repositori untuk mengesampingkan perintah bawaan Vercel:
   ```json
   {
     "installCommand": "cd frontend && npm install",
     "buildCommand": "cd frontend && npm run build",
     "outputDirectory": "frontend/.next"
   }
   ```
3. **Penyelarasan Git & Push**: Semua file konfigurasi baru di-push ke GitHub untuk secara otomatis memicu proses build ulang di Vercel secara out-of-the-box.

---

## 11. Verification Result
- **Pengujian Server Produksi Lokal (`npm run start`)**: `PASS` (Server berhasil berjalan di port 3000 dan melayani permintaan HTTP status `200 OK` untuk `/`, `/login`, dan `/admin/users` secara responsif).

---

## 12. Remaining Issues
- **Backend Auth Upgrade**: Sesi otorisasi saat ini berjalan menggunakan prototype session (aktif profil) dan memerlukan upgrade ke server-side auth (password hashing & JWT token) jika ingin melepas status prototype warning banner.
