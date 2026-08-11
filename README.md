# SANTARA — Sistem Pemantauan Kesehatan Remaja SMA

SANTARA adalah sistem pemantauan dan pengelolaan kesehatan remaja SMA yang terintegrasi, dirancang khusus untuk memantau status gizi (antropometri), skrining kesehatan (kadar Hb anemia & tekanan darah), serta kepatuhan konsumsi Tablet Tambah Darah (TTD) siswa.

---

## 📂 Struktur Repositori

Repositori ini terdiri dari modul-modul berikut:

- **`frontend/`**: Aplikasi web Next.js App Router dengan arsitektur UI premium berbasis Tailwind CSS/Vanilla CSS, lengkap dengan sistem otorisasi multi-role (**ADMIN**, **GURU**, **SISWA**), visualisasi data grafik, dan integrasi API proxy.
- **`Kode.js`**: Kode sumber Google Apps Script (GAS) REST API v2.0 yang bertindak sebagai backend serverless dan berinteraksi langsung dengan database Google Sheets.
- **`appsscript.json`**: File manifest Google Apps Script.
- **`docs/`**: Kumpulan dokumen laporan arsitektur, skema basis data, matriks kapabilitas API, dan laporan audit keamanan fungsional role.
- **`Rancangan Produk Santara.docx`**: Dokumen spesifikasi kebutuhan produk resmi.

---

## 🚀 Panduan Panduan Deploy ke Vercel (Next.js Frontend)

Aplikasi frontend SANTARA dirancang untuk dideploy secara instan ke platform **Vercel** dengan konfigurasi minimal. Karena folder Next.js berada di dalam subdirektori `/frontend`, ikuti langkah-langkah berikut:

### Langkah 1: Hubungkan Repositori ke Vercel
1. Masuk ke dashboard [Vercel](https://vercel.com).
2. Klik tombol **Add New** lalu pilih **Project**.
3. Hubungkan akun GitHub Anda dan pilih repositori `SANTARA`.

### Langkah 2: Konfigurasi Project Settings
Di halaman konfigurasi project sebelum deploy, lakukan pengaturan berikut:
1. **Framework Preset**: Vercel akan otomatis mendeteksi **Next.js** setelah langkah selanjutnya.
2. **Root Directory**: Klik tombol **Edit** di sebelah *Root Directory*, lalu pilih folder **`frontend`** (bukan root repositori). Klik **Continue**.
3. **Build & Development Settings**: Biarkan default (Vercel akan mendeteksi pengaturan build otomatis).

### Langkah 3: Konfigurasi Environment Variables
SANTARA membutuhkan endpoint API backend untuk sinkronisasi data. Di bagian **Environment Variables**, tambahkan variabel berikut:

- **Key**: `NEXT_PUBLIC_SANTARA_API_URL`
- **Value**: `https://script.google.com/macros/s/YOUR_APPS_SCRIPT_DEPLOYMENT_ID/exec`

*Catatan: Nilai di atas mengarah langsung ke Web App Apps Script production `@13` yang terhubung dengan live database Google Sheets.*

### Langkah 4: Klik Deploy
Klik tombol **Deploy**. Vercel akan memulai proses instalasi dependensi, optimasi bundel Next.js, dan mempublikasikan aplikasi Anda dalam waktu kurang dari 2 menit.

---

## 🛠️ Pengembangan Lokal

Untuk menjalankan aplikasi frontend di komputer lokal Anda:

1. Buka terminal dan masuk ke direktori frontend:
   ```bash
   cd frontend
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
4. Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.
