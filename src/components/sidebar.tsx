'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid, Settings as SettingsIcon, Shield, History, LogOut, ChevronLeft } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { href: '/admin/peminjaman', label: 'Peminjaman', icon: LayoutGrid },
  { href: '/admin/audit', label: 'Riwayat', icon: History },
  { href: '/admin/settings', label: 'Pengaturan', icon: SettingsIcon },
  { href: '/admin/security', label: 'Keamanan', icon: Shield },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      console.error('Logout failed');
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <>
      {/* Sidebar for admin pages */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <Image src="/school_logo.png" alt="School Logo" width={32} height={32} className="h-8 w-8 object-contain" />
            <Image src="/library_logo.png" alt="Library Logo" width={32} height={32} className="h-8 w-8 object-contain" />
          </div>
          <button
            className="lg:hidden p-2 rounded-md hover:bg-accent"
            onClick={onClose}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
