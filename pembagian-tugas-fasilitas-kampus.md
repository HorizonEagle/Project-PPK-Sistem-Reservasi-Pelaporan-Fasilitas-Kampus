# Pembagian Tugas — Sistem Reservasi & Pelaporan Fasilitas Kampus

Tim: 4 orang. Aturan: 1 fitur = 1 orang = 1 branch. Tahap ini **HTML struktur + JS logic saja, tanpa styling/UI**. UI dikerjakan bareng-bareng di tahap paling akhir.

---

## 1. Kerangka (dibuat lebih dulu, disepakati bareng SEBELUM fitur dipecah)

Kerangka dibuat dalam satu sesi bersama (bukan oleh 1 orang sendirian), lalu di-push ke `main`/`develop`. Kerangka berisi dua hal:

1. **File HTML kosong** — cuma struktur (`id`/`data-*` sebagai "colokan"), tanpa CSS, tanpa layout cantik.
2. **Kontrak data (`js/db.js` + `js/schema.js`)** — bentuk objek Facility/Reservation/Report/User yang disepakati semua orang, supaya modul lain bisa dipakai sebagai stub sebelum diimplementasi penuh.

Ini penting: karena "1 fitur 1 orang", modul lain harus bisa memanggil fungsi milik orang lain sebagai **stub** (return dummy dulu) tanpa nunggu implementasi selesai.

### Struktur file

```
/index.html          → Pengunjung: daftar fasilitas + ketersediaan (US1, US2)
/auth.html            → Login (dipakai semua role)
/reservasi.html        → Pengguna: ajukan/riwayat/batalkan reservasi (US3-5)
/laporan.html          → Pengguna: lapor & lihat status kerusakan (US6-7)
/petugas.html           → Petugas: antrian reservasi+laporan, approve/reject (US8-12)
/admin.html              → Admin: akun, data fasilitas, rekap+export (US13-17)

/js/db.js              → mock database (array in-memory, nanti diganti fetch ke API asli)
/js/schema.js           → definisi bentuk objek (lihat §3)
/js/auth.js             → login/session/role-check (P4)
/js/facility.js          → CRUD fasilitas + cek ketersediaan (P1)
/js/reservation.js        → ajukan/batalkan/approve/reject reservasi (P2)
/js/report.js              → lapor kerusakan + resolusi (P3)
/js/admin.js                 → kelola akun + export rekap (P4)
```

### Isi tiap file HTML (kerangka, TANPA styling)

Tiap file cuma berisi container kosong dengan `id`, tidak ada tag `<style>`, tidak ada class Bootstrap/Tailwind. Contoh isi `reservasi.html`:

```html
<!DOCTYPE html>
<html>
<head><title>Reservasi</title></head>
<body>
  <div id="reservation-form"></div>
  <div id="reservation-history"></div>
  <script src="js/schema.js"></script>
  <script src="js/db.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/facility.js"></script>
  <script src="js/reservation.js"></script>
</body>
</html>
```

Pola yang sama dipakai di semua file: `id` container kosong + urutan `<script>` sesuai dependency modul. Yang berhak nambah/ubah isi dalam container hanya pemilik fitur itu.

---

## 2. Pembagian Orang → Fitur

| Orang | Modul | User Story | File yang dipegang | Entity yang dimiliki |
|---|---|---|---|---|
| **P1** | Fasilitas & Ketersediaan | 1, 2, 16 | `index.html`, `js/facility.js` | `Facility` |
| **P2** | Reservasi | 3, 4, 5, 9, 10 | `reservasi.html`, `js/reservation.js` | `Reservation` |
| **P3** | Laporan Kerusakan | 6, 7, 11, 12 | `laporan.html`, `js/report.js` | `Report` |
| **P4** | Auth, Akun, Dashboard, Rekap | 13, 14, 15, 17, + login (fondasi) + dashboard antrian (8) | `auth.html`, `admin.html`, `petugas.html`, `js/auth.js`, `js/admin.js` | `User/Account` |

Kenapa dibagi begini, bukan per-role: tiap orang jadi pemilik tunggal **satu entity data**, jadi tabrakan file/logic antar orang minim. US #8 (dashboard petugas) dan #12 (tandai fasilitas rusak) memang lintas modul — solusinya lewat kontrak fungsi di §3, bukan orang yang sama harus kerjakan dua-duanya.

Catatan silang:
- **US 9, 10** (approve/reject/cancel reservasi oleh petugas) tetap masuk P2, karena itu operasi pada entity `Reservation`.
- **US 11, 12** (ubah status laporan + tandai fasilitas rusak) masuk P3, tapi `report.js` memanggil `facility.js` punya P1 lewat fungsi `setFacilityStatus()` — bukan menulis langsung ke data fasilitas.
- **US 8** (dashboard antrian) masuk P4 karena sifatnya cuma agregasi (baca data reservasi pending + laporan baru), tidak memiliki entity baru.

---

## 3. Kontrak Fungsi Antar Modul (disepakati di tahap kerangka)

Supaya orang lain bisa pakai fungsimu sebagai stub sebelum kamu selesai, sepakati signature ini dulu di `js/schema.js` — isi fungsi boleh nyusul, tapi nama & parameter tidak berubah-ubah.

```js
// js/facility.js — milik P1
searchFacilities({ type, location, minCapacity })      // → Facility[]
getAvailability(facilityId, date)                       // → { slot: 'available'|'booked' }[]
setFacilityStatus(facilityId, status, reportId)          // dipanggil P3. status: 'aktif'|'perbaikan'|'nonaktif'
addFacility(data) / editFacility(id, data) / deactivateFacility(id)

// js/reservation.js — milik P2
createReservation({ facilityId, userId, date, start, end, purpose })
cancelReservation(reservationId, userId)
getMyReservations(userId)                                 // → Reservation[]
approveReservation(id, officerId) / rejectReservation(id, officerId)
cancelByOfficer(id, officerId, reason)
checkSlotConflict(facilityId, date, start, end)             // dipakai internal, panggil getAvailability milik P1

// js/report.js — milik P3
createReport({ facilityId, userId, category, description, photoUrl })
getMyReports(userId)
updateReportStatus(reportId, status, officerId, resolutionNote)
                                                              // saat status jadi 'diproses'/'selesai', panggil setFacilityStatus() punya P1

// js/auth.js — milik P4, dipakai SEMUA modul lain
login(email, password) / logout() / getCurrentUser()          // → { id, role } atau null
requireRole(role)                                               // guard sederhana dipanggil tiap halaman

// js/admin.js — milik P4
registerOfficer(data) / registerUser(data)
verifyUser(userId) / rejectUser(userId)
exportRecap(format, filters)                                      // format: 'csv'|'xlsx'|'pdf'
getDashboardQueue()                                                 // panggil getMyReservations-status-pending & report status 'baru'
```

Fungsi ini di-*stub* di kerangka awal (return array kosong / `null`), lalu tiap orang isi implementasi asli di branch fiturnya sendiri.

---

## 4. Urutan Pengerjaan (bergantian, satu orang jalan dulu baru berikutnya)

Karena aturannya satu fitur satu orang dan gantian (bukan paralel bebas), urutannya dibuat berdasarkan dependency, bukan urutan nomor orang:

1. **Sesi bareng**: susun kerangka HTML + `schema.js` (bentuk data) + signature fungsi di §3. Push ke `main`.
2. **Giliran P4 (auth dulu)** — cabang `feature/auth`. Semua modul lain butuh `getCurrentUser()`/`requireRole()`, jadi ini fondasi. Setelah selesai, merge ke `develop`.
3. **Giliran P1 (fasilitas)** — cabang `feature/fasilitas`. Reservasi & laporan butuh `getAvailability()`/`setFacilityStatus()`. Merge ke `develop`.
4. **Giliran P2 (reservasi)** — cabang `feature/reservasi`, pull dulu dari `develop` supaya dapat auth+facility asli (bukan stub). Merge ke `develop`.
5. **Giliran P3 (laporan)** — cabang `feature/laporan`, pull terbaru, implementasi `setFacilityStatus()` call ke modul P1 yang sudah nyata. Merge ke `develop`.
6. **Giliran P4 lagi (admin & dashboard)** — cabang `feature/admin-dashboard`, sekarang semua data (reservasi, laporan) sudah nyata untuk dipakai dashboard & rekap export. Merge ke `develop`.
7. **Tahap UI (bareng-bareng)** — baru boleh nambah CSS/styling di atas kerangka yang sudah jalan.

Tiap orang wajib `pull` dari `develop` sebelum mulai gilirannya, supaya stub yang dipakai adalah versi asli terbaru, bukan stub kosong.

---

## 5. Rekomendasi Database

**Relasional (PostgreSQL disarankan, MySQL/MariaDB alternatif setara)** — dipilih karena:
- Relasi kuat antar fasilitas–reservasi–laporan–user (foreign key).
- Butuh constraint transaksional untuk **cegah bentrok slot** (US9) — ini lebih aman dijamin di level DB (`UNIQUE` constraint), bukan cuma di logic JS.
- Kebutuhan export rekap (US17) lebih gampang lewat query agregasi SQL (`GROUP BY`, `COUNT`) dibanding NoSQL.

### Skema tabel

**users**
| kolom | tipe | keterangan |
|---|---|---|
| id | PK | |
| name, email | text | |
| password_hash | text | |
| role | enum | `pengguna`, `petugas`, `admin` |
| status | enum | `pending`, `verified`, `rejected` — untuk US15 |

**facilities**
| kolom | tipe | keterangan |
|---|---|---|
| id | PK | |
| name, type, location, capacity | text/int | untuk pencarian US2 |
| status | enum | `aktif`, `perbaikan`, `nonaktif` |

**reservations**
| kolom | tipe | keterangan |
|---|---|---|
| id | PK | |
| facility_id, user_id | FK | |
| date, start_time, end_time | date/time | kelipatan 30 menit, divalidasi di server |
| purpose | text | |
| status | enum | `pending`, `approved`, `rejected`, `cancelled` |
| cancel_reason | text | nullable, dipakai US10 |
| **UNIQUE** (facility_id, date, start_time) **WHERE status='approved'** | | mencegah bentrok jadwal di level DB |

**reports**
| kolom | tipe | keterangan |
|---|---|---|
| id | PK | |
| facility_id, user_id | FK | |
| category, description, photo_url | text | |
| status | enum | `baru`, `diproses`, `selesai`, `ditolak` |
| resolution_note | text | nullable |
| handled_by | FK → users | petugas yang menangani |

### Catatan untuk tahap HTML/JS ini

Karena fase sekarang belum ada backend, `js/db.js` cukup berupa array in-memory (atau `localStorage`) yang **bentuknya persis meniru tabel di atas** (nama field sama persis). Tujuannya supaya waktu nanti diganti jadi `fetch()` ke API/DB asli, tidak ada perubahan bentuk data di modul manapun — cuma isi `db.js` yang diganti dari array jadi HTTP call.

⚠️ **Ponytail**: validasi slot 30 menit & jam operasional di `reservation.js` sekarang jalan di sisi client saja (karena belum ada server). Ini cukup untuk tahap ini, tapi begitu backend dibuat, validasi **wajib diulang di server** (sesuai requirement dokumen: "validasi dilakukan di sisi server, bukan hanya di tampilan kalender") — jangan percaya validasi client-side sebagai satu-satunya penjaga.
