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
├── backend/       ← API Routes Next.js (port 3001)
│   ├── prisma/    ← Schema, migrasi, seeder
│   ├── lib/       ← Prisma client, auth helper, validators
│   └── src/app/api/  ← Route Handlers
├── frontend/      ← UI Next.js (port 3000)
│   ├── components/   ← UI components, layout
│   ├── lib/          ← API client, auth-context, utils
│   ├── types/        ← Shared TypeScript interfaces
│   └── src/app/      ← Pages
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

## 👥 Pembagian Tim

| Role | Modul | Scope SRS |
|------|-------|-----------|
| **Role 1** | AUTH & USER + Shared Files | §5.1.1, §5.1.5 |
| Role 2 | FACILITY | §5.1.2 |
| Role 3 | RESERVATION | §5.1.3 |
| Role 4 | REPORT & EXPORT | §5.1.4, §5.1.6 |

## 🌐 API Endpoints

Base URL: `http://localhost:3001/api`

- `POST /api/auth/register` — Registrasi
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Profil user
- `GET /api/users` — List user (Admin)
- `POST /api/users` — Buat akun (Admin)
- `PATCH /api/users/:id/verify` — Verifikasi akun (Admin)

Lihat [`master_prompt2`](./master_prompt2) untuk daftar endpoint lengkap.

## 📌 Konvensi Commit

```
feat(auth): implement login API with JWT
fix(user): fix email validation
style(admin): improve users table layout
chore(docker): update compose configuration
```

---

> Lihat [`master_prompt2`](./master_prompt2) untuk dokumentasi lengkap sistem.