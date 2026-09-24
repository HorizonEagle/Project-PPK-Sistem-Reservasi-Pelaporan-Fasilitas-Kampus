'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Dashboard link berdasarkan role
  const dashboardHref =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'officer'
      ? '/petugas'
      : '/dashboard';

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/facilities', label: 'Fasilitas' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-700">
            <span className="text-2xl">🏫</span>
            <span className="hidden sm:inline">FasilitasKampus</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-8 w-24 rounded-lg bg-gray-100 animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={dashboardHref}
                  className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-sm text-gray-700">
                  <span className="text-base">
                    {user.role === 'admin' ? '⚙️' : user.role === 'officer' ? '🔧' : '👤'}
                  </span>
                  <span className="hidden sm:inline font-medium">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  Daftar
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2 text-sm font-medium rounded-lg ${
                  pathname === link.href ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                href={dashboardHref}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg"
              >
                Dashboard
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-600 font-medium">
            <span>🏫</span>
            <span>FasilitasKampus</span>
          </div>
          <p className="text-sm text-gray-500">
            Sistem Reservasi & Pelaporan Fasilitas Kampus &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
