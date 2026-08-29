'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Borrowing } from '@/lib/db';
import { BorrowingForm } from '@/components/borrowing-form';

type BorrowingPayload = Omit<Borrowing, 'id' | 'created_at' | 'updated_at'>;
import { BorrowingTable } from '@/components/borrowing-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Plus, Search, Upload, Download, LogOut, Shield } from 'lucide-react';

const getCurrentAcademicYear = () => {
  const today = new Date();
  const baseYear = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
  return `${baseYear}/${baseYear + 1}`;
};

const getAcademicYearOptions = () => {
  const today = new Date();
  const currentBaseYear = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
  const startYear = 2025;
  const endYear = 2045;

  const years: string[] = [];
  for (let academicStart = startYear; academicStart <= endYear; academicStart += 1) {
    years.push(`${academicStart}/${academicStart + 1}`);
  }

  if (currentBaseYear < startYear || currentBaseYear > endYear) {
    return years;
  }

  return years.filter((year) => {
    const [start] = year.split('/').map(Number);
    return start >= startYear && start <= endYear;
  });
};

export default function Home() {
  const router = useRouter();
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [editingBorrowing, setEditingBorrowing] = useState<Borrowing | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportAcademicYear, setReportAcademicYear] = useState(getCurrentAcademicYear());
  const [loading, setLoading] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchBorrowings = useCallback(async () => {
    try {
      setLoading(true);
      const url = searchTerm 
        ? `/api/borrowings?search=${encodeURIComponent(searchTerm)}`
        : '/api/borrowings';
      const response = await fetch(url);
      const data = await response.json();
      setBorrowings(data);
    } catch (error) {
      console.error('Error fetching borrowings:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Fetch borrowings on mount and when search changes
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchBorrowings();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBorrowings]);

  const handleCreate = async (data: BorrowingPayload) => {
    try {
      const response = await fetch('/api/borrowings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        fetchBorrowings();
        setIsDialogOpen(false);
        setEditingBorrowing(null);
        alert('Data berhasil disimpan!');
      } else {
        const error = await response.json();
        alert('Gagal menyimpan data: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating borrowing:', error);
      alert('Gagal menyimpan data');
    }
  };

  const handleUpdate = async (data: BorrowingPayload) => {
    if (!editingBorrowing?.id) return;
    
    try {
      const response = await fetch(`/api/borrowings/${editingBorrowing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        fetchBorrowings();
        setIsDialogOpen(false);
        setEditingBorrowing(null);
        alert('Data berhasil diupdate!');
      } else {
        const error = await response.json();
        alert('Gagal mengupdate data: ' + error.error);
      }
    } catch (error) {
      console.error('Error updating borrowing:', error);
      alert('Gagal mengupdate data');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    try {
      const response = await fetch(`/api/borrowings/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchBorrowings();
        alert('Data berhasil dihapus!');
      } else {
        const error = await response.json();
        alert('Gagal menghapus data: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting borrowing:', error);
      alert('Gagal menghapus data');
    }
  };

  const handleReturn = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menandai buku ini sebagai dikembalikan?')) return;
    
    try {
      const response = await fetch(`/api/borrowings/${id}/return`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        fetchBorrowings();
        alert('Buku berhasil ditandai sebagai dikembalikan!');
      } else {
        const error = await response.json();
        alert('Gagal menandai sebagai dikembalikan: ' + error.error);
      }
    } catch (error) {
      console.error('Error marking as returned:', error);
      alert('Gagal menandai sebagai dikembalikan');
    }
  };

  const handleEdit = (borrowing: Borrowing) => {
    setEditingBorrowing(borrowing);
    setIsDialogOpen(true);
  };

  const handleSelect = (borrowing: Borrowing) => {
    setEditingBorrowing(borrowing);
  };

  const handleCancelEdit = () => {
    setEditingBorrowing(null);
    setIsDialogOpen(false);
  };

  const handleNewRecord = () => {
    setEditingBorrowing(null);
    setIsDialogOpen(true);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/excel/import', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        fetchBorrowings();
        alert(`Import selesai! Berhasil: ${result.imported}, Gagal: ${result.errors}`);
      } else {
        alert('Gagal import: ' + result.error);
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      alert('Gagal import Excel');
    }
    
    // Reset file input
    e.target.value = '';
  };

  const handleExcelExport = async () => {
    try {
      const response = await fetch('/api/excel/export');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `peminjaman-buku-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert('Gagal export: ' + error.error);
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Gagal export Excel');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const handleMonthlyReportExport = async () => {
    try {
      const response = await fetch(`/api/excel/export?type=monthly&academicYear=${encodeURIComponent(reportAcademicYear)}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const formattedYear = reportAcademicYear.replace('/', '-');
        a.download = `Laporan-Bulanan-TA-${formattedYear}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert('Gagal export laporan bulanan: ' + error.error);
      }
    } catch (error) {
      console.error('Error exporting monthly report:', error);
      alert('Gagal export laporan bulanan');
    }
  };

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
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
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
      alert('Password berhasil diubah. Silakan login kembali dengan password baru.');
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

  return (
    <div className="min-h-screen bg-muted/40 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Sistem Peminjaman Buku
              </h1>
              <p className="text-sm text-muted-foreground">
                Kelola peminjaman buku perpustakaan dengan mudah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)} className="gap-2">
              <Shield className="h-4 w-4" />
              Ganti Password
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Search and Actions */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1 w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan Nama atau NIS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap justify-start md:justify-end">
                <Button onClick={handleNewRecord}>
                  <Plus className="h-4 w-4" />
                  Tambah Peminjaman
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingBorrowing ? 'Edit Data Peminjaman' : 'Tambah Peminjaman Baru'}
                      </DialogTitle>
                    </DialogHeader>
                    <BorrowingForm
                      onSubmit={editingBorrowing ? handleUpdate : handleCreate}
                      initialData={editingBorrowing || undefined}
                      onCancel={handleCancelEdit}
                      isEdit={!!editingBorrowing}
                    />
                  </DialogContent>
                </Dialog>

                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelImport}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline">
                    <Upload className="h-4 w-4" />
                    Import Excel
                  </Button>
                </div>

                <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-2">
                  <label className="text-sm font-medium text-muted-foreground">Tahun Ajaran</label>
                  <select
                    value={reportAcademicYear}
                    onChange={(e) => setReportAcademicYear(e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {getAcademicYearOptions().map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <Button variant="outline" onClick={handleMonthlyReportExport}>
                  <Download className="h-4 w-4" />
                  Export Laporan Bulanan
                </Button>
                <Button variant="outline" onClick={handleExcelExport}>
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Daftar Peminjaman Buku</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Memuat data...</p>
              </div>
            ) : (
              <BorrowingTable
                borrowings={borrowings}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReturn={handleReturn}
                onSelect={handleSelect}
              />
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 justify-center text-sm">
              <span className="inline-flex items-center rounded-full bg-status-borrowed px-3 py-1 text-xs font-medium text-status-borrowed-foreground">
                Dipinjam
              </span>
              <span className="inline-flex items-center rounded-full bg-status-returned px-3 py-1 text-xs font-medium text-status-returned-foreground">
                Dikembalikan
              </span>
              <span className="inline-flex items-center rounded-full bg-status-overdue px-3 py-1 text-xs font-medium text-status-overdue-foreground">
                Terlambat
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}