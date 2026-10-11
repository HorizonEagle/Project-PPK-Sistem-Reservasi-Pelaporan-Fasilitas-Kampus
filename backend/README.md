# 🛠️ Backend API — Sistem Reservasi & Pelaporan Fasilitas Kampus

Server API berbasis Next.js 16 (Route Handlers) yang beroperasi pada port `3001` sebagai headless backend untuk melayani aplikasi reservasi fasilitas kampus dan pelaporan kerusakan.

## 📋 Fitur & Modul Utama
- **Autentikasi & RBAC**: Registrasi, login dengan JWT (`jose`), hashing password (`bcryptjs`), verifikasi akun admin, dan proteksi role (`user`, `officer`, `admin`).
- **Fasilitas**: Manajemen katalog fasilitas, kapasitas, tipe, dan pengecekan jadwal ketersediaan slot.
- **Reservasi**: Sistem slot waktu 30 menit (07:00-20:00 WIB), deteksi tumpang tindih waktu (conflict checking), approval/rejection oleh petugas.
- **Pelaporan Kerusakan**: Pelaporan fasilitas rusak, update status penanganan, integrasi otomatis status fasilitas (`under_maintenance`).
- **Ekspor Data**: Ekspor rekapitulasi data ke format CSV, Excel (.xls), dan PDF printer-friendly (.html).
- **Monitoring Prometheus**: Endpoint scraping `/api/metrics` yang mencakup metrik sistem, metrik HTTP latency, dan database gauges.
- **Automated Testing**: 129 pengujian unit & integrasi otomatis menggunakan Vitest.

## 📜 Skrip yang Tersedia

```bash
# Menjalankan server development di port 3001
npm run dev

# Menjalankan automated test suite (Vitest)
npm test

# Menjalankan test suite dengan mode watch
npm run test:watch

# Menjalankan test suite dengan laporan coverage V8
npm run test:coverage

# Linting kode
npm run lint

# Build production
npm run build

# Menjalankan server production di port 3001
npm run start

# Database & Prisma
npm run db:generate    # Generate Prisma Client
npm run db:migrate     # Jalankan migrasi schema
npm run db:seed        # Jalankan seeder akun demo & fasilitas awal
npm run db:reset       # Reset database dan jalankan seeder
```

## 🧪 Struktur Pengujian (`__tests__/`)

```
__tests__/
├── unit/
│   ├── slot-utils.test.ts             # Logika 26 slot 30 menit, jam operasional, date parsing
│   ├── auth.test.ts                   # Password bcrypt hashing & JWT token verification
│   ├── export-utils.test.ts           # Format CSV, HTML printer table, sanitasi XSS
│   ├── validators-auth.test.ts        # Skema Zod registrasi, login, pembuatan akun
│   ├── validators-facility.test.ts    # Skema Zod fasilitas & filter jadwal
│   ├── validators-reservation.test.ts # Skema Zod reservasi & alasan penolakan
│   └── validators-report.test.ts      # Skema Zod pelaporan & catatan resolusi
└── integration/
    ├── auth-routes.test.ts            # Route handler login & register (mock Prisma)
    └── metrics.test.ts                # Scrape endpoint Prometheus & withMetrics wrapper
```

## 📊 Metrik Prometheus (`/api/metrics`)
Endpoint `GET /api/metrics` mengekspos data metrik berikut:
- `http_requests_total`: Total hit HTTP API per method, route, dan status kode.
- `http_request_duration_seconds`: Histogram latensi per route.
- `campus_db_up`: Status konektivitas database (1 jika terhubung, 0 jika gagal).
- `campus_users`: Jumlah user per status (active, pending, rejected).
- `campus_facilities`: Jumlah fasilitas per status (active, inactive, under_maintenance).
- `campus_reservations`: Jumlah reservasi per status (pending, approved, rejected, cancelled).
- `campus_reports`: Jumlah laporan per status (new_report, in_progress, resolved, rejected).

Untuk konfigurasi mendalam, silakan baca [BACKEND_ARCHITECTURE.md](../BACKEND_ARCHITECTURE.md).
