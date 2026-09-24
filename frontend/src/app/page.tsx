import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FasilitasKampus — Sistem Reservasi & Pelaporan',
  description:
    'Platform terpusat untuk reservasi fasilitas kampus dan pelaporan kerusakan. Mudah, cepat, transparan.',
};

export default function HomePage() {
  return (
    <div className="min-h-[80vh]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-6">🏫</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Sistem Reservasi &<br />
            Pelaporan Fasilitas Kampus
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Satu platform terpusat untuk mahasiswa, dosen, dan staf. Reservasi ruangan,
            laboratorium, dan fasilitas lainnya dengan mudah.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/facilities"
              className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Lihat Fasilitas →
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl border border-blue-400 hover:bg-blue-500 transition-colors"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Apa yang Bisa Anda Lakukan?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '📅',
                title: 'Reservasi Fasilitas',
                desc: 'Pesan ruang kuliah, laboratorium, aula, lapangan, dan peralatan dengan sistem slot 30 menit yang jelas.',
              },
              {
                icon: '🔧',
                title: 'Laporkan Kerusakan',
                desc: 'Laporkan kerusakan atau masalah fasilitas disertai foto. Pantau status penanganan secara real-time.',
              },
              {
                icon: '📊',
                title: 'Transparansi Penuh',
                desc: 'Lihat jadwal ketersediaan fasilitas secara publik tanpa perlu login. Tidak ada lagi jadwal yang tersembunyi.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sudah punya akun?</h2>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Masuk Sekarang
            </Link>
            <Link
              href="/facilities"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
            >
              Lihat Fasilitas
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
