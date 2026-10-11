import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar, Footer } from '@/components/layout';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'FASKAM — Fasilitas Kampus',
    template: '%s | FASKAM',
  },
  description:
    'FASKAM — Fasilitas Kampus. Sistem terpusat untuk reservasi fasilitas kampus dan pelaporan kerusakan. Mudah, cepat, dan transparan.',
  keywords: ['FASKAM', 'fasilitas kampus', 'reservasi', 'fasilitas', 'kampus', 'laboratorium', 'ruang kuliah'],
  icons: {
    icon: '/Images/Faskam-logo.png',
    shortcut: '/Images/Faskam-logo.png',
    apple: '/Images/Faskam-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${plusJakartaSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-canvas text-ink antialiased">
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
