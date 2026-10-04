'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react';

/* ─── Scroll-reveal wrapper with repeating animation ─────────────────── */
function Reveal({
  children,
  delay = 0,
  className = '',
  style,
  repeat = true,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  repeat?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timeoutId: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timeoutId = setTimeout(() => {
            el.classList.add('reveal-visible');
          }, delay);
        } else if (repeat) {
          clearTimeout(timeoutId);
          el.classList.remove('reveal-visible');
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [delay, repeat]);

  return (
    <div ref={ref} className={`reveal-hidden ${className}`} style={style}>
      {children}
    </div>
  );
}

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const dashboardHref =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'officer'
      ? '/petugas'
      : '/dashboard';

  return (
    <>
      {/* ─── Reveal & Interactive Styles ──────────────────────────── */}
      <style>{`
        /* Spring Pop-up animation (bounces into place) */
        .reveal-hidden {
          opacity: 0;
          transform: translateY(48px) scale(0.92);
          transition: opacity 0.5s ease-out,
                      transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
          will-change: transform, opacity;
        }
        .reveal-visible {
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
        }

        /* ── Button hover lift + glow + shine ────────────────── */
        .btn-cta-primary {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.85rem 2rem;
          background: linear-gradient(135deg, #4350C0 0%, #343FA0 100%);
          color: #fff;
          font-weight: 700;
          font-size: 0.95rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 8px 24px rgba(67, 80, 192, 0.32), 0 2px 6px rgba(0,0,0,0.06);
          overflow: hidden;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.25s ease,
                      filter 0.25s ease;
        }
        .btn-cta-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transform: skewX(-20deg);
          transition: left 0.75s ease;
        }
        .btn-cta-primary:hover {
          transform: translateY(-4px) scale(1.03);
          box-shadow: 0 14px 36px rgba(67, 80, 192, 0.48), 0 4px 10px rgba(0,0,0,0.1);
          filter: brightness(1.06);
        }
        .btn-cta-primary:hover::before {
          left: 160%;
        }
        .btn-cta-primary:active {
          transform: translateY(-1px) scale(0.98);
          box-shadow: 0 4px 14px rgba(67, 80, 192, 0.28);
        }

        .btn-cta-ghost {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.85rem 2rem;
          background: #FFFFFF;
          color: #333333;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 12px;
          border: 1.5px solid #D6D8EA;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.25s ease,
                      border-color 0.25s ease,
                      background 0.25s ease,
                      color 0.25s ease;
        }
        .btn-cta-ghost:hover {
          transform: translateY(-4px) scale(1.03);
          border-color: #5C6AE4;
          background: #F4F6FD;
          color: #4350C0;
          box-shadow: 0 10px 28px rgba(67, 80, 192, 0.16);
        }
        .btn-cta-ghost:active {
          transform: translateY(-1px) scale(0.98);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        /* ── Hero CTA buttons ────────────────────────────────── */
        .btn-hero-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 2rem;
          background: #fff;
          color: #4350C0;
          font-weight: 700;
          border-radius: 10px;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.25s ease;
          box-shadow: 0 6px 24px rgba(0,0,0,0.18);
        }
        .btn-hero-primary:hover {
          transform: translateY(-4px) scale(1.04);
          box-shadow: 0 14px 40px rgba(0,0,0,0.25);
        }
        .btn-hero-primary:active { transform: translateY(0) scale(0.98); }

        .btn-hero-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 2rem;
          background: rgba(92,106,228,0.25);
          color: #fff;
          font-weight: 600;
          border-radius: 10px;
          border: 1.5px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(6px);
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.25s ease,
                      background 0.25s ease;
        }
        .btn-hero-ghost:hover {
          transform: translateY(-4px) scale(1.04);
          background: rgba(92,106,228,0.45);
          box-shadow: 0 10px 32px rgba(92,106,228,0.4);
        }
        .btn-hero-ghost:active { transform: translateY(0) scale(0.98); }

        /* ── Feature card hover ──────────────────────────────── */
        .feature-card {
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid #E7E5E0;
          background: #FFFFFF;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.3s ease,
                      border-color 0.3s ease;
          cursor: default;
        }
        .feature-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 18px 50px rgba(67,80,192,0.15);
          border-color: #C3C9F5;
        }

        /* ── Metric item ─────────────────────────────────────── */
        .metric-item {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .metric-item:hover {
          transform: translateY(-4px) scale(1.08);
        }
      `}</style>

      <div className="min-h-[80vh] bg-canvas text-ink">
        {/* ─── Hero Section ────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary-600 text-white py-24 px-4 sm:px-6 lg:px-8">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide text-primary-100 mb-8">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              Sistem Informasi Fasilitas Kampus Terpadu
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-tight mb-6">
              Reservasi Cepat & Pelaporan <br className="hidden sm:inline" />
              <span className="text-gold">Fasilitas Kampus</span> Modern
            </h1>

            <p className="text-lg sm:text-xl text-primary-100 mb-10 max-w-2xl mx-auto font-normal leading-relaxed">
              Platform terpusat untuk mahasiswa, dosen, dan staf. Akses jadwal ruangan,
              laboratorium, peralatan, dan pemeliharaan fasilitas secara transparan.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/facilities" className="btn-hero-primary group w-full sm:w-auto">
                <span>Jelajahi Fasilitas</span>
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              {isLoading ? (
                <div className="h-12 w-44 rounded-md bg-white/20 animate-pulse" />
              ) : isAuthenticated ? (
                <Link href={dashboardHref} className="btn-hero-ghost w-full sm:w-auto">
                  <span>Buka Dashboard</span>
                </Link>
              ) : (
                <Link href="/register" className="btn-hero-ghost w-full sm:w-auto">
                  <span>Daftar Akun Baru</span>
                </Link>
              )}
            </div>

            {/* Quick Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-16 pt-12 border-t border-white/15 max-w-3xl mx-auto">
              {[
                { value: '50+', label: 'Ruangan & Lab Siap Pakai', color: 'text-white' },
                { value: '1,200+', label: 'Reservasi Berhasil', color: 'text-gold' },
                { value: '24/7', label: 'Akses Jadwal Real-time', color: 'text-white', span: true },
              ].map((m) => (
                <div key={m.label} className={`metric-item ${m.span ? 'col-span-2 md:col-span-1' : ''}`}>
                  <p className={`text-3xl sm:text-4xl font-extrabold font-heading ${m.color}`}>{m.value}</p>
                  <p className="text-xs sm:text-sm text-primary-200 mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features Section ────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3.5 py-1.5 rounded-full border border-primary-100 shadow-xs">
              Fitur Utama
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-ink mt-4">
              Layanan Kampus Lebih Mudah & Terstruktur
            </h2>
            <p className="text-sm text-ink-soft mt-2 leading-relaxed">
              Semua proses administrasi fasilitas kini terintegrasi dalam satu sistem digital.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Reservasi Fasilitas Presisi',
                desc: 'Pesan ruang kuliah, laboratorium, aula, dan peralatan penunjang dengan pilihan slot waktu terperinci per 30 menit tanpa tumpang tindih.',
                iconBg: 'bg-primary-50',
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-sienna" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ),
                title: 'Pelaporan Kerusakan Cepat',
                desc: 'Laporkan kendala fasilitas secara langsung, lampirkan bukti kendala, dan pantau status perbaikan oleh petugas secara transparan.',
                iconBg: 'bg-orange-50',
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Transparansi Jadwal Publik',
                desc: 'Siapa saja dapat memeriksa ketersediaan ruangan sebelum merencanakan kegiatan akademik maupun organisasi kemahasiswaan.',
                iconBg: 'bg-violet-50',
              },
            ].map((feature, i) => (
              <Reveal key={feature.title} delay={i * 140}>
                <div className="feature-card">
                  <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-6 border border-line`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold font-heading text-ink mb-2">{feature.title}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ─── Bottom CTA Section ───────────────────────────────────── */}
        <section className="py-20 px-4 bg-gradient-to-b from-surface via-surface to-canvas border-t border-line">
          <div className="max-w-3xl mx-auto text-center">
            {isLoading ? (
              <div className="h-24 animate-pulse bg-line rounded-2xl" />
            ) : isAuthenticated ? (
              <div>
                <Reveal delay={0}>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-xs inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Sesi Aktif
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold font-heading text-ink mt-4 mb-2">
                    Selamat Datang Kembali, {user?.name}!
                  </h2>
                  <p className="text-sm text-ink-soft mb-8 max-w-lg mx-auto">
                    Anda masuk sebagai <span className="font-semibold text-primary-700 capitalize">{user?.role}</span>. Kelola kegiatan dan peminjaman fasilitas Anda sekarang.
                  </p>
                </Reveal>

                {/* Staggered Pop-Up Buttons */}
                <div className="flex flex-wrap gap-4 justify-center items-center">
                  <Reveal delay={150}>
                    <Link href={dashboardHref} className="btn-cta-primary group">
                      <span>Buka Dashboard</span>
                      <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </Reveal>

                  <Reveal delay={300}>
                    <Link href="/facilities" className="btn-cta-ghost group">
                      <svg className="w-4 h-4 text-primary-500 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>Katalog Fasilitas</span>
                    </Link>
                  </Reveal>
                </div>
              </div>
            ) : (
              <div>
                <Reveal delay={0}>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3.5 py-1.5 rounded-full border border-primary-100 shadow-xs inline-flex items-center gap-1.5">
                    Siap Mulai
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold font-heading text-ink mt-4 mb-3">
                    Mulai Gunakan Fasilitas Kampus Hari Ini
                  </h2>
                  <p className="text-sm text-ink-soft max-w-md mx-auto mb-8">
                    Daftar dengan akun kampus Anda untuk mulai mengajukan peminjaman ruangan, alat laboratorium, dan pelaporan kendala.
                  </p>
                </Reveal>

                {/* Staggered Pop-Up Buttons */}
                <div className="flex flex-wrap gap-4 justify-center items-center">
                  <Reveal delay={150}>
                    <Link href="/register" className="btn-cta-primary group">
                      <svg className="w-4 h-4 text-gold transition-transform duration-200 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Daftar Akun Baru</span>
                      <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </Reveal>

                  <Reveal delay={300}>
                    <Link href="/login" className="btn-cta-ghost group">
                      <svg className="w-4 h-4 text-primary-600 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>Masuk ke Akun</span>
                    </Link>
                  </Reveal>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

