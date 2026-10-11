# 🖥️ Frontend UI — Sistem Reservasi & Pelaporan Fasilitas Kampus

Aplikasi web antarmuka pengguna berbasis Next.js 16 (App Router) yang berjalan di port `3000`, terhubung ke Backend API (port `3001`).

## 📋 Fitur & Halaman
- **Katalog Publik**:
  - `/`: Halaman utama / landing page aplikasi FASKAM.
  - `/facilities`: Katalog fasilitas dengan filter kategori dan status.
  - `/facilities/:id`: Detail fasilitas dan kalender ketersediaan 26 slot waktu.
  - `/login` & `/register`: Autentikasi pengguna dan registrasi akun baru.
- **Dashboard Pengguna (`role: user`)**:
  - `/dashboard`: Ringkasan aktivitas dan reservasi aktif.
  - `/dashboard/reservations`: Daftar reservasi pengguna dan form pengajuan baru.
  - `/dashboard/reports`: Daftar laporan kerusakan dan form pelaporan baru.
- **Dashboard Petugas (`role: officer`)**:
  - `/petugas`: Antrian permohonan reservasi fasilitas.
  - `/petugas/reservations`: Verifikasi persetujuan (approve) atau penolakan (reject) jadwal.
  - `/petugas/reports`: Penanganan laporan kerusakan fasilitas.
  - `/petugas/facilities`: Pembaruan status operasional fasilitas.
- **Dashboard Admin (`role: admin`)**:
  - `/admin`: Statistik global dan antrian verifikasi user baru.
  - `/admin/facilities`: Manajemen CRUD fasilitas kampus.
  - `/admin/users`: Manajemen pengguna dan verifikasi akun pending.
  - `/admin/reports`: Rekapitulasi laporan dan ekspor data (CSV, Excel, PDF).

## 📜 Skrip yang Tersedia

```bash
# Menjalankan development server di port 3000
npm run dev

# Membangun aplikasi untuk production
npm run build

# Menjalankan production server
npm run start

# Linting kode sumber
npm run lint
```

## ⚙️ Konfigurasi Environment (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🎨 Tech Stack UI
- **Framework**: Next.js 16 (App Router, Server & Client Components)
- **Styling**: Tailwind CSS 4
- **State & Auth**: React Context API (`auth-context.tsx`), synchronize token dengan localStorage dan Cookies untuk proteksi rute di `middleware.ts`.
- **Icons**: Lucide Icons
