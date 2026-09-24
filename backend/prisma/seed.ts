import { PrismaClient, UserRole, UserStatus, FacilityType, FacilityStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

  // ─── 1. Hapus data lama (urutan reverse foreign key) ───────────────────────
  await prisma.report.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.user.deleteMany();

  // ─── 2. Admin & Petugas ─────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', BCRYPT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@kampus.ac.id',
      passwordHash: adminPassword,
      role: UserRole.admin,
      status: UserStatus.active,
    },
  });

  const officerPassword = await bcrypt.hash('petugas123', BCRYPT_ROUNDS);
  const officer = await prisma.user.create({
    data: {
      name: 'Petugas Fasilitas',
      email: 'petugas@kampus.ac.id',
      passwordHash: officerPassword,
      role: UserRole.officer,
      status: UserStatus.active,
    },
  });

  // ─── 3. Pengguna contoh ─────────────────────────────────────────────────────
  const userPassword = await bcrypt.hash('user123', BCRYPT_ROUNDS);
  const user1 = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi@mahasiswa.ac.id',
      passwordHash: userPassword,
      role: UserRole.user,
      status: UserStatus.active,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Siti Rahayu',
      email: 'siti@mahasiswa.ac.id',
      passwordHash: userPassword,
      role: UserRole.user,
      status: UserStatus.active,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Ahmad Pending',
      email: 'ahmad@mahasiswa.ac.id',
      passwordHash: userPassword,
      role: UserRole.user,
      status: UserStatus.pending_verification,
    },
  });

  console.log('✅ Users created:', { admin: admin.email, officer: officer.email });

  // ─── 4. Fasilitas contoh ────────────────────────────────────────────────────
  const facilities = await Promise.all([
    prisma.facility.create({
      data: {
        name: 'Ruang Kuliah A101',
        type: FacilityType.classroom,
        location: 'Gedung A, Lantai 1',
        capacity: 40,
        description: 'Ruang kuliah standar dengan AC dan proyektor',
        status: FacilityStatus.active,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Ruang Kuliah B202',
        type: FacilityType.classroom,
        location: 'Gedung B, Lantai 2',
        capacity: 30,
        description: 'Ruang kuliah ukuran sedang',
        status: FacilityStatus.active,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Laboratorium Komputer 1',
        type: FacilityType.laboratory,
        location: 'Gedung C, Lantai 1',
        capacity: 35,
        description: 'Lab komputer dengan 35 unit PC dan koneksi internet',
        status: FacilityStatus.active,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Aula Utama',
        type: FacilityType.auditorium,
        location: 'Gedung Pusat',
        capacity: 500,
        description: 'Aula serbaguna untuk acara besar, dilengkapi sound system',
        status: FacilityStatus.active,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Lapangan Basket',
        type: FacilityType.field,
        location: 'Area Olahraga',
        capacity: 20,
        description: 'Lapangan basket outdoor dengan tribun kecil',
        status: FacilityStatus.active,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Laboratorium Fisika',
        type: FacilityType.laboratory,
        location: 'Gedung C, Lantai 2',
        capacity: 25,
        description: 'Lab fisika dengan peralatan eksperimen lengkap',
        status: FacilityStatus.active,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Proyektor Portable Set A',
        type: FacilityType.equipment,
        location: 'Ruang Penyimpanan, Gedung A',
        capacity: 1,
        description: 'Set proyektor portable + layar + kabel HDMI, untuk dipinjam',
        status: FacilityStatus.active,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Lapangan Futsal',
        type: FacilityType.field,
        location: 'Area Olahraga',
        capacity: 14,
        description: 'Lapangan futsal indoor dengan lantai vinyl',
        status: FacilityStatus.active,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Ruang Seminar C301',
        type: FacilityType.classroom,
        location: 'Gedung C, Lantai 3',
        capacity: 60,
        description: 'Ruang seminar dengan layout teater, cocok untuk presentasi besar',
        status: FacilityStatus.active,
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Laboratorium Kimia',
        type: FacilityType.laboratory,
        location: 'Gedung D, Lantai 1',
        capacity: 20,
        description: 'Lab kimia dengan lemari asam dan peralatan analitik',
        status: FacilityStatus.under_maintenance,
      },
    }),
  ]);

  console.log(`✅ ${facilities.length} facilities created`);

  // ─── 5. Reservasi contoh ────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const startTime1 = new Date(1970, 0, 1, 9, 0, 0); // 09:00
  const endTime1 = new Date(1970, 0, 1, 10, 30, 0); // 10:30

  const startTime2 = new Date(1970, 0, 1, 13, 0, 0); // 13:00
  const endTime2 = new Date(1970, 0, 1, 14, 0, 0);   // 14:00

  await prisma.reservation.create({
    data: {
      userId: user1.id,
      facilityId: facilities[0].id, // Ruang A101
      date: tomorrow,
      startTime: startTime1,
      endTime: endTime1,
      purpose: 'Presentasi tugas akhir kelompok mata kuliah Rekayasa Perangkat Lunak',
      status: 'pending',
    },
  });

  await prisma.reservation.create({
    data: {
      userId: user2.id,
      facilityId: facilities[2].id, // Lab Komputer
      date: dayAfter,
      startTime: startTime2,
      endTime: endTime2,
      purpose: 'Praktikum pemrograman web untuk kelas IF-4A',
      status: 'approved',
      processedBy: officer.id,
      processedAt: new Date(),
    },
  });

  await prisma.reservation.create({
    data: {
      userId: user1.id,
      facilityId: facilities[4].id, // Lapangan Basket
      date: tomorrow,
      startTime: startTime2,
      endTime: endTime2,
      purpose: 'Latihan basket tim BEM Universitas',
      status: 'rejected',
      rejectionReason: 'Lapangan sedang digunakan untuk acara kampus resmi',
      processedBy: officer.id,
      processedAt: new Date(),
    },
  });

  console.log('✅ Sample reservations created');

  // ─── 6. Laporan kerusakan contoh ────────────────────────────────────────────
  await prisma.report.create({
    data: {
      userId: user1.id,
      facilityId: facilities[0].id, // Ruang A101
      category: 'kerusakan_ringan',
      description: 'Lampu di sudut kanan depan ruangan mati dan perlu diganti',
      status: 'new_report',
    },
  });

  await prisma.report.create({
    data: {
      userId: user2.id,
      facilityId: facilities[2].id, // Lab Komputer
      category: 'kerusakan_berat',
      description: 'Tiga unit komputer tidak bisa booting, kemungkinan masalah harddisk',
      status: 'in_progress',
      processedBy: officer.id,
      processedAt: new Date(),
    },
  });

  await prisma.report.create({
    data: {
      userId: user1.id,
      facilityId: facilities[3].id, // Aula
      category: 'kebersihan',
      description: 'Toilet di dekat pintu masuk aula dalam kondisi kotor dan tidak terawat',
      status: 'resolved',
      resolutionNote: 'Telah dibersihkan oleh tim kebersihan pada pagi hari',
      processedBy: officer.id,
      processedAt: new Date(),
    },
  });

  console.log('✅ Sample reports created');
  console.log('\n🎉 Seeding completed!');
  console.log('📌 Akun yang tersedia:');
  console.log('   Admin   : admin@kampus.ac.id / admin123');
  console.log('   Petugas : petugas@kampus.ac.id / petugas123');
  console.log('   User    : budi@mahasiswa.ac.id / user123');
  console.log('   User    : siti@mahasiswa.ac.id / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
