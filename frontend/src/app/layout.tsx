import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar, Footer } from '@/components/layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'FasilitasKampus — Sistem Reservasi & Pelaporan',
    template: '%s | FasilitasKampus',
  },
  description:
    'Sistem terpusat untuk reservasi fasilitas kampus dan pelaporan kerusakan. Mudah, cepat, dan transparan.',
  keywords: ['reservasi', 'fasilitas', 'kampus', 'laboratorium', 'ruang kuliah'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
