'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/facilities', label: 'Fasilitas', icon: '🏛️', exact: false },
  { href: '/admin/users', label: 'Pengguna', icon: '👥', exact: false },
  { href: '/admin/reports', label: 'Rekap & Ekspor', icon: '📋', exact: false },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (user?.role !== 'admin') return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="text-xs text-gray-500">Login sebagai</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.name}
              </p>
            </div>
          </div>
        </div>
        <nav className="p-2">
          {adminNavItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {children}
      </div>
    </div>
  );
}
