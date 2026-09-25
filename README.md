# 🏫 Sistem Reservasi & Pelaporan Fasilitas Kampus

Aplikasi web untuk mengelola reservasi fasilitas kampus (ruang kelas, aula, laboratorium, alat, lapangan) dan pelaporan kerusakan.

## 📋 Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Backend | Next.js 16 (API Routes only) · Port 3001 |
| Frontend | Next.js 16 (App Router UI) · Port 3000 |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT (jose) + bcrypt |
| Validasi | Zod |
| Styling | Tailwind CSS 4 |
| Runtime | Docker + Docker Compose |

## 🗂️ Struktur Repository

```
Project-PPK-Sistem-Reservasi-Pelaporan-Fasilitas-Kampus/
├── backend/                  ← API Server Next.js (port 3001)
│   ├── prisma/               ← Schema, migrasi, seeder
│   ├── lib/                  ← auth-utils, cors, prisma client, validators
│   └── src/app/api/          ← Route Handlers
├── frontend/                 ← UI Next.js (port 3000)
│   ├── components/           ← UI design system, layout
│   ├── lib/                  ← API client, auth-context, utils
│   ├── types/                ← Shared TypeScript interfaces
│   └── src/app/              ← Pages
│       ├── dashboard/        ← User dashboard (role: user)
│       ├── petugas/          ← Officer dashboard (role: officer)
│       └── admin/            ← Admin dashboard (role: admin)
├── SYSTEM_DESIGN.md          ← Arsitektur teknis & database schema
└── docker-compose.yml
```

## 🚀 Setup Lokal

### Prasyarat
- Node.js 18+
- Docker & Docker Compose

### Langkah-langkah

```bash
# 1. Clone repository
git clone <repo-url>
cd Project-PPK-Sistem-Reservasi-Pelaporan-Fasilitas-Kampus

# 2. Jalankan PostgreSQL via Docker
docker compose up db -d

# 3. Setup Backend
cd backend
cp ../.env.example .env          # sesuaikan jika perlu
npm install
npm run db:generate               # generate Prisma Client
npm run db:migrate                # jalankan migrasi
npx prisma db seed                # jalankan seeder
npm run dev                       # start di port 3001

# 4. Setup Frontend (terminal baru)
cd frontend
npm install
npm run dev                       # start di port 3000

# 5. Buka http://localhost:3000
```

## 👤 Akun Demo (Setelah Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kampus.ac.id | admin123 |
| Petugas | petugas@kampus.ac.id | petugas123 |
| Pengguna | budi@mahasiswa.ac.id | user123 |
| Pengguna | siti@mahasiswa.ac.id | user123 |

## 👥 Pembagian Tim

| Role | Modul | Scope SRS |
|------|-------|-----------|
| **Role 1** | AUTH & USER + Shared Files | §5.1.1, §5.1.5 |
| Role 2 | FACILITY | §5.1.2 |
| Role 3 | RESERVATION | §5.1.3 |
| Role 4 | REPORT & EXPORT | §5.1.4, §5.1.6 |

## 🌐 API Endpoints

Base URL: `http://localhost:3001/api`

### Auth
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/register` | ❌ | Registrasi akun baru (status: pending_verification) |
| POST | `/api/auth/login` | ❌ | Login, returns JWT token |
| POST | `/api/auth/logout` | ❌ | Logout |
| GET | `/api/auth/me` | ✅ | Profil user yang sedang login |

### Facilities
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/facilities` | ❌ | List fasilitas (publik, bisa filter type/status) |
| GET | `/api/facilities/:id` | ❌ | Detail fasilitas |
| GET | `/api/facilities/:id/schedule` | ❌ | Jadwal slot 30 menit untuk tanggal tertentu |
| POST | `/api/facilities` | ✅ Admin | Tambah fasilitas baru |
| PATCH | `/api/facilities/:id` | ✅ Admin/Officer | Edit detail atau ubah status fasilitas |

### Reservations
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/reservations` | ✅ | List reservasi (user: milik sendiri, officer/admin: semua) |
| GET | `/api/reservations/:id` | ✅ | Detail reservasi |
| POST | `/api/reservations` | ✅ User | Ajukan reservasi baru |
| PATCH | `/api/reservations/:id` | ✅ Officer/Admin | Approve atau reject reservasi |
| PATCH | `/api/reservations/:id/cancel` | ✅ | Batalkan reservasi (user atau admin) |

### Reports
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/reports` | ✅ | List laporan (user: milik sendiri, officer/admin: semua) |
| GET | `/api/reports/:id` | ✅ | Detail laporan |
| POST | `/api/reports` | ✅ User | Buat laporan kerusakan baru |
| PATCH | `/api/reports/:id` | ✅ Officer | Update status laporan (in_progress / resolved / rejected) |

### Users (Admin only)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/users` | ✅ Admin | List semua user (bisa filter role/status) |
| POST | `/api/users` | ✅ Admin | Buat akun baru (langsung aktif) |
| GET | `/api/users/:id` | ✅ Admin | Detail user |
| PATCH | `/api/users/:id` | ✅ Admin | Edit data user |
| PATCH | `/api/users/:id/verify` | ✅ Admin | Verifikasi atau tolak akun pending |

### Dashboard & Export
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/dashboard` | ✅ | Statistik ringkasan (user: personal, admin/officer: global + totalUsers) |
| GET | `/api/export` | ✅ Admin/Officer | Ekspor data ke **CSV / Excel (.xls) / PDF (.html)** |

#### Query params `/api/export`:
| Param | Nilai | Keterangan |
|-------|-------|-----------|
| `type` | `reservations` \| `reports` | Jenis data yang diekspor |
| `format` | `csv` \| `excel` \| `pdf` | Format file output (default: `csv`) |
| `date_from` | `YYYY-MM-DD` | Filter dari tanggal (opsional) |
| `date_to` | `YYYY-MM-DD` | Filter sampai tanggal (opsional) |
| `status` | status enum | Filter by status (opsional) |
| `facility_id` | ID fasilitas | Filter by fasilitas (opsional) |

## 🔒 Arsitektur CORS & Auth

### CORS (Cross-Origin Resource Sharing)
CORS dihandle di 3 level (triple-layer) untuk mengatasi berbagai edge case di Next.js 16:
1. **`next.config.ts`** — CORS headers pada semua response `/api/*` (termasuk preflight auto-generated)
2. **`middleware.ts`** — Safety net OPTIONS handler + CORS pada error response (401/403)
3. **Route-level `export { OPTIONS }`** — Setiap file route mengekspor handler dari `lib/cors.ts`

### Auth Flow
1. User login → backend generate JWT (`{ userId, email, role }`) → frontend simpan di `localStorage` + `cookie`
2. Setiap API call → frontend kirim `Authorization: Bearer <token>` di header
3. Backend route handler memanggil `getAuthUser(request)` dari `lib/auth-utils.ts` untuk decode JWT langsung
4. Frontend middleware baca cookie `token` → verifikasi JWT → proteksi route `/dashboard/*`, `/petugas/*`, `/admin/*`

> **Penting**: Di Next.js 16, middleware **tidak** meneruskan custom headers ke App Router route handlers.
> Karena itu, setiap route handler decode JWT sendiri via `getAuthUser()`, bukan membaca `x-user-id`/`x-user-role`.

## 🗺️ Halaman Frontend

| Path | Role | Deskripsi |
|------|------|-----------|
| `/` | Publik | Landing page (auth-aware) |
| `/facilities` | Publik | Katalog fasilitas dengan filter |
| `/facilities/:id` | Publik | Detail fasilitas + jadwal slot |
| `/login` | Publik | Form login |
| `/register` | Publik | Form registrasi |
| `/dashboard` | User | Overview personal |
| `/dashboard/reservations` | User | Daftar reservasi saya |
| `/dashboard/reservations/new` | User | Ajukan reservasi baru |
| `/dashboard/reservations/:id` | User | Detail reservasi |
| `/dashboard/reports` | User | Daftar laporan saya |
| `/dashboard/reports/new` | User | Buat laporan kerusakan |
| `/dashboard/reports/:id` | User | Detail laporan |
| `/petugas` | Officer | Overview antrian |
| `/petugas/reservations` | Officer | Antrian reservasi (approve/reject) |
| `/petugas/reports` | Officer | Antrian laporan (tangani/selesaikan) |
| `/petugas/facilities` | Officer | Toggle status fasilitas |
| `/admin` | Admin | Dashboard admin + pending users |
| `/admin/facilities` | Admin | CRUD fasilitas |
| `/admin/facilities/:id/edit` | Admin | Edit fasilitas |
| `/admin/users` | Admin | Kelola semua pengguna |
| `/admin/users/create` | Admin | Buat akun baru |
| `/admin/users/:id` | Admin | Detail user + verifikasi + ubah role |
| `/admin/reports` | Admin | Rekap statistik + ekspor data |

## 📌 Konvensi Commit

```
feat(auth): implement login API with JWT
fix(export): add excel and pdf format support
fix(user): fix email validation
style(admin): improve users table layout
chore(docker): update compose configuration
```

## 📚 Ringkasan Sistem & Aturan Bisnis

Meskipun detail spesifikasi dan desain sistem dikelola dalam dokumen internal, berikut adalah beberapa prinsip dan alur utama yang digunakan dalam sistem ini:

1. **Alur Reservasi & Manajemen Slot**
   - Waktu operasional dibatasi antara **07:00 – 20:00 WIB**.
   - Sistem slot berjalan dalam kelipatan 30 menit (contoh: 07:00-07:30). Total terdapat 26 slot per hari untuk setiap fasilitas.
   - Pengecekan konflik dilakukan di backend untuk memastikan tidak ada dua reservasi *approved* yang saling tumpang tindih untuk fasilitas dan waktu yang sama.

2. **Role-Based Access Control (RBAC)**
   - **User**: Dapat meminjam fasilitas dan melaporkan kerusakan.
   - **Officer (Petugas)**: Mengurus *approval*/*rejection* reservasi dan memproses laporan kerusakan (mengubah status).
   - **Admin**: Memiliki akses tak terbatas (CRUD Fasilitas, kelola User/Role, Verifikasi Akun Baru, serta rekap data dan ekspor CSV/Excel/PDF).
   
3. **Ekspor Data**
   Sistem mendukung ekspor data Laporan dan Reservasi (difilter berdasarkan tanggal/status) langsung dari API Backend yang mendukung tiga format rendering:
   - **CSV**: Text-based standar.
   - **Excel (.xls)**: XML Spreadsheet untuk kompatibilitas Microsoft Office/Google Sheets.
   - **PDF (.html)**: Versi HTML Printer-Friendly yang di-generate dari backend untuk disimpan sebagai PDF melalui browser.