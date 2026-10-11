'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import { Avatar } from '@/components/ui';

export function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthPage = pathname === '/login' || pathname === '/register';

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
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        isAuthPage
          ? 'bg-transparent border-none shadow-none pt-2'
          : 'bg-surface/90 backdrop-blur-md border-b border-line'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with FASKAM Image */}
          <Link
            href="/"
            className={`flex items-center gap-2.5 font-bold font-heading text-lg group transition-colors ${
              isAuthPage ? 'text-white drop-shadow-md' : 'text-ink'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-all overflow-hidden p-0.5 border border-line/40">
              <img
                src="/Images/Faskam-logo.png"
                alt="Logo FASKAM"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="tracking-tight font-bold font-heading text-base leading-tight">
                FASKAM
              </span>
              <span className={`text-[10px] font-medium leading-none ${isAuthPage ? 'text-white/80' : 'text-ink-muted'}`}>
                Fasilitas Kampus
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              if (isAuthPage) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all backdrop-blur-md shadow-md active:scale-95 ${
                      isActive
                        ? 'text-white bg-primary-600/90 border border-primary-400/50 shadow-primary-900/30'
                        : 'text-white bg-black/45 hover:bg-black/60 border border-white/20 hover:border-white/40'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary-700 bg-primary-50 font-semibold'
                      : 'text-ink-soft hover:text-ink hover:bg-canvas'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className={`h-9 w-24 rounded-full animate-pulse ${isAuthPage ? 'bg-white/20' : 'bg-line'}`} />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href={dashboardHref}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full transition-all shadow-md ${
                    isAuthPage
                      ? 'text-white bg-primary-600/90 hover:bg-primary-600 border border-primary-400/50 backdrop-blur-md'
                      : 'text-primary-700 bg-primary-50 border border-primary-200/60 hover:bg-primary-100'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Dashboard
                </Link>

                <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${isAuthPage ? 'bg-black/45 border border-white/20 backdrop-blur-md shadow-md' : 'pl-2'}`}>
                  <Avatar name={user.name} role={user.role} size="sm" />
                  <div className="hidden lg:block text-left pr-2">
                    <p className={`text-xs font-semibold leading-tight truncate max-w-[120px] ${isAuthPage ? 'text-white' : 'text-ink'}`}>
                      {user.name}
                    </p>
                    <p className={`text-[10px] capitalize leading-tight ${isAuthPage ? 'text-white/80' : 'text-ink-muted'}`}>
                      {user.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Keluar"
                  className={`p-2 rounded-full transition-all cursor-pointer shadow-md ${
                    isAuthPage ? 'text-white/90 bg-black/45 hover:bg-red-500/80 border border-white/20 backdrop-blur-md' : 'text-ink-muted hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : isAuthPage ? (
              /* Floating pill buttons on auth pages without any bar behind them */
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className={`px-4 py-1.5 text-sm font-bold rounded-full transition-all backdrop-blur-md shadow-md active:scale-95 ${
                    pathname === '/login'
                      ? 'bg-primary-600 text-white border border-primary-400/60 shadow-primary-900/40'
                      : 'text-white bg-black/45 hover:bg-black/60 border border-white/20'
                  }`}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className={`px-4 py-1.5 text-sm font-bold rounded-full transition-all backdrop-blur-md shadow-md active:scale-95 ${
                    pathname === '/register'
                      ? 'bg-primary-600 text-white border border-primary-400/60 shadow-primary-900/40'
                      : 'bg-gold text-primary-950 hover:bg-gold/90 border border-gold/90'
                  }`}
                >
                  Daftar
                </Link>
              </div>
            ) : (
              /* Standard buttons on regular pages */
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-ink-soft hover:text-ink hover:bg-canvas rounded-md transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-all shadow-sm"
                >
                  Daftar
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-full transition-all ${
                isAuthPage
                  ? 'text-white bg-black/45 hover:bg-black/60 border border-white/20 backdrop-blur-md shadow-md'
                  : 'text-ink-soft hover:text-ink hover:bg-canvas'
              }`}
              aria-label="Toggle menu"
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
          <div
            className={`md:hidden py-3 space-y-1.5 rounded-2xl mt-2 px-3 border transition-all ${
              isAuthPage
                ? 'bg-black/85 backdrop-blur-2xl border-white/20 text-white shadow-float'
                : 'border-t border-line bg-surface'
            }`}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2 text-sm font-semibold rounded-xl ${
                  pathname === link.href
                    ? isAuthPage
                      ? 'text-white bg-primary-600/90 border border-primary-400/50'
                      : 'text-primary-700 bg-primary-50'
                    : isAuthPage
                    ? 'text-white/90 hover:bg-white/15'
                    : 'text-ink-soft hover:bg-canvas'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <Link
                href={dashboardHref}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 text-sm font-semibold text-primary-400 hover:bg-white/10 rounded-xl"
              >
                Dashboard
              </Link>
            ) : (
              <div className="pt-2 border-t border-white/15 flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold bg-primary-600 text-white rounded-xl shadow-md"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2 text-xs font-bold bg-gold text-primary-950 rounded-xl shadow-md"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  const pathname = usePathname();

  // Hide footer on authentication pages and portal dashboards with fixed sidebars
  const isPortalPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/petugas');

  if (pathname === '/login' || pathname === '/register' || isPortalPage) {
    return null;
  }

  return (
    <footer className="bg-surface border-t border-line mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden p-0.5 border border-line shadow-xs">
              <img
                src="/Images/Faskam-logo.png"
                alt="Logo FASKAM"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="font-bold font-heading text-sm text-ink">FASKAM</p>
              <p className="text-xs text-ink-muted">Fasilitas Kampus</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-ink-soft">
            <Link href="/" className="hover:text-primary-600 transition-colors">
              Beranda
            </Link>
            <Link href="/facilities" className="hover:text-primary-600 transition-colors">
              Fasilitas
            </Link>
            <Link href="/login" className="hover:text-primary-600 transition-colors">
              Masuk
            </Link>
            <Link href="/register" className="hover:text-primary-600 transition-colors">
              Daftar
            </Link>
          </div>

          <p className="text-xs text-ink-muted">
            &copy; {new Date().getFullYear()} FASKAM — Fasilitas Kampus. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
