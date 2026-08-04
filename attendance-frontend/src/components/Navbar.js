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

  const getLinkClasses = (path) => {
    const isActive = pathname === path;
    const base = "px-3.5 h-10 flex items-center justify-center text-sm whitespace-nowrap transition-colors border cursor-pointer shrink-0";
    if (isActive) {
      return `${base} bg-maroon-50 text-maroon-700 border-maroon-300 font-semibold shadow-xs`;
    }
    return `${base} text-stone-600 hover:text-stone-900 hover:bg-maroon-100/70 border-transparent font-medium`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-maroon-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
        <div className="flex items-center gap-5 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg text-maroon-700 tracking-tight shrink-0">
            <img src="/logo.png" alt="AMC Logo" className="h-9 w-auto object-contain" />
            <span className="hidden sm:inline">Attendance System</span>
          </Link>
          <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto py-1 no-scrollbar">
            <Link href="/dashboard" className={getLinkClasses('/dashboard')}>
              Dashboard
            </Link>
            <Link href="/attendance" className={getLinkClasses('/attendance')}>
              My Attendance
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin/users" className={getLinkClasses('/admin/users')}>
                  User Registration
                </Link>
                <Link href="/admin/groups" className={getLinkClasses('/admin/groups')}>
                  Group Management
                </Link>
                <Link href="/admin/summary" className={getLinkClasses('/admin/summary')}>
                  Summary & Analytics
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <span className="text-sm font-semibold text-stone-800 whitespace-nowrap">
            {user?.fullName || user?.username}
          </span>
          <button
            className="px-3.5 h-10 flex items-center justify-center text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer shrink-0"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
