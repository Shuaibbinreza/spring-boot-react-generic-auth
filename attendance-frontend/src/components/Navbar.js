'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  const isAdmin = user?.roles && Array.from(user.roles).some(r => {
    const rStr = typeof r === 'string' ? r : r?.name || '';
    return rStr.includes('ADMIN');
  });

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-maroon-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3 font-bold text-lg text-maroon-700 tracking-tight">
            <img src="/logo.png" alt="AMC Logo" className="h-9 w-auto object-contain" />
            <span>Attendance System</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-maroon-50 text-maroon-700 border border-maroon-300 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-maroon-100'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/attendance"
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                pathname === '/attendance'
                  ? 'bg-maroon-50 text-maroon-700 border border-maroon-300 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-maroon-100'
              }`}
            >
              My Attendance
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/admin/groups"
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    pathname === '/admin/groups'
                      ? 'bg-maroon-50 text-maroon-700 border border-maroon-300 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-maroon-100'
                  }`}
                >
                  Group Management
                </Link>
                <Link
                  href="/admin/summary"
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    pathname === '/admin/summary'
                      ? 'bg-maroon-50 text-maroon-700 border border-maroon-300 font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-maroon-100'
                  }`}
                >
                  Summary & Analytics
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user?.roles && Array.from(user.roles).map((role) => {
            const roleStr = typeof role === 'string' ? role : (role?.name || String(role));
            return (
              <span
                key={roleStr}
                className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-maroon-50 text-maroon-700 border border-maroon-300"
              >
                {roleStr.replace('ROLE_', '')}
              </span>
            );
          })}
          <span className="text-xs font-medium text-stone-700 mr-2">
            {user?.fullName || user?.username}
          </span>
          <button
            className="px-3 py-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-colors cursor-pointer"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
