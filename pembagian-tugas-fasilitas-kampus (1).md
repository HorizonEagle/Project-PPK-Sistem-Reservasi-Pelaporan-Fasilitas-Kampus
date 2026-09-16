# Pembagian Tugas — Sistem Reservasi & Pelaporan Fasilitas Kampus (Laravel)

Tim: 4 orang. Aturan: 1 fitur = 1 orang = 1 branch. Framework: **Laravel** (Blade view tanpa styling untuk tahap ini). UI/CSS dikerjakan bareng-bareng di tahap paling akhir.

---

## 1. Kerangka (dibuat lebih dulu, disepakati bareng SEBELUM fitur dipecah)

Kerangka dibuat dalam satu sesi bersama, lalu di-push ke `main`/`develop`. Isinya:

1. **Migration** — bentuk tabel database, dibuat sekali di awal dan jadi otoritatif (beda dengan array JS yang gampang drift, migration bikin nama & tipe field resmi).
2. **Model kosong** (relasi `belongsTo`/`hasMany` saja, tanpa logic bisnis).
3. **Route list** (`routes/web.php`) — semua endpoint didaftarkan di awal, arahnya ke controller method yang isinya masih kosong (stub, return dummy/`response()->json([])`).
4. **Blade view kosong** — cuma struktur (`@foreach`, form tanpa `class`), tanpa Bootstrap/Tailwind.

Tujuannya sama seperti versi HTML/JS murni: modul lain bisa pakai route/controller milik orang lain sebagai stub sebelum implementasinya selesai, tanpa saling nunggu.

### Struktur proyek

```
routes/web.php                        → semua endpoint didaftarkan di sini sejak awal

resources/views/
  facilities/index.blade.php           → Pengunjung: daftar fasilitas + ketersediaan (US1, US2)
  auth/login.blade.php                  → Login (dipakai semua role)
  reservations/index.blade.php           → Pengguna: ajukan/riwayat/batalkan reservasi (US3-5)
  reports/index.blade.php                → Pengguna: lapor & lihat status kerusakan (US6-7)
  officer/dashboard.blade.php             → Petugas: antrian reservasi+laporan (US8-12)
  admin/dashboard.blade.php                → Admin: akun, data fasilitas, rekap+export (US13-17)

app/Models/
  Facility.php   Reservation.php   Report.php   User.php

app/Http/Controllers/
  FacilityController.php       → P1
  ReservationController.php     → P2
  ReportController.php           → P3
  AuthController.php (atau Breeze)  → P4
  AdminController.php               → P4

app/Http/Requests/
  StoreReservationRequest.php    → validasi jam operasional + kelipatan slot 30 menit (server-side, wajib)

database/migrations/
  create_facilities_table.php
  create_reservations_table.php
  create_reports_table.php
  (users table sudah bawaan Laravel, tinggal ditambah kolom role & status)
```

---

## 2. Pembagian Orang → Fitur

| Orang | Modul | User Story | File yang dipegang | Entity yang dimiliki |
|---|---|---|---|---|
| **P1** | Fasilitas & Ketersediaan | 1, 2, 16 | `FacilityController.php`, `Facility.php`, `facilities/*.blade.php` | `Facility` |
| **P2** | Reservasi | 3, 4, 5, 9, 10 | `ReservationController.php`, `Reservation.php`, `reservations/*.blade.php` | `Reservation` |
| **P3** | Laporan Kerusakan | 6, 7, 11, 12 | `ReportController.php`, `Report.php`, `reports/*.blade.php` | `Report` |
| **P4** | Auth, Akun, Dashboard, Rekap | 13, 14, 15, 17, + login (fondasi) + dashboard antrian (8) | `AuthController`, `AdminController`, view `officer/*`, `admin/*` | `User` |

Alasan pembagian per-entity (bukan per-role) tetap sama: tiap orang jadi satu-satunya yang menyentuh satu Model + Controller, jadi konflik file antar branch minim. US#8 (dashboard petugas) dan US#12 (tandai fasilitas rusak) tetap lintas modul, diselesaikan lewat pemanggilan method Model punya orang lain (§3), bukan lewat orang yang sama mengerjakan dua modul.

---

## 3. Kontrak Antar Modul (route + method, disepakati di tahap kerangka)

Nama route dan signature method disepakati dulu supaya orang lain bisa panggil endpoint/method milikmu sebagai stub sebelum implementasi aslimu selesai.

```
# Milik P1 — FacilityController
GET   /facilities                        index()      → searchFacilities(type, location, capacity)
GET   /facilities/{id}/availability        availability()
PATCH /facilities/{id}/status               setStatus()   ← dipanggil dari ReportController milik P3
POST  /facilities  |  PUT /facilities/{id}  |  DELETE /facilities/{id}   ← admin (US16)

# Milik P2 — ReservationController
POST   /reservations                        store()   ← pakai StoreReservationRequest utk validasi slot
DELETE /reservations/{id}                     cancel()   (oleh pemilik)
GET    /my/reservations                         myReservations()
PATCH  /reservations/{id}/approve | /reject       (petugas, US9)
PATCH  /reservations/{id}/officer-cancel           (petugas + alasan, US10)
        → internal: cek konflik pakai unique constraint di DB, bukan cuma query manual

# Milik P3 — ReportController
POST  /reports                          store()
GET   /my/reports                        myReports()
PATCH /reports/{id}/status                updateStatus()  ← saat 'diproses'/'selesai', panggil
                                                              Facility::setStatus() milik P1

# Milik P4 — AuthController / AdminController
POST  /login | POST /logout               (bisa pakai Laravel Breeze, tidak perlu dari nol)
middleware role:petugas | role:admin        guard tiap route, dipakai SEMUA modul lain
POST  /admin/officers                        registerOfficer() (US13)
POST  /admin/users                            registerUser() (US14)
PATCH /admin/users/{id}/verify | /reject         verifyUser() (US15)
GET   /admin/recap?format=csv|xlsx|pdf            exportRecap() (US17)
GET   /officer/dashboard                            getDashboardQueue()
                                                       ← baca reservasi status pending + report status 'baru'
```

---

## 4. Urutan Pengerjaan (bergantian)

Urutan tetap berdasarkan dependency, bukan urutan nomor orang:

1. **Sesi bareng**: migration + model kosong + daftar route + Blade kosong. Push ke `main`.
2. **Giliran P4 (auth dulu)** — cabang `feature/auth`. Modul lain butuh middleware role, jadi ini fondasi. Bisa pakai `laravel/breeze` supaya cepat, tinggal tambah kolom `role`/`status` di migration users. Merge ke `develop`.
3. **Giliran P1 (fasilitas)** — cabang `feature/fasilitas`. Reservasi & laporan butuh `availability()`/`setStatus()` asli. Merge ke `develop`.
4. **Giliran P2 (reservasi)** — cabang `feature/reservasi`, pull dari `develop` dulu supaya dapat auth+facility asli. Termasuk bikin `StoreReservationRequest` (validasi jam & slot). Merge ke `develop`.
5. **Giliran P3 (laporan)** — cabang `feature/laporan`, pull terbaru, panggil `Facility::setStatus()` yang sudah nyata (bukan stub). Merge ke `develop`.
6. **Giliran P4 lagi (admin & dashboard)** — cabang `feature/admin-dashboard`, semua data reservasi/laporan sudah ada untuk dashboard & export rekap. Merge ke `develop`.
7. **Tahap UI (bareng-bareng)** — baru boleh nambah CSS/styling di atas Blade view yang sudah jalan.

Tiap orang wajib `git pull` dari `develop` dan `php artisan migrate` ulang sebelum mulai gilirannya.

---

## 5. Database

**Relasional — PostgreSQL/MySQL, dikelola lewat Eloquent + Migration Laravel.**

### Skema tabel

**users** (extend tabel bawaan Laravel)
| kolom | tipe | keterangan |
|---|---|---|
| id | PK | |
| name, email | string | |
| password | string | (sudah di-hash otomatis) |
| role | enum | `pengguna`, `petugas`, `admin` |
| status | enum | `pending`, `verified`, `rejected` — US15 |

**facilities**
| kolom | tipe | keterangan |
|---|---|---|
| id | PK | |
| name, type, location, capacity | string/int | untuk pencarian US2 |
| status | enum | `aktif`, `perbaikan`, `nonaktif` |

**reservations**
| kolom | tipe | keterangan |
|---|---|---|
| id | PK | |
| facility_id, user_id | FK | |
| date, start_time, end_time | date/time | kelipatan 30 menit, divalidasi lewat `StoreReservationRequest` |
| purpose | text | |
| status | enum | `pending`, `approved`, `rejected`, `cancelled` |
| cancel_reason | string, nullable | US10 |
| **unique** (facility_id, date, start_time) | index | dipasang di migration untuk cegah bentrok slot di level DB, bukan cuma di controller |

**reports**
| kolom | tipe | keterangan |
|---|---|---|
| id | PK | |
| facility_id, user_id | FK | |
| category, description, photo_path | string/text | |
| status | enum | `baru`, `diproses`, `selesai`, `ditolak` |
| resolution_note | text, nullable | |
| handled_by | FK → users, nullable | petugas yang menangani |

### Yang berubah dibanding versi HTML/JS murni

- **Validasi server sudah otomatis kejawab** lewat Form Request — bukan lagi "ponytail" yang harus diingat buat diulang nanti, karena dari awal validasinya memang di server.
- **Cegah bentrok slot** dijamin dua lapis: `unique` constraint di migration + `DB::transaction()` saat approve, supaya dua petugas approve barengan tidak tabrakan (race condition) — ini nggak bisa dijamin kalau cuma pakai array/localStorage di JS.
- **Auth/role** tinggal pakai scaffolding Breeze + middleware, tidak perlu ditulis dari nol seperti `js/auth.js` di versi sebelumnya.
- **Tidak perlu lagi mock `db.js`** — dari awal sudah connect ke DB asli lewat Eloquent, jadi tidak ada tahap "nanti diganti dari array ke DB".
