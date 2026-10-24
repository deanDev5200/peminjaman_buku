'use client';

/*
 * Sistem Peminjaman Buku - book-borrowing management system for school library
 * Copyright (C) 2026 I Dewa Gede Agung Dean Putra Purwita
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LayoutGrid, Settings as SettingsIcon, Shield, History, LogOut, ChevronLeft, KeyRound } from 'lucide-react';

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
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Semua kolom harus diisi.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');

    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();

      if (!response.ok) {
        setPasswordError(result.error || 'Gagal mengubah password.');
        return;
      }

      setIsPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password berhasil diubah. Silakan login kembali dengan password baru.');
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Gagal mengubah password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      console.error('Logout failed');
    } finally {
      router.push('/');
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
            className="lg:hidden p-2 rounded-md hover:bg-accent cursor-pointer"
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
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground ${
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
            onClick={() => {
              onClose();
              setPasswordError('');
              setIsPasswordDialogOpen(true);
            }}
            className="mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground"
          >
            <KeyRound className="h-5 w-5" />
            Ganti Password
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Password Aplikasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password saat ini</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Masukkan password lama"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password baru</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Konfirmasi password baru</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Ketik ulang password baru"
              />
            </div>

            {passwordError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {passwordError}
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handlePasswordChange} disabled={passwordLoading}>
                {passwordLoading ? 'Menyimpan...' : 'Simpan Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
