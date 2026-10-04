# 🎨 UI/UX REDESIGN BRIEF
## Sistem Reservasi & Pelaporan Fasilitas Kampus

> **Dokumen**: Audit Existing + Brief untuk Figma High-Fidelity
> **Tanggal Audit**: 3 Oktober 2026
> **Scope**: Frontend-only redesign — logic, API, auth, backend tidak disentuh
> **Stack**: Next.js 16 App Router · Tailwind CSS 4 · TypeScript

---

## 1. RINGKASAN KONDISI UI EXISTING

### 1.1 Penilaian Keseluruhan

| Aspek | Kondisi Saat Ini | Nilai |
|-------|-----------------|-------|
| **Typography** | `Arial, Helvetica, sans-serif` hardcoded di `globals.css` — Inter di-load tapi tidak di-assign ke body | ⚠️ Perlu Perbaikan |
| **Color System** | Blue-centric hardcoded inline Tailwind — tidak ada design token terpusat | ⚠️ Perlu Perbaikan |
| **Icon System** | Semua menggunakan emoji OS-dependent (🏫📅🔧📊👤⚙️) | 🔴 Kritis |
| **Sidebar Mobile** | Fixed `w-56` tanpa responsive collapse — tidak ada hamburger di dalam layout | 🔴 Kritis |
| **Component Library** | Custom `components/ui/index.tsx` — terstruktur tapi Badge tidak punya color variant bawaan | ⚠️ Perlu Perbaikan |
| **Loading State** | Spinner ada, tapi beberapa halaman hanya `div.animate-spin` tanpa skeleton | ⚠️ Perlu Perbaikan |
| **Empty State** | Komponen `EmptyState` sudah ada tapi icon masih emoji | ⚠️ Perlu Perbaikan |
| **Error State** | Alert inline ada, tapi tidak ada Toast/Snackbar | 🟡 Minor |
| **Page Header** | Konsisten (h1 + subtitle + optional action button) di semua halaman | ✅ Baik |
| **Table** | Komponen `Table` terpusat, row hover, empty state terintegrasi | ✅ Baik |
| **Modal** | Komponen `Modal` dengan backdrop blur, 4 size | ✅ Baik |
| **Forms** | Input, Select, Textarea terpusat dan konsisten | ✅ Baik |
| **SlotGrid** | Grid responsif, color-coded slot, selection logic bagus | ✅ Baik |
| **Pagination** | Sederhana (Prev/Next only) — tidak ada nomor halaman | ⚠️ Perlu Perbaikan |
| **Breadcrumb** | Tidak ada — hanya plain text "← Kembali ke..." | 🟡 Minor |
| **Avatar** | Tidak ada — sidebar hanya emoji role | ⚠️ Perlu Perbaikan |
| **StatCard** | Tidak ada komponen terpusat — dashboard pakai div ad-hoc | 🔴 Kritis |
| **SEO/Meta** | `layout.tsx` sudah memiliki metadata lengkap | ✅ Baik |

### 1.2 Temuan Kritis dari Audit Kode Langsung

1. **`globals.css`** hanya 21 baris — tidak ada design token CSS variables
2. **`globals.css` baris 19**: `font-family: Arial, Helvetica, sans-serif` — Inter di-load tapi tidak di-gunakan di body
3. **Sidebar tidak responsive** — semua 3 layout (`dashboard`, `admin`, `petugas`) pakai `w-56` tanpa media query
4. **Dashboard User `/dashboard`** — hanya 4 quick-action card, API `/api/dashboard` tersedia tapi tidak dikonsumsi
5. **Dashboard Admin `/admin`** — stat card value berisi string "CRUD", "CSV/PDF", "List" bukan angka dari API
6. **Dashboard Petugas `/petugas`** — hanya 3 quick-action card tanpa data statistik apapun
7. **Badge** warna diserahkan ke `className` ad-hoc, tidak ada color variant terpusat
8. **Status color helpers** sudah ada di `lib/utils.ts` — ini basis untuk `StatusBadge` baru
9. **Status icon di Detail Reservasi** — emoji dictionary `statusIcons` perlu diganti SVG
10. **`/public`** hanya berisi SVG boilerplate Next.js — tidak ada custom asset

---

## 2. DAFTAR SELURUH HALAMAN FRONTEND

### 2.1 Public Pages

| # | Halaman | Route | File | Kondisi UI |
|---|---------|-------|------|-----------|
| 1 | Landing Page | `/` | `src/app/page.tsx` | ⚠️ 3 section: hero + features + CTA, tanpa facility preview, emoji-based |
| 2 | Katalog Fasilitas | `/facilities` | `src/app/facilities/page.tsx` | ⚠️ Grid card + filter, emoji icon, card header gradient sudah ada |
| 3 | Detail Fasilitas | `/facilities/:id` | `src/app/facilities/[id]/page.tsx` | ❓ Belum diaudit detail |
| 4 | Login | `/login` | `src/app/login/page.tsx` | ❓ Belum diaudit detail |
| 5 | Register | `/register` | `src/app/register/page.tsx` | ❓ Belum diaudit detail |

### 2.2 User Dashboard (Role: `user`)

| # | Halaman | Route | File | Kondisi UI |
|---|---------|-------|------|-----------|
| 6 | Dashboard Overview | `/dashboard` | `src/app/dashboard/page.tsx` | ⚠️ Hanya 4 quick-action card, tidak ada StatCard/statistik |
| 7 | Daftar Reservasi | `/dashboard/reservations` | `src/app/dashboard/reservations/page.tsx` | ✅ Table + filter status + pagination + EmptyState |
| 8 | Buat Reservasi | `/dashboard/reservations/new` | `src/app/dashboard/reservations/new/page.tsx` | ✅ Multi-step form dengan SlotGrid, tidak ada progress indicator |
| 9 | Detail Reservasi | `/dashboard/reservations/:id` | `src/app/dashboard/reservations/[id]/page.tsx` | ✅ Detail card + modal cancel, emoji status icon |
| 10 | Daftar Laporan | `/dashboard/reports` | `src/app/dashboard/reports/page.tsx` | ✅ Table + filter |
| 11 | Buat Laporan | `/dashboard/reports/new` | `src/app/dashboard/reports/new/page.tsx` | ❓ Belum diaudit detail |
| 12 | Detail Laporan | `/dashboard/reports/:id` | `src/app/dashboard/reports/[id]/page.tsx` | ❓ Belum diaudit detail |

### 2.3 Petugas Dashboard (Role: `officer`)

| # | Halaman | Route | File | Kondisi UI |
|---|---------|-------|------|-----------|
| 13 | Petugas Overview | `/petugas` | `src/app/petugas/page.tsx` | ⚠️ Hanya 3 quick-action card, tidak ada statistik |
| 14 | Antrian Reservasi | `/petugas/reservations` | `src/app/petugas/reservations/page.tsx` | ❓ Belum diaudit detail |
| 15 | Antrian Laporan | `/petugas/reports` | `src/app/petugas/reports/page.tsx` | ❓ Belum diaudit detail |
| 16 | Status Fasilitas | `/petugas/facilities` | `src/app/petugas/facilities/page.tsx` | ❓ Belum diaudit detail |

### 2.4 Admin Dashboard (Role: `admin`)

| # | Halaman | Route | File | Kondisi UI |
|---|---------|-------|------|-----------|
| 17 | Admin Dashboard | `/admin` | `src/app/admin/page.tsx` | ⚠️ Stat card dengan value "CRUD"/"List" bukan angka nyata dari API |
| 18 | Kelola Fasilitas | `/admin/facilities` | `src/app/admin/facilities/page.tsx` | ✅ Table + filter + modal create + status toggle |
| 19 | Edit Fasilitas | `/admin/facilities/:id/edit` | `src/app/admin/facilities/[id]/edit/page.tsx` | ❓ Belum diaudit detail |
| 20 | Kelola Pengguna | `/admin/users` | `src/app/admin/users/page.tsx` | ✅ Table + filter role/status + verifikasi inline |
| 21 | Buat Akun Baru | `/admin/users/create` | `src/app/admin/users/create/page.tsx` | ❓ Belum diaudit detail |
| 22 | Detail User | `/admin/users/:id` | `src/app/admin/users/[id]/page.tsx` | ❓ Belum diaudit detail |
| 23 | Rekap & Ekspor | `/admin/reports` | `src/app/admin/reports/page.tsx` | ⚠️ Stat cards emoji-based + export form |

---

## 3. DAFTAR REUSABLE COMPONENTS

### 3.1 Komponen Sudah Ada — `components/ui/index.tsx`

| Komponen | Props | Kondisi | Rekomendasi |
|----------|-------|---------|-------------|
| `Button` | variant (5), size (3), isLoading, leftIcon, rightIcon | ✅ Baik | Tambah variant `success`, `warning`, size `icon` |
| `Card` | padding (4 level), className | ✅ Baik | Pertahankan |
| `Badge` | children, className | ⚠️ Tidak ada color variant bawaan | Buat `StatusBadge` di atasnya |
| `Modal` | isOpen, onClose, title, size (4) | ✅ Baik — backdrop-blur | Pertahankan |
| `Table` | headers, children, emptyMessage, isEmpty | ✅ Baik | Pertahankan |
| `Input` | label, error, helperText, semua HTML attrs | ✅ Baik | Pertahankan |
| `Select` | label, error, options, placeholder | ✅ Baik | Pertahankan |
| `Textarea` | label, error, helperText, HTML attrs | ✅ Baik | Pertahankan |
| `Alert` | type (4), title, children | ✅ Baik — SVG icon | Pertahankan |
| `Spinner` | size (3) | ✅ Baik | Pertahankan |
| `EmptyState` | title, description, action, icon | ⚠️ Icon pakai emoji di halaman | Improve — gunakan SVG |
| `Pagination` | page, totalPages, onPageChange | ⚠️ Prev/Next only | Improve — tambah numbered |

### 3.2 Komponen Layout — `components/layout/index.tsx`

| Komponen | Kondisi | Rekomendasi |
|----------|---------|-------------|
| `Navbar` | ✅ Sticky, auth-aware, mobile toggle ada | Improve — ganti emoji, tambah Avatar |
| `Footer` | ⚠️ Hanya logo + copyright | Improve — tambah links |

### 3.3 Komponen Calendar — `components/calendar/index.tsx`

| Komponen | Kondisi | Rekomendasi |
|----------|---------|-------------|
| `SlotGrid` | ✅ Responsif, color-coded | Improve — animasi selection |
| `DatePicker` | ⚠️ Native HTML input | Improve — styling premium |

### 3.4 Komponen Forms — `components/forms/ReservationForm.tsx`

| Komponen | Kondisi | Rekomendasi |
|----------|---------|-------------|
| `ReservationForm` | ✅ Multi-step conditional, slot selection logic bagus | Improve — tambah progress indicator visual |

### 3.5 Komponen Baru yang Perlu Dibuat

| Komponen | Dibutuhkan Di | Deskripsi |
|----------|--------------|-----------|
| `StatusBadge` | Semua halaman list/detail | Badge dengan color preset per enum status |
| `StatCard` | `/dashboard`, `/petugas`, `/admin` | Card statistik angka besar + icon + label |
| `Avatar` | Sidebar, Navbar, tabel Users | Inisial nama dalam lingkaran, color per role |
| `Breadcrumb` | Halaman detail | Navigasi hierarki |
| `SearchInput` | Semua halaman dengan search | Input dengan SVG icon di kiri |
| `Toast` | Semua halaman dengan aksi | Notifikasi non-blocking |
| `Skeleton` | Loading state | Placeholder animasi |

---

## 4. BAGIAN UI YANG PERLU DIPERTAHANKAN

### 4.1 Struktur Layout
- ✅ Root layout: `Navbar + main + Footer`
- ✅ Dashboard layout pattern: `flex` dengan `aside w-56 + div flex-1`
- ✅ Page content pattern: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- ✅ Page header pattern: `h1 + subtitle + optional CTA kanan`

### 4.2 Component Props & Logic
- ✅ Semua props komponen UI yang ada — hanya tambah variant baru
- ✅ Modal: backdrop blur, close on overlay, size variants
- ✅ Alert: 4 type dengan SVG icon
- ✅ SlotGrid: color-coding dan selection behavior
- ✅ ReservationForm: multi-step conditional render dan slot selection logic

### 4.3 Navigation
- ✅ Semua nav item per role sidebar
- ✅ Active state detection `pathname.startsWith()`
- ✅ Role-based redirect di setiap layout

### 4.4 Filter & Data Pattern
- ✅ Filter bar dalam Card di atas tabel
- ✅ Debounce search 400ms
- ✅ Pagination di bawah tabel

---

## 5. BAGIAN UI YANG PERLU DIDESAIN ULANG

### 5.1 Design System Foundation — PRIORITAS TERTINGGI

**A. Typography**
- Masalah: `globals.css` masih `Arial, Helvetica, sans-serif` meski Inter sudah di-load
- Solusi: Assign Inter via CSS variable, buat typography scale konsisten

**B. Color System**
- Masalah: Semua warna hardcoded inline, tidak ada CSS variables terpusat
- Solusi: Buat design tokens di `globals.css`

**C. Icon System**
- Masalah: Semua emoji (🏫📅🔧👤⚙️) — inkonsisten antar OS
- Solusi: Implementasi icon library SVG (Heroicons/Lucide)

### 5.2 Sidebar — Redesign Responsif

```
Saat ini: aside w-56, emoji + nama di header, tidak mobile-friendly

Target Redesign:
Desktop (>1024px): w-56, full height
Tablet (768-1024px): w-16, icon-only
Mobile (<768px): slide-over dari kiri + overlay backdrop

Header sidebar:
  [Avatar md] [Nama User]
  [Role Badge pill]

Nav items:
  [SVG Icon 20px] [Label]
  Active: bg-primary-50 text-primary-700

Footer sidebar:
  [Logout Button] dengan SVG icon
```

### 5.3 Dashboard Pages — Tambah StatCards

**Dashboard User (`/dashboard`)**
- Masalah: Hanya 4 quick-action card, API `/api/dashboard` tidak dikonsumsi
- Solusi: Tambah StatCards row (Total Reservasi | Menunggu | Disetujui | Laporan Aktif) + recent items list

**Dashboard Petugas (`/petugas`)**
- Masalah: Hanya 3 quick-action card
- Solusi: StatCards (Reservasi Pending | Laporan Pending | Selesai Hari Ini | Total Fasilitas) + antrian terbaru

**Dashboard Admin (`/admin`)**
- Masalah: Stat card value = "CRUD", "List", "CSV/PDF" bukan angka dari API
- Solusi: Konsumsi API `/api/dashboard` — totalUsers, pendingUsers, totalFacilities, totalReservations, dll.

### 5.4 Navbar — Tambah Avatar
- Masalah: User info hanya emoji role + nama teks
- Solusi: Avatar komponen (2 inisial, color per role)

### 5.5 Landing Page — Upgrade Visual

```
Saat ini: Hero text besar + emoji + 3 feature card dengan emoji + CTA section

Target:
  Section 1 HERO: Logo SVG + stats row (50+ Fasilitas | 1000+ Reservasi | 24/7)
  Section 2 FEATURES: SVG icon besar (bukan emoji)
  Section 3 FACILITY PREVIEW (BARU): grid 3 fasilitas dari API publik + skeleton
  Section 4 CTA: pertahankan logic auth-aware
```

### 5.6 Halaman List — Upgrade Filter & Table
- StatusBadge dengan dot indicator (●)
- Filter bar dengan count "Menampilkan X hasil"
- Pagination numbered
- Error state dengan Alert komponen (bukan text merah inline)

### 5.7 ReservationForm — Progress Indicator
- Masalah: Multi-step conditional tapi tidak ada visual progress
- Solusi (Figma only, tidak mengubah logic): Step header di atas form
  ```
  [1] Fasilitas → [2] Waktu → [3] Tujuan → [4] Konfirmasi
  ```

### 5.8 Footer — Upgrade
- Masalah: Hanya logo + copyright
- Solusi: Tambah quick links (Beranda, Fasilitas, Login, Register)

---

## 6. BAGIAN YANG TIDAK BOLEH DISENTUH

### Backend & API
- Seluruh folder `backend/`, Prisma schema, API endpoints, JWT flow, CORS

### Frontend Logic (Preserve As-Is)
- `lib/auth-context.tsx` — AuthProvider, useAuth hook
- `lib/api.ts` — semua API client functions
- `lib/utils.ts` — format/label/color helpers
- `middleware.ts` — route protection
- `types/` — TypeScript interfaces
- Semua `useEffect`, `useState`, `useCallback`
- Form validation logic & handlers
- Slot selection logic di ReservationForm
- RBAC redirect logic di semua `layout.tsx`
- Cancel/approve/reject/verify handlers
- Export download handler

### Routing & Structure
- Semua path/route yang ada
- Next.js App Router folder structure
- Dynamic route params

---

## 7. PRIORITAS REDESIGN

### 🔴 Fase 1 — Foundation

| # | Item | Dampak | Effort |
|---|------|--------|--------|
| 1 | Fix typography: assign Inter + type scale | Tinggi | Rendah |
| 2 | Buat `StatusBadge` dengan color preset | Tinggi | Rendah |
| 3 | Ganti emoji icon dengan SVG (Sidebar & Navbar) | Tinggi | Sedang |
| 4 | Redesign Sidebar: Avatar + role badge + logout | Tinggi | Sedang |
| 5 | Sidebar mobile responsive (slide-over) | Tinggi | Sedang |

### 🟡 Fase 2 — High-Impact Pages

| # | Item | Dampak | Effort |
|---|------|--------|--------|
| 6 | Dashboard User: tambah StatCards | Tinggi | Sedang |
| 7 | Dashboard Petugas: tambah StatCards | Tinggi | Sedang |
| 8 | Dashboard Admin: fix stat value dari API | Tinggi | Rendah |
| 9 | Landing Page: SVG icon + stats row + facility preview | Sedang | Sedang |
| 10 | Buat `Avatar` component | Sedang | Rendah |
| 11 | Buat `StatCard` component | Sedang | Rendah |

### 🟢 Fase 3 — Polish

| # | Item | Dampak | Effort |
|---|------|--------|--------|
| 12 | Pagination: tambah nomor halaman | Sedang | Rendah |
| 13 | Navbar: tambah Avatar user | Sedang | Rendah |
| 14 | ReservationForm: step progress indicator | Sedang | Sedang |
| 15 | Breadcrumb di halaman detail | Rendah | Rendah |
| 16 | SearchInput dengan SVG icon | Rendah | Rendah |
| 17 | Skeleton loading state | Rendah | Sedang |
| 18 | Toast/Snackbar | Rendah | Sedang |
| 19 | Footer upgrade | Rendah | Rendah |

---

## 8. UI/UX REDESIGN BRIEF UNTUK FIGMA

### 8.1 Design System Tokens

#### Palet Warna

```
PRIMARY (Brand Blue)
  primary-50:  #EFF6FF  sidebar active bg
  primary-100: #DBEAFE  badge bg ringan
  primary-200: #BFDBFE  border
  primary-500: #3B82F6  medium accent
  primary-600: #2563EB  MAIN BRAND — button, link
  primary-700: #1D4ED8  hover, heading
  primary-900: #1E3A8A  hero gradient end

NEUTRAL
  neutral-50:  #F9FAFB  page background
  neutral-100: #F3F4F6  subtle bg, hover
  neutral-200: #E5E7EB  border, divider
  neutral-400: #9CA3AF  placeholder
  neutral-500: #6B7280  secondary text
  neutral-700: #374151  body text
  neutral-900: #111827  heading

STATUS COLORS
  success:  text #16A34A | bg #F0FDF4 | border #BBF7D0
  warning:  text #D97706 | bg #FFFBEB | border #FDE68A
  error:    text #DC2626 | bg #FEF2F2 | border #FECACA
  info:     text #2563EB | bg #EFF6FF | border #BFDBFE
  neutral:  text #6B7280 | bg #F3F4F6 | border #E5E7EB

RESERVATION STATUS
  pending:           warning colors
  approved:          success colors
  rejected:          error colors
  cancelled_by_user: neutral colors
  cancelled_by_admin: orange #EA580C | #FFF7ED | #FED7AA

REPORT STATUS
  new_report:  info colors
  in_progress: warning colors
  resolved:    success colors
  rejected:    error colors

ROLE ACCENT
  user:    bg-blue-100   text-blue-700
  officer: bg-amber-100  text-amber-700
  admin:   bg-violet-100 text-violet-700
```

#### Typography Scale

```
Font: Inter (Google Fonts) — sudah di-load, perlu di-assign ke body
Fallback: system-ui, -apple-system, sans-serif

display:  36px / 700 / tracking-tight  → Landing hero
h1:       24px / 700 / tracking-tight  → Page title
h2:       20px / 600 / normal          → Section title
h3:       16px / 600 / normal          → Card title
body-lg:  16px / 400 / relaxed         → Deskripsi panjang
body-md:  14px / 400 / normal          → Teks utama
body-sm:  13px / 400 / normal          → Helper, meta
caption:  12px / 400 / wide            → Badge, timestamp
label:    12px / 500 / wider           → Form label, table header
```

#### Spacing (berbasis 4px)

```
2  →  8px   gap kecil
3  →  12px  padding button sm
4  →  16px  padding card sm
6  →  24px  padding card md, card gap
8  →  32px  page padding, section gap
12 →  48px  section besar
16 →  64px  hero padding
```

#### Border Radius

```
sm:   6px   badge, chip
md:   8px   button, input
lg:   12px  card, dropdown
xl:   16px  modal, large card
2xl:  20px  hero card, feature card
full: 9999px avatar, pill badge
```

#### Shadow

```
xs: 0 1px 2px rgba(0,0,0,0.05)
sm: 0 1px 3px rgba(0,0,0,0.1)    card default
md: 0 4px 6px rgba(0,0,0,0.07)   card hover, floating
lg: 0 10px 15px rgba(0,0,0,0.1)  modal, panel
xl: 0 20px 25px rgba(0,0,0,0.1)  dialog besar
```

---

### 8.2 Spesifikasi Komponen Baru & Update

#### `StatusBadge` (BARU)
```
Props: status (semua enum dari utils.ts)
Visual: px-2.5 py-0.5 rounded-full text-xs font-medium border
        inline-flex items-center gap-1.5
Format: [● dot] [Label]

Mapping:
  pending           → amber    "Menunggu"
  approved          → green    "Disetujui"
  rejected          → red      "Ditolak"
  cancelled_by_user → neutral  "Dibatalkan"
  cancelled_by_admin→ orange   "Dibatalkan (Petugas)"
  new_report        → blue     "Baru"
  in_progress       → amber    "Sedang Ditangani"
  resolved          → green    "Selesai"
  active            → green    "Aktif"
  inactive          → neutral  "Nonaktif"
  under_maintenance → amber    "Dalam Perbaikan"
```

#### `StatCard` (BARU)
```
Props: title, value, icon (SVG), colorVariant, description?

Layout:
  [Icon 24px]    [Value 28px/700]
  [Title 12px/500]
  [Description 12px gray]

Color variants: blue | green | amber | red | violet
Size: w-full, padding 20px, border-radius 12px
```

#### `Avatar` (BARU)
```
Props: name, role, size (sm/md/lg)
Visual: Rounded circle, 2 inisial
  sm: 28px text-xs
  md: 36px text-sm
  lg: 48px text-base

Color: sesuai role
```

#### `Sidebar` (UPDATE — visual only)
```
Header:
  [Avatar md] [Nama truncate]
  [Role Badge pill]

Nav items:
  [SVG Icon 20px] [Label]
  Active: bg-primary-50 text-primary-700

Footer:
  [SVG Logout Icon] [Keluar]

Mobile: slide-over kiri + overlay backdrop z-40
```

#### `Button` (UPDATE — tambah variant)
```
success: bg-green-600 text-white hover:bg-green-700
warning: bg-amber-500 text-white hover:bg-amber-600
icon:    p-2 rounded-lg (square)
```

#### `Pagination` (UPDATE)
```
Saat ini: [← Prev] [Hal X dari Y] [Next →]
Target:   [← Prev] [1] [2] [3] ... [N] [Next →]
Info:     "Menampilkan 1-10 dari 45 hasil"
```

---

### 8.3 Spesifikasi Per Halaman untuk Figma

#### Landing Page (`/`)
```
HERO (gradient blue-700→blue-900, py-20):
  Logo SVG (bukan emoji)
  h1 display: "Sistem Reservasi & Pelaporan..."
  p: deskripsi (text-blue-100)
  CTA: [Lihat Fasilitas] [Dashboard/Daftar]
  Stats row: 50+ Fasilitas | 1000+ Reservasi | 24/7 Tersedia

FEATURES (bg-white, py-16):
  3-column grid
  SVG icon besar + judul + deskripsi
  Hover: shadow-md

FACILITY PREVIEW (bg-gray-50, py-12):
  h2: "Fasilitas Tersedia"
  3-column grid FacilityCard mini
  Loading: skeleton
  CTA: "Lihat Semua →"

CTA AUTH (bg-white, py-12):
  Pertahankan logic auth-aware yang sudah ada
```

#### Login (`/login`)
```
Layout: centered card max-w-md, bg-gray-50
Card: rounded-2xl shadow-xl p-8

Konten:
  Logo SVG kecil (center)
  h1: "Masuk ke Akun Anda"
  p: "Selamat datang kembali" (gray-500)
  [Input Email]
  [Input Password + show/hide icon]
  [Button Masuk — full width primary]
  "Belum punya akun? [Daftar di sini]"

States: Default | Loading | Error (Alert) | Success
```

#### Register (`/register`)
```
Layout: identik Login
Konten: h1 "Buat Akun Baru" + field Nama/Email/Pass/KonfirmPass
Alert info: "Akun perlu verifikasi admin"
Link: "Sudah punya akun? [Masuk]"
```

#### Katalog Fasilitas (`/facilities`)
```
Header: gradient py-12
  h1: "Fasilitas Kampus"

Filter bar: Card -mt-6, shadow-lg
  [SearchInput SVG icon] [Select Tipe] [Input Kapasitas]

Count: "Menampilkan X dari Y fasilitas"

Grid: 3 desktop / 2 tablet / 1 mobile
FacilityCard:
  Header: gradient h-36 + StatusBadge absolute top-right
  Body: Nama + Tipe badge + Lokasi + Kapasitas + Deskripsi
  Hover: -translate-y-0.5 shadow-lg

States: Loading skeleton | Empty | Loaded
```

#### Dashboard User (`/dashboard`)
```
Header: h1 "Selamat datang, [Nama]!" + subtitle

StatCards row (4 kartu dari API /api/dashboard):
  [Total Reservasi: blue] [Menunggu: amber]
  [Disetujui: green] [Laporan Aktif: red]

2-column grid:
  Kiri:
    Quick Actions: [Buat Reservasi] [Laporkan Kerusakan]
    Recent Reservasi (3 item + StatusBadge)
  Kanan:
    Recent Laporan (3 item + StatusBadge)
    Tips card
```

#### Reservasi List (`/dashboard/reservations`)
```
Header: h1 "Reservasi Saya" + [+ Ajukan Reservasi]
Filter: [Select Status] + count
Table: Fasilitas | Tanggal | Waktu | StatusBadge | Aksi
Empty: EmptyState SVG
Pagination: numbered
```

#### Buat Reservasi (`/dashboard/reservations/new`)
```
Header: h1 + Breadcrumb

Step Progress (visual only, logic tetap):
  [1] Fasilitas → [2] Waktu → [3] Tujuan → [4] Konfirmasi

Step 1: Grid fasilitas picker (sudah ada, improve hover)
Step 2: DatePicker + SlotGrid (sudah ada, pertahankan)
Step 3: Textarea tujuan (sudah ada)
Step 4: Summary card + [Batal] [Ajukan]
```

#### Detail Reservasi (`/dashboard/reservations/:id`)
```
Breadcrumb: Dashboard > Reservasi > Detail
StatusBadge besar di header card
2-column grid: Fasilitas | Jadwal | Tujuan (full) | Processing Info
Cancel button + Cancel Modal (pertahankan logic)
```

#### Dashboard Petugas (`/petugas`)
```
StatCards: Reservasi Pending | Laporan Pending | Selesai Hari Ini | Total Fasilitas
2 panel: antrian terbaru yang butuh tindakan
Quick action per item
```

#### Dashboard Admin (`/admin`)
```
StatCards 4 kolom (dari API /api/dashboard):
  Total Fasilitas | Total User | Pending Verifikasi | Reservasi
Pending Users section (pertahankan logicnya)
Quick Actions (pertahankan)
```

#### Kelola Fasilitas (`/admin/facilities`)
```
Header + [+ Tambah Fasilitas]
Filter: [SearchInput] [Select Tipe] [Select Status]
Table: Nama | Tipe | Lokasi | Kapasitas | StatusBadge | Aksi (Edit/Toggle)
Modal create/edit: sudah bagus, pertahankan
```

#### Kelola Pengguna (`/admin/users`)
```
Header + [+ Buat Akun]
Filter: [SearchInput] [Select Role] [Select Status]
Table: Avatar+Nama | Email | Role Badge | StatusBadge | Terdaftar | Aksi
Aksi: [Verifikasi] [Tolak] [Detail]
```

#### Rekap & Ekspor (`/admin/reports`)
```
StatCards: Total Reservasi | Total Laporan | Total Fasilitas | Total Pengguna
Export form: [Jenis Data] [Format] [Dari] [Sampai] [Unduh]
```

---

### 8.4 Struktur Frame Figma yang Direkomendasikan

```
📁 FasilitasKampus — Redesign 2026

  📄 00_Cover & Changelog

  📁 01_Design Tokens
    📄 Colors (Primary, Neutral, Status, Role)
    📄 Typography
    📄 Spacing & Grid
    📄 Shadows & Radius

  📁 02_Components
    📄 Button (semua variant + states)
    📄 Badge & StatusBadge
    📄 Card & StatCard
    📄 Avatar (3 size, 3 role)
    📄 Input / Select / Textarea
    📄 Alert (4 type)
    📄 Modal (4 size)
    📄 Table (default, empty, skeleton)
    📄 Pagination (numbered)
    📄 Spinner & Skeleton
    📄 EmptyState
    📄 Breadcrumb
    📄 SearchInput
    📄 SlotGrid (4 states)
    📄 DatePicker
    📄 Navbar (publik/user/officer/admin)
    📄 Sidebar (3 role, desktop+mobile)
    📄 Footer

  📁 03_Public Pages
    📄 Landing Page
    📄 Login
    📄 Register
    📄 Katalog Fasilitas
    📄 Detail Fasilitas

  📁 04_User Dashboard
    📄 Overview (StatCards)
    📄 Reservasi — List
    📄 Reservasi — Baru (4 steps)
    📄 Reservasi — Detail + Modal Cancel
    📄 Laporan — List
    📄 Laporan — Baru
    📄 Laporan — Detail

  📁 05_Petugas Dashboard
    📄 Overview (StatCards)
    📄 Antrian Reservasi + Modal
    📄 Antrian Laporan + Modal
    📄 Status Fasilitas

  📁 06_Admin Dashboard
    📄 Overview + Pending Users
    📄 Kelola Fasilitas + Modal
    📄 Kelola Pengguna + Detail
    📄 Rekap & Ekspor

  📁 07_States Library
    📄 Loading States
    📄 Empty States
    📄 Error States

  📁 08_Mobile Frames (375px)
    📄 Landing, Login, Register
    📄 Katalog Fasilitas
    📄 Dashboard Overview
    📄 Sidebar slide-over

  📁 09_Prototype Flows
    📄 User: Buat Reservasi
    📄 Petugas: Approve Reservasi
    📄 User: Buat Laporan
    📄 Admin: Verifikasi User
```

---

## 9. HUBUNGAN ANTAR HALAMAN

```
Landing Page
  ├── Katalog Fasilitas → Detail Fasilitas → Login → Buat Reservasi
  ├── Login → Dashboard User → Buat Reservasi / Buat Laporan
  ├── Login → Petugas → Antrian Reservasi / Antrian Laporan
  └── Login → Admin → Fasilitas / Pengguna / Ekspor

Flow kritis untuk prototype Figma:

  1. User buat reservasi:
     Login → Dashboard → Buat Reservasi (4 steps) → List Reservasi → Detail

  2. Petugas approve:
     Login → Antrian Reservasi → Modal Approve → done

  3. User buat laporan:
     Login → Dashboard → Buat Laporan → List Laporan → Detail

  4. Admin verifikasi user:
     Login → Admin Dashboard → Kelola Pengguna → Verifikasi/Tolak
```

---

*Audit dilakukan langsung terhadap kode sumber pada 3 Oktober 2026.*
*Semua halaman, komponen, dan temuan di atas berdasarkan file yang benar-benar ada dalam kodebase.*
*Tidak ada halaman atau fitur yang dikarang — hanya berdasarkan audit nyata.*
