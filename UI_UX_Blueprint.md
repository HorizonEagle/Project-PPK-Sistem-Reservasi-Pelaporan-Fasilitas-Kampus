# 🎨 UI/UX Blueprint — Sistem Reservasi & Pelaporan Fasilitas Kampus

> **Status**: Fase Analisis & Rancangan — Belum ada perubahan kode  
> **Tujuan**: Blueprint siap diterjemahkan ke desain Figma high-fidelity

---

## 1. HASIL ANALISIS

### 1.1 Kondisi Implementasi Saat Ini

| Aspek | Kondisi |
|-------|---------|
| **Framework** | Next.js 16 App Router + Tailwind CSS 4 |
| **Color Scheme** | Blue-centric (`blue-600/700/900`) dengan aksen orange |
| **Component Library** | Custom (`components/ui/index.tsx`) |
| **Layout Pattern** | Navbar top + Sidebar kiri (untuk dashboard/petugas/admin) |
| **Typography** | Default browser (belum ada Google Font custom) |
| **Responsif** | Partial — mobile menu ada tapi sidebar tidak collapse di mobile |
| **State Handling** | Loading spinner, EmptyState, Alert component sudah ada |
| **Icon System** | Emoji (bukan icon library) — inkonsisten secara visual |

### 1.2 Komponen UI yang Sudah Ada

| Komponen | Status | Catatan |
|----------|--------|---------|
| `Button` | ✅ | 5 variant, 3 ukuran, loading state |
| `Card` | ✅ | 3 padding level |
| `Badge` | ✅ | Perlu color variant (status badge) |
| `Modal` | ✅ | 4 ukuran, backdrop blur |
| `Table` | ✅ | Empty state terintegrasi |
| `Input` | ✅ | Label, error, helper text |
| `Select` | ✅ | Label, error, placeholder |
| `Textarea` | ✅ | Label, error, helper text |
| `Alert` | ✅ | 4 type: success/error/warning/info |
| `Spinner` | ✅ | 3 ukuran |
| `EmptyState` | ✅ | Title, desc, action, icon |
| `Pagination` | ✅ | Prev/Next sederhana |
| `Navbar` | ✅ | Sticky, auth-aware, mobile toggle |
| `Sidebar` | ✅ | Per-section (dashboard/petugas/admin) |
| `Footer` | ✅ | Minimal |

**Komponen yang BELUM ada dan perlu dibuat:**
- `StatusBadge` — badge khusus dengan warna per status reservasi/laporan
- `StatCard` — card statistik dengan angka besar (untuk dashboard admin/petugas)
- `SlotPicker` — picker waktu slot 30 menit (reservasi baru)
- `FileUpload` — upload foto (laporan kerusakan)
- `Breadcrumb` — navigasi hierarki halaman detail
- `Avatar` — avatar user dengan inisial
- `Tabs` — tab navigation (admin reports)
- `SearchInput` — input khusus search dengan icon

### 1.3 Halaman yang Sudah Diimplementasi

| Halaman | Path | Status UI |
|---------|------|-----------|
| Landing Page | `/` | ✅ Ada — perlu polish |
| Login | `/login` | ✅ (belum dilihat detailnya) |
| Register | `/register` | ✅ (belum dilihat detailnya) |
| Fasilitas List | `/facilities` | ✅ (belum dilihat detailnya) |
| Fasilitas Detail | `/facilities/:id` | ✅ (belum dilihat detailnya) |
| Dashboard User | `/dashboard` | ✅ Ada — 4 quick-action card sederhana |
| Reservasi List | `/dashboard/reservations` | ✅ Ada — table dengan filter |
| Reservasi Baru | `/dashboard/reservations/new` | ✅ Ada |
| Reservasi Detail | `/dashboard/reservations/:id` | ✅ Ada |
| Laporan List | `/dashboard/reports` | ✅ Ada |
| Laporan Baru | `/dashboard/reports/new` | ✅ Ada |
| Laporan Detail | `/dashboard/reports/:id` | ✅ Ada |
| Petugas Overview | `/petugas` | ✅ Ada |
| Petugas Reservasi | `/petugas/reservations` | ✅ Ada |
| Petugas Laporan | `/petugas/reports` | ✅ Ada |
| Petugas Fasilitas | `/petugas/facilities` | ✅ Ada |
| Admin Dashboard | `/admin` | ✅ Ada |
| Admin Fasilitas | `/admin/facilities` | ✅ Ada |
| Admin Fasilitas Edit | `/admin/facilities/:id/edit` | ✅ Ada |
| Admin Users | `/admin/users` | ✅ Ada |
| Admin Users Create | `/admin/users/create` | ✅ Ada |
| Admin Users Detail | `/admin/users/:id` | ✅ Ada |
| Admin Reports/Export | `/admin/reports` | ✅ Ada |

### 1.4 Gap yang Perlu Diperbaiki

| Gap | Prioritas | Alasan |
|-----|-----------|--------|
| Tidak ada Google Font | 🔴 Tinggi | Tampilan kurang profesional |
| Emoji sebagai icon | 🔴 Tinggi | Inkonsisten di berbagai OS/browser |
| Sidebar tidak responsive mobile | 🔴 Tinggi | UX buruk di perangkat mobile |
| Badge tidak punya color variant | 🟡 Sedang | Status harus dibedakan warna |
| Dashboard user tidak ada statistik | 🟡 Sedang | SRS mensyaratkan data personal |
| Landing page tidak menampilkan info fasilitas | 🟡 Sedang | Kurang engaging |
| Tidak ada Breadcrumb di halaman detail | 🟡 Sedang | Navigasi kurang jelas |
| StatCard belum ada | 🟡 Sedang | Dashboard admin/petugas perlu overview angka |
| Tidak ada Toast/Snackbar notification | 🟢 Rendah | UX feedback lebih baik dari Alert biasa |

---

## 2. DESIGN SYSTEM

### 2.1 Color Palette

```
PRIMARY (Blue Kampus)
  --color-primary-50:   #EFF6FF
  --color-primary-100:  #DBEAFE
  --color-primary-200:  #BFDBFE
  --color-primary-500:  #3B82F6
  --color-primary-600:  #2563EB   ← main brand color
  --color-primary-700:  #1D4ED8
  --color-primary-900:  #1E3A8A

NEUTRAL (Gray)
  --color-neutral-50:   #F9FAFB   ← page background
  --color-neutral-100:  #F3F4F6   ← subtle bg
  --color-neutral-200:  #E5E7EB   ← borders
  --color-neutral-400:  #9CA3AF   ← placeholder
  --color-neutral-500:  #6B7280   ← secondary text
  --color-neutral-700:  #374151   ← body text
  --color-neutral-900:  #111827   ← heading

STATUS COLORS
  Approved/Success:  #16A34A (green-600) bg: #F0FDF4 (green-50)
  Pending:           #D97706 (amber-600) bg: #FFFBEB (amber-50)
  Rejected:          #DC2626 (red-600)   bg: #FEF2F2 (red-50)
  Cancelled:         #6B7280 (gray-500)  bg: #F3F4F6 (gray-100)
  In Progress:       #2563EB (blue-600)  bg: #EFF6FF (blue-50)
  Resolved:          #16A34A (green-600) bg: #F0FDF4 (green-50)

ACCENT
  Orange (Laporan):  #EA580C (orange-600) bg: #FFF7ED (orange-50)
  Purple (Admin):    #7C3AED (violet-600) bg: #F5F3FF (violet-50)
```

### 2.2 Typography

**Font**: `Inter` (Google Fonts) — fallback: `system-ui, sans-serif`

```
Display   — 36px / 700 / -0.02em  → Heading halaman landing
Heading 1 — 24px / 700 / -0.01em  → Page title
Heading 2 — 20px / 600 / -0.01em  → Section title  
Heading 3 — 16px / 600 / 0        → Card title
Body LG   — 16px / 400 / 0        → Deskripsi panjang
Body MD   — 14px / 400 / 0        → Body teks utama
Body SM   — 13px / 400 / 0        → Helper, meta info
Caption   — 12px / 400 / 0.01em   → Label, badge, timestamp
Label     — 12px / 500 / 0.05em   → Form label, table header
```

### 2.3 Spacing System

```
Berbasis 4px:
  2  →  8px    (gap antar elemen dalam group kecil)
  3  →  12px   (padding button sm, gap icon-text)
  4  →  16px   (padding card sm, section padding kecil)
  6  →  24px   (padding card md, gap antar card)
  8  →  32px   (padding halaman, section gap)
  12 →  48px   (section besar)
  16 →  64px   (hero section)
```

### 2.4 Border Radius

```
sm  → 6px   (badge, input kecil)
md  → 8px   (button, input)
lg  → 12px  (card, dropdown)
xl  → 16px  (modal, card besar)
2xl → 20px  (hero card)
full → 9999px (pill badge, avatar)
```

### 2.5 Shadow

```
xs  → 0 1px 2px rgba(0,0,0,0.05)          (input, subtle)
sm  → 0 1px 3px rgba(0,0,0,0.1)           (card default)
md  → 0 4px 6px rgba(0,0,0,0.07)          (card hover, dropdown)
lg  → 0 10px 15px rgba(0,0,0,0.1)         (modal, floating panel)
xl  → 0 20px 25px rgba(0,0,0,0.1)         (dialog besar)
```

---

## 3. KOMPONEN UI — SPESIFIKASI

### 3.1 StatusBadge (BARU)
```
Props: status ('pending'|'approved'|'rejected'|'cancelled'|'in_progress'|'resolved')

Visual:
  pending     → bg-amber-50  text-amber-700  border-amber-200  "Menunggu"
  approved    → bg-green-50  text-green-700  border-green-200  "Disetujui"
  rejected    → bg-red-50    text-red-700    border-red-200    "Ditolak"
  cancelled   → bg-gray-100  text-gray-600   border-gray-200   "Dibatalkan"
  in_progress → bg-blue-50   text-blue-700   border-blue-200   "Diproses"
  resolved    → bg-green-50  text-green-700  border-green-200  "Selesai"

Style: px-2.5 py-0.5 rounded-full text-xs font-medium border inline-flex items-center gap-1
Icon: dot kecil (●) sesuai warna sebelum teks
```

### 3.2 StatCard (BARU)
```
Props: title, value, icon, color, trend (optional)

Layout:
  ┌─────────────────────────────┐
  │  [Icon bg-colored]  [Value] │
  │  [Title]            [Trend] │
  └─────────────────────────────┘

Ukuran: w-full, h auto, padding 20px
Color variants: blue, green, amber, red, violet
```

### 3.3 Button (UPDATE)
```
Tambahkan variant: 'success' → bg-green-600 text-white
Tambahkan variant: 'warning' → bg-amber-500 text-white
Size 'icon' → p-2, ukuran 36px (hanya icon, no text)
```

### 3.4 Avatar (BARU)
```
Props: name, size ('sm'|'md'|'lg'), role

Visual: Lingkaran dengan 2 inisial nama
  sm  → 28px, text-xs
  md  → 36px, text-sm
  lg  → 48px, text-base

Color: Berdasarkan role
  user    → bg-blue-100   text-blue-700
  officer → bg-amber-100  text-amber-700
  admin   → bg-violet-100 text-violet-700
```

### 3.5 Sidebar (UPDATE)
```
Desktop: w-56, fixed, full height
Mobile:  Slide-over dari kiri, overlay backdrop, toggle via hamburger

Struktur:
  ┌────────────────────┐
  │ [Avatar] [Name]    │
  │ [Role badge]       │
  ├────────────────────┤
  │ Nav items          │
  │  [Icon] [Label]    │ ← active: bg-primary-50 text-primary-700
  ├────────────────────┤
  │ [Logout button]    │ ← di bagian bawah sidebar
  └────────────────────┘
```

### 3.6 SearchInput (BARU)
```
Layout: Input dengan icon search (🔍) di kiri
Style: border rounded-lg pl-10 pr-4 py-2 text-sm
Behavior: debounce 300ms sebelum trigger search
```

---

## 4. LAYOUT SYSTEM

### 4.1 Global Layout

```
┌──────────────────────────────────────────────────────┐
│  NAVBAR (sticky, h-16)                               │
│  [Logo]  [Beranda] [Fasilitas]  [User] [Keluar]      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  CONTENT AREA (flex-1, min-h-screen)                 │
│                                                      │
├──────────────────────────────────────────────────────┤
│  FOOTER (minimal, bg-gray-50)                        │
└──────────────────────────────────────────────────────┘
```

### 4.2 Dashboard Layout (Authenticated)

```
NAVBAR
├── SIDEBAR (w-56, fixed left)          MAIN CONTENT
│   [Avatar + Name + Role]              [Page Header]
│   [Nav Item 1] ← active              [Page Content]
│   [Nav Item 2]
│   [Nav Item 3]
│   ...
│   [Logout]

Mobile: Sidebar collapse menjadi bottom tab bar (4 item max)
```

### 4.3 Page Content Layout

```
[Page Header]
  h1 (Page Title)
  p (Subtitle/description)
  [Action Button] → kanan atas

[Content]
  Padding: px-6 py-6 (desktop), px-4 py-4 (mobile)
  Max-width: max-w-7xl mx-auto
```

---

## 5. RANCANGAN PER HALAMAN

---

### PAGE 1: Landing Page (`/`)

**Layout**: Full-width, no sidebar

```
SECTION 1 — HERO
  Background: gradient blue-700 → blue-900
  Content:
    [Logo Icon SVG — bukan emoji]
    h1: "Sistem Reservasi & Pelaporan Fasilitas Kampus"
    p: Deskripsi 1-2 kalimat
    CTA Buttons:
      [Lihat Fasilitas →]  ← outline white
      [Buka Dashboard →]   ← filled white (jika login)
      [Daftar Sekarang]    ← filled white (jika belum login)
  
  Tambahan: Animated stats row di bawah CTA
    "50+ Fasilitas" | "1000+ Reservasi" | "24/7 Tersedia"

SECTION 2 — FEATURE CARDS (3 kolom)
  Background: white
  [📅 Reservasi Fasilitas]  [🔧 Laporkan Kerusakan]  [📊 Transparansi Penuh]
  Setiap card: Icon besar (SVG), judul, deskripsi

SECTION 3 — FACILITY PREVIEW (BARU — sesuai SRS publik)
  Background: gray-50
  Heading: "Fasilitas Tersedia"
  Grid 3 kolom: Tampilkan 3-6 fasilitas populer dari API
  CTA: "Lihat Semua Fasilitas →"

SECTION 4 — CTA / AUTH STATE
  Jika belum login: "Mulai sekarang" + tombol Login & Register
  Jika sudah login: Greeting + tombol Dashboard
```

**States**: Loading (skeleton), Authenticated, Unauthenticated

---

### PAGE 2: Login (`/login`)

**Layout**: Centered card, no sidebar

```
┌─────────────────────────────┐
│  [Logo]                     │
│  h1: "Masuk ke Akun Anda"  │
│  p:  "Selamat datang kembali"│
│                             │
│  [Email Input]              │
│  [Password Input] [👁]      │
│                             │
│  [Button: Masuk]  ← full w  │
│                             │
│  Belum punya akun?          │
│  [Daftar di sini]           │
└─────────────────────────────┘

Card: max-w-md, centered, shadow-lg
Background page: bg-gradient blue subtle atau gray-50
```

**States**:
- Default
- Loading (button disabled + spinner)
- Error (Alert error di atas form)
- Success (redirect)

---

### PAGE 3: Register (`/register`)

**Layout**: Centered card, no sidebar

```
┌─────────────────────────────┐
│  [Logo]                     │
│  h1: "Buat Akun Baru"      │
│                             │
│  [Nama Lengkap Input]       │
│  [Email Input]              │
│  [Password Input]           │
│  [Konfirmasi Password]      │
│                             │
│  [Button: Daftar]           │
│                             │
│  Info: "Akun perlu verifikasi│
│  admin sebelum bisa login"  │
│                             │
│  Sudah punya akun? [Masuk]  │
└─────────────────────────────┘
```

**States**: Default, Loading, Error, Success (info message pending)

---

### PAGE 4: Katalog Fasilitas (`/facilities`)

**Layout**: Full-width content, no sidebar

```
[Page Header]
  h1: "Fasilitas Kampus"
  p: "Tersedia untuk mahasiswa, dosen, dan staf"

[Filter Bar] ← sticky di mobile
  [SearchInput: Cari fasilitas...]
  [Select: Tipe] [Select: Lokasi]
  [Badge] Menampilkan X fasilitas

[Grid Fasilitas: 3 kolom desktop / 2 tablet / 1 mobile]
  FacilityCard:
    [Foto/Placeholder image]
    [StatusBadge: Tersedia/Tidak Tersedia]
    h3: Nama Fasilitas
    p: Tipe | Lokasi | Kapasitas X orang
    [Button: Lihat Detail →]

[Pagination]
```

**States**: Loading (skeleton cards), Empty, Error, Loaded

---

### PAGE 5: Detail Fasilitas (`/facilities/:id`)

**Layout**: Full-width, no sidebar

```
[Breadcrumb]: Beranda > Fasilitas > [Nama Fasilitas]

[Hero Section]
  [Foto Fasilitas - besar]
  Overlay info:
    h1: Nama Fasilitas
    [StatusBadge]
    Tipe | Lokasi | Kapasitas

[Content: 2 kolom]
  Kiri (2/3):
    [Deskripsi]
    [Jadwal Slot - Calendar View]
      [Date Picker]
      [Grid Slot 07:00-20:00]
        Slot tersedia  → bg-green-100 (clickable)
        Slot penuh     → bg-red-100  (disabled)
        Slot dipilih   → bg-blue-600 (selected)
  
  Kanan (1/3):
    Card: "Buat Reservasi"
      [Waktu dipilih: ...]
      [Button: Reservasi Sekarang]
      Info: Perlu login

[Related Facilities] (BARU — engagement)
```

---

### PAGE 6: Dashboard User (`/dashboard`)

**Layout**: Sidebar + Content

```
[Page Header]
  h1: "Selamat datang, [Nama]! 👋"
  p: "Kelola reservasi dan laporan Anda"

[StatCards Row: 4 kartu]
  [Total Reservasi]  [Menunggu]  [Disetujui]  [Laporan Aktif]

[Grid 2 kolom]
  Kiri:
    [Quick Actions]
      [Buat Reservasi →] ← primary button besar
      [Laporkan Kerusakan →] ← outline button
    
    [Reservasi Terbaru] (3 item)
      List item: [Nama Fasilitas] [Tanggal] [StatusBadge]
      [Lihat Semua →]
  
  Kanan:
    [Laporan Terbaru] (3 item)
      List item: [Judul] [Tanggal] [StatusBadge]
      [Lihat Semua →]
    
    [Info Tip Card]
      💡 Tips penggunaan
```

---

### PAGE 7: Reservasi List (`/dashboard/reservations`)

**Layout**: Sidebar + Content

```
[Page Header]
  h1: "Reservasi Saya"
  [Button: + Buat Reservasi] ← kanan atas

[Filter Bar]
  [Select: Status] [Select: Periode]

[Table]
  Kolom: No | Fasilitas | Tanggal | Waktu | Status | Aksi
  Row action: [Lihat Detail]
  
  Empty state: Ilustrasi + "Belum ada reservasi"
  
[Pagination]
```

---

### PAGE 8: Reservasi Baru (`/dashboard/reservations/new`)

**Layout**: Sidebar + Content (max-w-2xl)

```
[Breadcrumb]: Dashboard > Reservasi > Buat Baru

[Page Header]
  h1: "Buat Reservasi Baru"

[Form - Step Layout atau Single Page]
  STEP 1: Pilih Fasilitas
    [SearchInput: Cari fasilitas]
    [Grid Fasilitas kecil: Radio select style]
  
  STEP 2: Pilih Waktu
    [Date Picker]
    [SlotPicker: Visual grid 30 menit]
      Pilih jam mulai dan jam selesai
  
  STEP 3: Detail
    [Textarea: Keperluan/Tujuan] ← required
    
  STEP 4: Konfirmasi
    Summary: Fasilitas, Tanggal, Waktu, Keperluan
    [Button: Ajukan Reservasi]
    [Button: Kembali] ← outline
```

**States**: Per-step validation, Loading submit, Success (redirect ke detail), Error

---

### PAGE 9: Detail Reservasi (`/dashboard/reservations/:id`)

**Layout**: Sidebar + Content (max-w-2xl)

```
[Breadcrumb]: Dashboard > Reservasi > Detail

[Card: Info Reservasi]
  [StatusBadge besar]
  Fasilitas: [Nama]
  Tanggal: [DD MMM YYYY]
  Waktu: [HH:mm - HH:mm]
  Keperluan: [teks]
  Diajukan: [timestamp]

[Card: Riwayat Status]
  Timeline vertikal:
    ● Diajukan — [timestamp]
    ● Disetujui/Ditolak — [timestamp] + catatan

[Actions]
  Jika pending: [Button: Batalkan Reservasi] ← danger
  Jika approved: [Button: Batalkan] ← dengan modal konfirmasi
  Jika rejected: info alasan penolakan
```

---

### PAGE 10: Laporan List (`/dashboard/reports`)

**Layout**: Sidebar + Content

```
[Page Header]
  h1: "Laporan Saya"
  [Button: + Buat Laporan]

[Filter: Status]

[Table/Card List]
  Kolom: Fasilitas | Kategori | Tanggal | Status | Aksi

[Empty State]: "Belum ada laporan kerusakan"
[Pagination]
```

---

### PAGE 11: Laporan Baru (`/dashboard/reports/new`)

**Layout**: Sidebar + Content (max-w-2xl)

```
[Page Header]
  h1: "Buat Laporan Kerusakan"

[Form]
  [Select: Fasilitas] ← required
  [Select: Kategori: Listrik/Plumbing/Furnitur/AC/Lainnya]
  [Textarea: Deskripsi Kerusakan] ← required, min 20 char
  [FileUpload: Foto Kerusakan] ← opsional, max 5MB
    Preview foto setelah upload
  
  [Button: Kirim Laporan]
  [Button: Batal] ← ghost
```

---

### PAGE 12: Dashboard Petugas (`/petugas`)

**Layout**: Sidebar + Content

```
Sidebar Petugas:
  [Overview] [Reservasi] [Laporan] [Fasilitas]

[StatCards: 4 kartu]
  [Reservasi Pending]  [Laporan Pending]  [Selesai Hari Ini]  [Total Fasilitas]

[2 Panel: Reservasi & Laporan terbaru yang butuh tindakan]
  Setiap item: highlight urgent (pending lama)
  Quick action button per item
```

---

### PAGE 13: Petugas Reservasi (`/petugas/reservations`)

**Layout**: Sidebar + Content

```
[Page Header]
  h1: "Antrian Reservasi"
  [Filter: Status] [Filter: Fasilitas] [Filter: Tanggal]

[Table]
  Kolom: Pemohon | Fasilitas | Tanggal | Waktu | Diajukan | Status | Aksi
  
  Row Actions (jika pending):
    [✓ Setujui] ← success button
    [✗ Tolak] ← danger button
  
  Klik row: buka modal detail + approval form

[Modal Approve/Reject]
  Info reservasi
  Jika reject: [Textarea: Alasan penolakan] ← required
  [Confirm Button]
```

---

### PAGE 14: Petugas Laporan (`/petugas/reports`)

**Layout**: Sidebar + Content

```
[Page Header]
  h1: "Antrian Laporan"
  [Filter: Status] [Filter: Kategori]

[Table / Card List]
  Kolom: Pelapor | Fasilitas | Kategori | Tanggal | Status | Aksi
  
  Row Actions:
    [Proses] → ubah status ke in_progress
    [Selesai] → ubah status ke resolved + catatan
    [Tolak] → dengan alasan

[Modal Update Status]
  Info laporan + foto
  [Select: Status Baru]
  [Textarea: Catatan Resolusi]
  [Confirm]
```

---

### PAGE 15: Dashboard Admin (`/admin`)

**Layout**: Sidebar + Content

```
Sidebar Admin:
  [Dashboard] [Fasilitas] [Pengguna] [Laporan & Export]

[StatCards: 6 kartu dalam grid 3x2]
  Total Fasilitas | Total User | Pending Verifikasi
  Reservasi Bulan Ini | Laporan Bulan Ini | Selesai

[Section: Verifikasi Akun Pending]
  Table: Nama | Email | Tanggal Daftar | Aksi
  [Approve] [Reject] per row

[Section: Aktivitas Terbaru]
  Recent reservations + recent reports (combined feed)
```

---

### PAGE 16: Admin Fasilitas (`/admin/facilities`)

**Layout**: Sidebar + Content

```
[Page Header]
  h1: "Manajemen Fasilitas"
  [Button: + Tambah Fasilitas]

[Filter: Tipe | Status | Search]

[Table]
  Kolom: Foto | Nama | Tipe | Lokasi | Kapasitas | Status | Aksi
  Actions: [Edit] [Toggle Status]

[Modal: Tambah/Edit Fasilitas]
  Nama | Tipe | Lokasi | Kapasitas | Deskripsi | Status
  [Simpan] [Batal]
```

---

### PAGE 17: Admin Users (`/admin/users`)

**Layout**: Sidebar + Content

```
[Page Header]
  h1: "Manajemen Pengguna"
  [Button: + Tambah User]

[Tabs: Semua | Pending Verifikasi | User | Petugas | Admin]

[Filter: Search | Status]

[Table]
  Kolom: Avatar+Nama | Email | Role | Status | Bergabung | Aksi
  Actions: [Detail] [Edit Role] [Suspend]
```

---

### PAGE 18: Admin Reports & Export (`/admin/reports`)

**Layout**: Sidebar + Content

```
[Page Header]
  h1: "Rekap & Ekspor Data"

[Tabs: Reservasi | Laporan Kerusakan]

[Stats Summary Row]
  Total | Approved | Rejected | Pending

[Filter Panel]
  [DatePicker: Dari] [DatePicker: Sampai]
  [Select: Status] [Select: Fasilitas]
  [Button: Terapkan Filter]

[Export Actions]
  [Download CSV] [Download Excel] [Download PDF]

[Data Table dengan filter yang aktif]
```

---

## 6. NAVIGATION & USER FLOW

### 6.1 Navbar (Global)
```
Publik:  [Logo] [Beranda] [Fasilitas] ............. [Masuk] [Daftar]
User:    [Logo] [Beranda] [Fasilitas] ... [Dashboard] [Avatar+Nama] [Keluar]
Officer: [Logo] [Beranda] [Fasilitas] ... [Dashboard] [Avatar+Nama] [Keluar]
Admin:   [Logo] [Beranda] [Fasilitas] ... [Dashboard] [Avatar+Nama] [Keluar]
```

### 6.2 Sidebar per Role

**User Dashboard Sidebar:**
- 📊 Overview → `/dashboard`
- 📅 Reservasi Saya → `/dashboard/reservations`
- 📝 Laporan Saya → `/dashboard/reports`

**Petugas Sidebar:**
- 📊 Overview → `/petugas`
- 📋 Reservasi → `/petugas/reservations`
- 🔧 Laporan → `/petugas/reports`
- 🏛️ Fasilitas → `/petugas/facilities`

**Admin Sidebar:**
- 📊 Dashboard → `/admin`
- 🏛️ Fasilitas → `/admin/facilities`
- 👥 Pengguna → `/admin/users`
- 📊 Laporan & Ekspor → `/admin/reports`

---

## 7. RESPONSIVE BEHAVIOR

| Breakpoint | Lebar | Behavior |
|------------|-------|----------|
| Mobile | < 768px | Sidebar hidden → bottom tab bar atau hamburger slide-over |
| Tablet | 768-1024px | Sidebar collapsed (icon only, w-16) |
| Desktop | > 1024px | Sidebar full (w-56) |

**Table di Mobile**: Horizontal scroll atau card list view (toggle)  
**Form di Mobile**: Single column, full-width inputs  
**Grid di Mobile**: Single column

---

## 8. STATE MANAGEMENT PATTERNS

Setiap halaman list/tabel mengikuti pattern:

```
┌─────────────────────┐
│   isLoading: true   │ → Tampilkan skeleton / spinner centered
├─────────────────────┤
│   error: string     │ → Alert error + tombol Retry
├─────────────────────┤
│   data: []          │ → EmptyState dengan aksi (jika relevan)
├─────────────────────┤
│   data: [...items]  │ → Tampilkan tabel/grid + pagination
└─────────────────────┘
```

**Form states:**
- Default → form enabled
- Submitting → button loading, form disabled
- Success → Alert success / redirect
- Error → Alert error, form tetap tersedia

---

## 9. FIGMA STRUCTURE RECOMMENDATION

```
📁 FasilitasKampus Design System
  📄 Cover & Overview
  
  📁 🎨 Design Tokens
    📄 Colors
    📄 Typography
    📄 Spacing & Grid
    📄 Shadows & Borders
  
  📁 🧩 Components
    📄 Buttons (all variants + states)
    📄 Badges & Status
    📄 Cards
    📄 Forms (Input, Select, Textarea, FileUpload)
    📄 Table
    📄 Modal & Dialog
    📄 Navigation (Navbar, Sidebar)
    📄 Avatar & User Info
    📄 Alerts & Toast
    📄 Empty States
    📄 Pagination
    📄 Stat Card
    📄 Slot Picker
  
  📁 📐 Layouts
    📄 Public Layout (Navbar + Footer)
    📄 Dashboard Layout (Sidebar + Content)
    📄 Auth Layout (Centered)
  
  📁 🌐 Public Pages
    📄 Landing Page (Desktop + Mobile)
    📄 Login
    📄 Register
    📄 Katalog Fasilitas
    📄 Detail Fasilitas
  
  📁 👤 User Dashboard
    📄 Overview
    📄 Reservasi - List
    📄 Reservasi - Baru (Step 1-4)
    📄 Reservasi - Detail
    📄 Laporan - List
    📄 Laporan - Baru
    📄 Laporan - Detail
  
  📁 👷 Petugas Dashboard
    📄 Overview
    📄 Reservasi (+ Modal Approve/Reject)
    📄 Laporan (+ Modal Update Status)
    📄 Fasilitas
  
  📁 ⚙️ Admin Dashboard
    📄 Overview + Pending Users
    📄 Fasilitas (+ Modal Tambah/Edit)
    📄 Pengguna (+ Detail User)
    📄 Laporan & Ekspor
  
  📁 📱 Mobile Frames
    📄 Landing (375px)
    📄 Login / Register
    📄 Dashboard Overview
    📄 Bottom Tab Navigation
  
  📁 🔄 Prototype Flows
    📄 Flow: User Buat Reservasi
    📄 Flow: Petugas Approve Reservasi
    📄 Flow: User Buat Laporan
    📄 Flow: Admin Verifikasi User
```

---

## 10. PRIORITAS IMPLEMENTASI

### Fase 1 — Foundation (Design System)
1. Setup token warna, typography (Inter), spacing
2. Update/buat komponen: StatusBadge, StatCard, Avatar, SearchInput
3. Update Button (tambah variant success/warning/icon)
4. Update Sidebar (responsive mobile)

### Fase 2 — High Traffic Pages
1. Landing Page (polish + facility preview)
2. Dashboard User (tambah StatCards)
3. Reservasi Baru (SlotPicker)
4. Petugas Reservasi (modal approve/reject)

### Fase 3 — Remaining Pages
1. Admin Dashboard
2. Detail pages (Reservasi, Laporan)
3. Admin Users & Export

### Fase 4 — Polish
1. Animasi & transisi
2. Toast notifications
3. Skeleton loaders
4. Mobile optimization

---

*Blueprint ini adalah dokumen hidup — update sesuai feedback dan perkembangan implementasi.*
