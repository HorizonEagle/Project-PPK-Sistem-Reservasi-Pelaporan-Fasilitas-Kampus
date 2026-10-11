# BAB VI
# ANTARMUKA DAN FITUR APLIKASI

> Catatan: setiap `[Gambar: ...]` adalah tempat tangkapan layar (screenshot) halaman. Jalankan aplikasi di `http://localhost:3000`, ambil screenshot sesuai alamat halaman yang tertera, lalu tempel di posisi tersebut (seperti pada laporan acuan).

## 6.1. Gambaran Umum Antarmuka

Aplikasi Sistem Reservasi dan Pelaporan Fasilitas Kampus dibangun dengan Next.js (App Router) dan Tailwind CSS. Antarmuka dibagi menjadi empat area sesuai hak akses: halaman publik (pengunjung), area pengguna (`/dashboard`), area petugas (`/petugas`), dan area admin (`/admin`). Setelah login, sistem mengarahkan pengguna ke dashboard sesuai perannya.

## 6.2. Fitur Utama

### 6.2.1. Untuk Pengunjung (tanpa login)

**Halaman Beranda (`/`)**

[Gambar: halaman beranda bagian hero dan fitur utama]

- Bagian *hero* berjudul "Reservasi Cepat & Pelaporan Fasilitas Kampus Modern" dengan tombol **Jelajahi Fasilitas** dan **Daftar Akun Baru**. Jika sudah login, tombol berubah menjadi **Buka Dashboard** dan **Katalog Fasilitas**.
- Bagian **Fitur Utama** menampilkan tiga kartu: Reservasi Fasilitas Presisi (slot per 30 menit tanpa tumpang tindih), Pelaporan Kerusakan Cepat, dan Transparansi Jadwal Publik.
- Bagian ajakan di akhir halaman ("Mulai Gunakan Fasilitas Kampus Hari Ini") memuat tombol **Daftar Akun Baru** dan **Masuk ke Akun**. Elemen halaman muncul dengan animasi saat di-scroll.

**Halaman Katalog Fasilitas (`/facilities`)**

[Gambar: halaman katalog fasilitas dengan filter]

- Menampilkan seluruh fasilitas kampus (ruang kuliah, aula, laboratorium, peralatan, lapangan) dalam bentuk kartu berfoto.
- Tersedia pencarian nama atau lokasi ("Cari nama, lokasi..."), filter **Semua Tipe**, dan filter **Kapasitas minimum**.
- Di bawah daftar terdapat keterangan jumlah, misalnya "Menampilkan X dari Y fasilitas". Jika tidak ada hasil, tampil pesan "Tidak ada fasilitas ditemukan".

**Halaman Detail Fasilitas dan Jadwal Ketersediaan (`/facilities/[id]`)**

[Gambar: detail fasilitas dan grid jadwal ketersediaan]

- Menampilkan **Informasi Fasilitas**: tipe, lokasi, kapasitas, status, dan deskripsi.
- Bagian **Jadwal Ketersediaan** menunjukkan slot waktu per tanggal, ditandai tersedia, terpesan, atau dalam perbaikan.
- Pengunjung yang belum login diarahkan untuk login terlebih dahulu sebelum reservasi. Pengguna yang sudah login melihat tombol **Ajukan Reservasi** dan **Reservasi Fasilitas Ini**.
- Fasilitas nonaktif menampilkan peringatan tidak menerima reservasi. Fasilitas dalam perbaikan menampilkan peringatan semua slot tidak tersedia.

### 6.2.2. Autentikasi

**Halaman Registrasi (`/register`)**

[Gambar: halaman Buat Akun Baru]

- Formulir berisi **Nama Lengkap**, **Email Kampus**, **Status Akademik / Peran** (misalnya staf administrasi), **Kata Sandi** (minimal 8 karakter), dan **Konfirmasi Kata Sandi**.
- Validasi di sisi klien: nama minimal 2 karakter, format email valid, kata sandi minimal 8 karakter, dan konfirmasi harus sama.
- Akun baru harus diverifikasi admin sebelum dapat dipakai untuk reservasi. Tersedia tautan **Masuk di sini** bagi yang sudah punya akun.

**Halaman Login (`/login`)**

[Gambar: halaman Masuk ke Akun]

- Formulir **Email Kampus** dan **Kata Sandi** dengan tombol **Masuk Sekarang**, serta tautan **Daftar sekarang**.
- Terdapat panel **Akun Percobaan (Demo)** berisi akun admin, petugas, dan pengguna untuk pengujian.
- Setelah berhasil, pengguna diarahkan otomatis: admin ke `/admin`, petugas ke `/petugas`, pengguna ke `/dashboard`.

### 6.2.3. Untuk Pengguna

**Dashboard Pengguna (`/dashboard`)**

[Gambar: dashboard pengguna]

- Sapaan "Selamat Datang, (nama pengguna)" dan tombol **Reservasi Baru**.
- Empat kartu statistik: **Total Reservasi**, **Menunggu Review**, **Laporan Kerusakan**, dan **Fasilitas Aktif**.
- **Aksi Cepat**: Buat Reservasi Baru, Laporkan Kerusakan, Riwayat Reservasi, dan Laporan Saya.
- Tersedia tautan **Katalog Fasilitas** untuk mengecek jadwal sebelum mengajukan reservasi.

**Halaman Ajukan Reservasi Baru (`/dashboard/reservations/new`)**

[Gambar: formulir reservasi, pilih fasilitas dan grid slot waktu]

- Langkah 1, **Pilih Fasilitas**: kartu fasilitas aktif yang dapat diklik.
- Langkah 2, **Pilih Tanggal & Slot Waktu**: pengguna mengklik jam mulai lalu jam selesai, dan slot di antaranya terisi otomatis. Terdapat tombol **Hapus Pilihan** atau **Reset Pilihan**.
- Legenda slot: Tersedia, Terpesan, Dalam Perbaikan, dan Lewat atau kurang dari 12 jam. Pemesanan hari ini hanya untuk 12 jam ke depan.
- Langkah 3, **Tujuan Penggunaan**: minimal 10 karakter dengan penghitung karakter (maksimal 500).
- Kartu **Ringkasan Reservasi** menampilkan fasilitas, tanggal, waktu, dan lokasi sebelum tombol **Ajukan Reservasi** ditekan. Pesan sukses: "Menunggu persetujuan petugas".

**Halaman Reservasi Saya (`/dashboard/reservations`)**

[Gambar: daftar reservasi pengguna]

- Tabel riwayat reservasi dengan kolom Fasilitas, Tanggal, Waktu, Status, dan Aksi.
- Filter **Semua Status** dan tombol **Ajukan Reservasi Baru**. Jika kosong tampil "Belum ada reservasi".
- Tautan **Detail** membuka halaman detail reservasi.

**Halaman Detail Reservasi (`/dashboard/reservations/[id]`)**

[Gambar: detail reservasi dan modal pembatalan]

- Menampilkan data **Fasilitas** (nama, lokasi, tipe), **Jadwal** (tanggal, waktu, durasi), dan **Tujuan Penggunaan**.
- Bagian **Informasi Pemrosesan** berisi petugas yang memproses, tanggal proses, serta alasan penolakan atau pembatalan.
- Tombol **Batalkan Reservasi** membuka modal konfirmasi dengan kolom alasan (opsional) dan tombol **Ya, Batalkan** atau **Kembali**.

**Halaman Laporan Saya (`/dashboard/reports`)**

[Gambar: daftar laporan kerusakan pengguna]

- Daftar laporan kerusakan milik pengguna dengan filter status dan tombol **Buat Laporan**. Jika kosong tampil "Belum ada laporan".

**Halaman Buat Laporan Kerusakan (`/dashboard/reports/new`)**

[Gambar: formulir laporan kerusakan]

- Kolom **Fasilitas**, **Kategori Laporan**, **Deskripsi Kerusakan** (minimal 10 karakter), dan **URL Foto** (opsional).
- Tombol **Kirim Laporan** dan **Batal**.

**Halaman Detail Laporan (`/dashboard/reports/[id]`)**

[Gambar: detail laporan dengan progres penanganan]

- Menampilkan alur progres status, data fasilitas, kategori, tanggal laporan, deskripsi, dan foto.
- Bagian **Informasi Penanganan** memuat petugas pemroses, tanggal proses, dan catatan resolusi. Laporan yang ditolak diberi tanda khusus.

### 6.2.4. Untuk Petugas

**Dashboard Petugas (`/petugas`)**

[Gambar: dashboard petugas]

- Empat kartu statistik: **Antrian Reservasi**, **Laporan Baru**, **Fasilitas Perbaikan**, dan **Fasilitas Aktif**.
- Bagian **Operasional Lapangan** berisi pintasan ke Antrian Reservasi, Antrian Laporan, dan Status Fasilitas.

**Halaman Antrian Reservasi (`/petugas/reservations`)**

[Gambar: tabel antrian reservasi]

- Tabel dengan kolom Pemohon, Fasilitas, Tanggal & Waktu, Tujuan, Status, dan Aksi, dengan filter status (default Menunggu).
- Aksi **Detail**, **Setujui**, **Tolak**, dan **Batalkan**.
- Modal **Tolak Reservasi** mewajibkan alasan minimal 5 karakter.
- Modal **Batalkan Reservasi (Darurat)** untuk reservasi yang sudah disetujui, dengan alasan wajib minimal 5 karakter.

**Halaman Manajemen Laporan Kerusakan (`/petugas/reports`)**

[Gambar: tabel laporan kerusakan petugas]

- Kolom Tanggal / Pelapor, Fasilitas / Kategori, Deskripsi, Status, dan Aksi, dengan filter status dan tombol **Refresh**.
- Tombol **Lihat Foto** untuk bukti kerusakan.
- Alur status: **Tindak Lanjuti** (menjadi Sedang Ditangani), lalu **Tandai Selesai** atau **Tolak**. Catatan resolusi wajib diisi.
- Untuk kerusakan berat, fasilitas otomatis berstatus "Dalam Perbaikan" (ditampilkan sebagai peringatan di modal).

**Halaman Status Fasilitas (`/petugas/facilities`)**

[Gambar: tabel status fasilitas petugas]

- Tabel fasilitas dengan pencarian. Tombol **Tandai Perbaikan** dan **Selesai Perbaikan**.
- Perubahan status meminta konfirmasi lewat modal: semua slot menjadi tidak tersedia selama perbaikan.
- Fasilitas yang dinonaktifkan admin ditandai "Dinonaktifkan oleh Admin" dan tidak dapat diubah petugas.

### 6.2.5. Untuk Admin

**Dashboard Administrator (`/admin`)**

[Gambar: dashboard admin]

- Kartu statistik: **Menunggu Verifikasi**, **Total Fasilitas**, **Total Reservasi**, dan **Pengguna Terdaftar**. Setiap kartu menjadi tautan ke halaman terkait.
- Bagian **Akun Menunggu Verifikasi** menampilkan 5 pendaftar terbaru dengan tombol **Periksa Akun**. Jika kosong tampil "Semua Akun Telah Diverifikasi".
- Pintasan **Buat Akun**, **Registrasi Pengguna Baru**, dan **Kelola Master Fasilitas**.

**Halaman Kelola Pengguna (`/admin/users`)**

[Gambar: daftar pengguna admin]

- Pencarian nama atau email, filter Role dan Status, serta tombol **Cari**, **Reset**, dan **+ Buat Akun Baru**.
- Tabel Nama, Email, Role, Status, Terdaftar, dan Aksi (**Verifikasi**, **Tolak**, **Detail**), serta total pengguna.

**Halaman Detail Pengguna (`/admin/users/[id]`)**

[Gambar: detail pengguna]

- **Informasi Profil**: ID, nama, email, peran, status akun, dan tanggal bergabung.
- Untuk akun pending tersedia tombol **Verifikasi** dan **Tolak**.
- Bagian **Pengaturan** untuk **Ubah Peran** (Pengguna Reguler, Petugas, Administrator) dengan tombol **Simpan Perubahan**.

**Halaman Buat Akun Baru (`/admin/users/create`)**

[Gambar: formulir buat akun admin]

- Kolom Nama Lengkap, Email, Role, dan Password (minimal 8 karakter).
- Akun yang dibuat admin langsung aktif tanpa verifikasi. Akun petugas hanya dapat dibuat oleh admin.

**Halaman Kelola Fasilitas (`/admin/facilities`)**

[Gambar: tabel fasilitas dan modal tambah fasilitas]

- Pencarian, filter tipe dan status, serta tabel Fasilitas, Tipe, Lokasi, Kapasitas, Status, dan Aksi.
- Tombol **Edit**, **Nonaktifkan**, **Aktifkan**, dan **Selesai Perbaikan**, serta pagination.
- Tombol **Tambah Fasilitas** membuka modal berisi nama, tipe, lokasi, kapasitas, dan deskripsi.

**Halaman Edit Fasilitas (`/admin/facilities/[id]/edit`)**

[Gambar: formulir edit fasilitas]

- Formulir nama, tipe, lokasi, kapasitas, status (Aktif, Nonaktif, Dalam Perbaikan), dan deskripsi. Tombol **Simpan Perubahan** dan **Batal**.

**Halaman Rekap & Ekspor (`/admin/reports`)**

[Gambar: halaman rekap dan ekspor data]

- Kartu ringkasan: Total Reservasi (pending), Total Laporan (baru), Total Fasilitas (aktif), dan Total Pengguna (pending).
- Bagian **Ekspor Data**: pilih Jenis Data (Reservasi atau Pelaporan), Format File (CSV, Excel, PDF), dan rentang tanggal opsional, lalu tekan **Unduh Data**.

### 6.2.6. Aspek Non-Fungsional

- Keamanan: autentikasi JWT dengan password di-hash bcrypt, pemisahan hak akses per peran (admin, petugas, pengguna), serta validasi menggunakan Zod di server dan validasi formulir di klien.
- Antarmuka: responsif dengan Tailwind CSS, komponen UI seragam (kartu, tabel, modal, badge, alert), dan indikator pemuatan.
- Arsitektur: frontend Next.js (port 3000) dan backend API Next.js (port 3001) dengan basis data PostgreSQL melalui Prisma.
