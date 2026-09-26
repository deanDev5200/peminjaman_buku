'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { parse, isValid, startOfDay, differenceInCalendarDays } from 'date-fns';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Borrowing } from '@/lib/db';
import { BorrowingForm } from '@/components/borrowing-form';
import { fetchAppSettings } from '@/lib/settings-client';
import type { BorrowingHistory, Settings } from '@/lib/types';

type BorrowingPayload = Omit<Borrowing, 'id' | 'created_at' | 'updated_at' | 'extend_count'>;
import { BorrowingTable } from '@/components/borrowing-table';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { AppCredit } from '@/components/app-credit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { isOverdue } from '@/lib/date-utils';
import { Plus, Search, Upload, Download, LogOut, Shield } from 'lucide-react';
import { Label } from '@/components/ui/label';

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
  const pathname = usePathname();
  const isPublicPage = pathname === '/';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string | string[]>>({});
  const [extendReason, setExtendReason] = useState('');
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendingBorrowingId, setExtendingBorrowingId] = useState<number | null>(null);
  const [extendLoading, setExtendLoading] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningBorrowingId, setReturningBorrowingId] = useState<number | null>(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);
  const deletePromiseRef = useRef<{ resolve: () => void; reject: (error: Error) => void } | null>(null);
  const [historyBorrowing, setHistoryBorrowing] = useState<Borrowing | null>(null);
  const [historyData, setHistoryData] = useState<BorrowingHistory[]>([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [borrowerHistoryBorrowing, setBorrowerHistoryBorrowing] = useState<Borrowing | null>(null);
  const [borrowerHistoryOpen, setBorrowerHistoryOpen] = useState(false);

  interface ImportReport {
    imported: number;
    errors: number;
    skippedDuplicates: number;
    total: number;
    rowErrors: { row: number; errors: string[] }[];
  }
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [importReportOpen, setImportReportOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<Settings>({
    borrow_limit_pelajaran: '3',
    borrow_limit_bacaan: '7',
    borrow_limit_guru: '30',
    max_extend_count: '1',
    due_soon_days: '7',
    root_view_days: '30',
    app_title: 'Jnana Grha Mandara',
    app_subtitle: 'Sistem Peminjaman Buku',
  });

  const fetchBorrowings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (isPublicPage) {
        params.set('status', 'active');
        params.set('days', '30');
      }
      const url = params.toString() ? `/api/borrowings?${params.toString()}` : '/api/borrowings';
      const response = await fetch(url);
      const data = await response.json();
      setBorrowings(data);
    } catch (error) {
      console.error('Error fetching borrowings:', error);
    } finally {
      setLoading(false);
    }
  }, [isPublicPage, searchTerm]);

  const compareBorrowingValues = (
    aVal: Borrowing[keyof Borrowing],
    bVal: Borrowing[keyof Borrowing],
    field: string
  ) => {
    if (aVal === undefined || bVal === undefined) return 0;

    if (field === 'tanggal_pinjam' || field === 'tanggal_kembali') {
      const aDate = typeof aVal === 'string' ? parse(aVal, 'dd/MM/yyyy', new Date()) : null;
      const bDate = typeof bVal === 'string' ? parse(bVal, 'dd/MM/yyyy', new Date()) : null;

      if (aDate && bDate && isValid(aDate) && isValid(bDate)) {
        return aDate.getTime() - bDate.getTime();
      }
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return aVal - bVal;
    }

    return 0;
  };

  const filteredBorrowings = useMemo(() => {
    let filtered = [...borrowings];

    const toFilterArray = (value: string | string[] | undefined): string[] => {
      if (value == null) return [];
      if (Array.isArray(value)) return value.filter((v) => v !== '' && v !== 'all');
      if (value === '' || value === 'all') return [];
      return [value];
    };

    const statusValues = toFilterArray(filters.status);
    if (statusValues.length > 0) {
      filtered = filtered.filter((b) =>
        statusValues.some((status) =>
          status === 'Terlambat'
            ? b.status === 'Terlambat' || isOverdue(b.tanggal_kembali, b.status)
            : b.status === status
        )
      );
    }
    const jenisValues = toFilterArray(filters.jenis_buku);
    if (jenisValues.length > 0) {
      filtered = filtered.filter((b) => jenisValues.includes(b.jenis_buku));
    }
    const kelasValues = toFilterArray(filters.kelas);
    if (kelasValues.length > 0) {
      filtered = filtered.filter((b) => kelasValues.includes(b.kelas));
    }

    if (sortField) {
      filtered.sort((a, b) => {
        const comparison = compareBorrowingValues(
          a[sortField as keyof Borrowing],
          b[sortField as keyof Borrowing],
          sortField
        );
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [borrowings, filters, sortField, sortDirection]);

  // Recalculate pagination when filtered data or itemsPerPage change
  // 1. Calculate totalPages dynamically on every render
  const totalPages = Math.max(1, Math.ceil(filteredBorrowings.length / itemsPerPage));

  // 2. Mathematically bind the current page so it never exceeds totalPages
  // If totalPages shrinks to 2, but currentPage is 5, this forces it to 2.
  const validCurrentPage = Math.min(currentPage, totalPages);

  // 3. Use validCurrentPage to slice your data for the UI
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBorrowings = filteredBorrowings.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to page 1 when changing items per page
  };

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
  };

  const handleFilter = (newFilters: Record<string, string | string[]>) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  const handleBulkDelete = (ids: number[]): Promise<void> => {
    setPendingDeleteIds(ids);
    setDeleteDialogOpen(true);
    return new Promise<void>((resolve, reject) => {
      deletePromiseRef.current = { resolve, reject };
    });
  };

  const handleBulkDeleteConfirm = async () => {
    if (pendingDeleteIds.length === 0) return;

    try {
      for (const id of pendingDeleteIds) {
        const response = await fetch(`/api/borrowings/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Gagal menghapus data ID ${id}`);
        }
      }
      toast.success(`${pendingDeleteIds.length} data berhasil dihapus!`);
      fetchBorrowings();
      setDeleteDialogOpen(false);
      deletePromiseRef.current?.resolve();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      const err = error instanceof Error ? error : new Error('Gagal menghapus data');
      toast.error(err.message);
      deletePromiseRef.current?.reject(err);
    } finally {
      deletePromiseRef.current = null;
      setPendingDeleteIds([]);
    }
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open && deletePromiseRef.current) {
      // User cancelled: keep the table selection by rejecting.
      deletePromiseRef.current.reject(new Error('Penghapusan dibatalkan'));
      deletePromiseRef.current = null;
      setPendingDeleteIds([]);
    }
  };

  // Fetch borrowings on mount and when search changes
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchBorrowings();
      void (async () => {
        const s = await fetchAppSettings();
        setAppSettings(s);
      })();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBorrowings, searchTerm]);

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
        toast.success('Data berhasil disimpan!');
      } else {
        const error = await response.json();
        const errorMessage = error.details ? error.details.join(', ') : error.error;
        toast.error('Gagal menyimpan data: ' + errorMessage);
      }
    } catch (error) {
      console.error('Error creating borrowing:', error);
      toast.error('Gagal menyimpan data');
    }
  };

  const handleExtend = async (id: number) => {
    setExtendingBorrowingId(id);
    setExtendReason('');
    setExtendDialogOpen(true);
  };

  const handleExtendConfirm = async () => {
    if (!extendingBorrowingId) return;
    
    setExtendLoading(true);
    try {
      const response = await fetch(`/api/borrowings/${extendingBorrowingId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: extendReason })
      });
      
      if (response.ok) {
        fetchBorrowings();
        setExtendDialogOpen(false);
        setExtendingBorrowingId(null);
        toast.success('Peminjaman berhasil diperpanjang!');
      } else {
        const error = await response.json();
        toast.error('Gagal memperpanjang: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error extending borrowing:', error);
      toast.error('Gagal memperpanjang peminjaman');
    } finally {
      setExtendLoading(false);
    }
  };

  const handleShowHistory = async (borrowing: Borrowing) => {
    setHistoryBorrowing(borrowing);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/borrowings/${borrowing.id}/history`);
      if (response.ok) {
        setHistoryData(await response.json());
      } else {
        setHistoryData([]);
      }
    } catch (error) {
      console.error('Error fetching borrowing history:', error);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
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
        toast.success('Data berhasil diupdate!');
      } else {
        const error = await response.json();
        const errorMessage = error.details ? error.details.join(', ') : error.error;
        toast.error('Gagal mengupdate data: ' + errorMessage);
      }
    } catch (error) {
      console.error('Error updating borrowing:', error);
      toast.error('Gagal mengupdate data');
    }
  };

  const handleReturn = (id: number) => {
    setReturningBorrowingId(id);
    setReturnDialogOpen(true);
  };

  const handleReturnConfirm = async () => {
    if (!returningBorrowingId) return;

    setReturnLoading(true);
    try {
      const response = await fetch(`/api/borrowings/${returningBorrowingId}/return`, {
        method: 'PATCH'
      });

      if (response.ok) {
        fetchBorrowings();
        setReturnDialogOpen(false);
        setReturningBorrowingId(null);
        toast.success('Buku berhasil ditandai sebagai dikembalikan!');
      } else {
        const error = await response.json();
        toast.error('Gagal menandai sebagai dikembalikan: ' + error.error);
      }
    } catch (error) {
      console.error('Error marking as returned:', error);
      toast.error('Gagal menandai sebagai dikembalikan');
    } finally {
      setReturnLoading(false);
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

    const loadingToast = toast.loading('Mengimpor file Excel...');
    try {
      const response = await fetch('/api/excel/import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        fetchBorrowings();
        setImportReport({
          imported: result.imported ?? 0,
          errors: result.errors ?? 0,
          skippedDuplicates: result.skippedDuplicates ?? 0,
          total: result.total ?? 0,
          rowErrors: result.rowErrors ?? [],
        });
        setImportReportOpen(true);
      } else {
        toast.error('Gagal import: ' + result.error);
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast.error('Gagal import Excel');
    } finally {
      toast.dismiss(loadingToast);
      // Reset file input
      e.target.value = '';
    }
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
        toast.error('Gagal export: ' + error.error);
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Gagal export Excel');
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
        toast.error('Gagal export laporan bulanan: ' + error.error);
      }
    } catch (error) {
      console.error('Error exporting monthly report:', error);
      toast.error('Gagal export laporan bulanan');
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

  const statusCounts = useMemo(() => ({
    Dipinjam: borrowings.filter((borrowing) => borrowing.status === 'Dipinjam').length,
    Dikembalikan: borrowings.filter((borrowing) => borrowing.status === 'Dikembalikan').length,
    Terlambat: borrowings.filter((borrowing) => borrowing.status === 'Terlambat').length,
    TerlambatDikembalikan: borrowings.filter((borrowing) => borrowing.status === 'Terlambat Dikembalikan').length,
  }), [borrowings]);

  const parsedMaxExtendCount = parseInt(appSettings.max_extend_count, 10);
  const maxExtendCount = Number.isNaN(parsedMaxExtendCount) ? 1 : Math.max(0, parsedMaxExtendCount);

  const overdueStats = useMemo(() => {
    const today = startOfDay(new Date());
    const parsedDueSoon = parseInt(appSettings.due_soon_days, 10);
    const dueSoonWindow = Number.isNaN(parsedDueSoon) ? 7 : Math.max(1, parsedDueSoon);
    let overdue = 0;
    let dueSoon = 0;
    let healthy = 0;

    for (const borrowing of borrowings) {
      if (borrowing.status !== 'Dipinjam' && borrowing.status !== 'Terlambat') continue;

      if (borrowing.status === 'Terlambat' || isOverdue(borrowing.tanggal_kembali, borrowing.status)) {
        overdue += 1;
        continue;
      }

      const dueDate = parse(borrowing.tanggal_kembali, 'dd/MM/yyyy', new Date());
      if (isValid(dueDate)) {
        const diff = differenceInCalendarDays(startOfDay(dueDate), today);
        if (diff >= 0 && diff <= dueSoonWindow) {
          dueSoon += 1;
          continue;
        }
      }

      healthy += 1;
    }

    return { overdue, dueSoon, healthy, active: overdue + dueSoon + healthy, dueSoonWindow };
  }, [borrowings, appSettings.due_soon_days]);

  const handleStatClick = (status: string) => {
    handleFilter({ ...filters, status: status ? [status] : [] });
  };

  const handleShowBorrowerHistory = (borrowing: Borrowing) => {
    setBorrowerHistoryBorrowing(borrowing);
    setBorrowerHistoryOpen(true);
  };

  const borrowerHistory = useMemo(() => {
    if (!borrowerHistoryBorrowing) return [];
    // NIS is the key. Teachers/staff share NIS 0, so fall back to name for them.
    if ((borrowerHistoryBorrowing.nis ?? 0) !== 0) {
      return borrowings.filter((b) => b.nis === borrowerHistoryBorrowing.nis);
    }
    return borrowings.filter((b) => (b.nis ?? 0) === 0 && b.nama === borrowerHistoryBorrowing.nama);
  }, [borrowings, borrowerHistoryBorrowing]);

  const borrowerStats = useMemo(() => ({
    total: borrowerHistory.length,
    active: borrowerHistory.filter((b) => b.status === 'Dipinjam' || b.status === 'Terlambat').length,
    overdue: borrowerHistory.filter((b) => b.status === 'Terlambat' || isOverdue(b.tanggal_kembali, b.status)).length,
    extended: borrowerHistory.filter((b) => (b.extend_count ?? 0) > 0).length,
  }), [borrowerHistory]);

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-muted/40 py-10 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Image src="/school_logo.png" alt="School Logo" width={48} height={48} className="h-12 w-12 object-contain" />
              <Image src="/library_logo.png" alt="Library Logo" width={48} height={48} className="h-12 w-12 object-contain" />
            </div>
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">{appSettings.app_title}</h1>
                  <p className="text-sm text-muted-foreground">{appSettings.app_subtitle}</p>
                </div>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Peminjaman Aktif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan Nama atau NIS..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full pl-9"
                />
              </div>
              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Memuat data...</div>
              ) : (
                <BorrowingTable
                  borrowings={paginatedBorrowings}
                  readOnly
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  totalItems={filteredBorrowings.length}
                />
              )}
            </CardContent>
          </Card>

          <AppCredit className="pt-2" />
        </div>
      </div>
    );
  }

return (
    <div className="max-w-7xl mx-auto space-y-6 py-10 px-4">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Image
                    src="/school_logo.png"
                    alt="School Logo"
                    width={48}
                    height={48}
                    className="h-9 w-9 object-contain sm:h-12 sm:w-12"
                  />
                  <Image
                    src="/library_logo.png"
                    alt="Library Logo"
                    width={48}
                    height={48}
                    className="h-9 w-9 object-contain sm:h-12 sm:w-12"
                  />
                </div>
                <div className="hidden min-w-0 sm:block">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    {appSettings.app_title}
                  </h1>
                  <p className="truncate text-sm text-muted-foreground">
                    {appSettings.app_subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)} className="flex-1 justify-center gap-2 sm:flex-none">
                  <Shield className="h-4 w-4" />
                  Ganti Password
                </Button>
                <Button variant="outline" onClick={handleLogout} className="flex-1 justify-center gap-2 sm:flex-none">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>

            {/* Overdue dashboard */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card
                className="shadow-sm cursor-pointer hover:shadow-md"
                onClick={() => handleStatClick('Terlambat')}
                title="Tampilkan yang terlambat"
              >
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold text-red-600">{overdueStats.overdue}</div>
                  <div className="text-xs text-muted-foreground">Terlambat — perlu ditagih</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm" title={`Jatuh tempo dalam ${overdueStats.dueSoonWindow} hari ke depan`}>
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold text-amber-600">{overdueStats.dueSoon}</div>
                  <div className="text-xs text-muted-foreground">Jatuh tempo ≤ {overdueStats.dueSoonWindow} hari</div>
                </CardContent>
              </Card>
              <Card
                className="shadow-sm cursor-pointer hover:shadow-md"
                onClick={() => handleStatClick('Dipinjam')}
                title="Tampilkan yang sedang dipinjam"
              >
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold text-blue-600">{overdueStats.healthy}</div>
                  <div className="text-xs text-muted-foreground">Dipinjam — aman</div>
                </CardContent>
              </Card>
              <Card
                className="shadow-sm cursor-pointer hover:shadow-md"
                onClick={() => handleStatClick('')}
                title="Tampilkan semua data"
              >
                <CardContent className="pt-4 pb-4">
                  <div className="text-2xl font-bold">{overdueStats.active}</div>
                  <div className="text-xs text-muted-foreground">Total aktif</div>
                </CardContent>
              </Card>
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
                  <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-end">
                    <Button onClick={handleNewRecord} className="col-span-2 w-full md:col-span-1 md:w-auto">
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
                      <Button variant="outline" className="w-full md:w-auto">
                        <Upload className="h-4 w-4" />
                        Import Excel
                      </Button>
                    </div>


                    <Button variant="outline" onClick={handleExcelExport} className="w-full md:w-auto">
                      <Download className="h-4 w-4" />
                      Export Excel
                    </Button>

                    <div className="col-span-2 flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-2 md:col-span-1">
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
                    <Button variant="outline" onClick={handleMonthlyReportExport} className="col-span-2 w-full md:col-span-1 md:w-auto">
                      <Download className="h-4 w-4" />
                      Export Laporan Bulanan
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

            {/* Extend Dialog */}
            <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Perpanjang Peminjaman</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="extend_reason">Alasan Perpanjangan (opsional)</Label>
                    <Input
                      id="extend_reason"
                      type="text"
                      value={extendReason}
                      onChange={(e) => setExtendReason(e.target.value)}
                      placeholder="Masukkan alasan perpanjangan..."
                      className="w-full"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setExtendDialogOpen(false);
                      setExtendingBorrowingId(null);
                      setExtendReason('');
                    }}>
                      Batal
                    </Button>
                    <Button onClick={handleExtendConfirm} disabled={extendLoading}>
                      {extendLoading ? 'Memproses...' : 'Perpanjang'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Return Confirm Dialog */}
            <ConfirmDialog
              open={returnDialogOpen}
              onOpenChange={setReturnDialogOpen}
              title="Tandai sebagai dikembalikan?"
              description={
                borrowings.find((b) => b.id === returningBorrowingId)?.nama
                  ? `Buku pinjaman atas nama ${borrowings.find((b) => b.id === returningBorrowingId)?.nama} akan ditandai sebagai dikembalikan.`
                  : 'Buku ini akan ditandai sebagai dikembalikan.'
              }
              confirmLabel="Ya, kembalikan"
              loading={returnLoading}
              onConfirm={handleReturnConfirm}
            />

            {/* Bulk Delete Confirm Dialog */}
            <ConfirmDialog
              open={deleteDialogOpen}
              onOpenChange={handleDeleteDialogChange}
              title={`Hapus ${pendingDeleteIds.length} data?`}
              description="Data peminjaman yang dihapus tidak bisa dikembalikan."
              confirmLabel="Ya, hapus"
              danger
              onConfirm={handleBulkDeleteConfirm}
            />

            {/* History Dialog */}
            <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Riwayat Perubahan Tanggal</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  {historyBorrowing && (
                    <p className="text-sm text-muted-foreground">
                      {historyBorrowing.nama} — {historyBorrowing.nama_buku} ({historyBorrowing.tanggal_pinjam})
                    </p>
                  )}
                  {historyLoading ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Memuat riwayat...</p>
                  ) : historyData.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Belum ada riwayat perpanjangan.</p>
                  ) : (
                    <ul className="max-h-64 space-y-2 overflow-y-auto">
                      {historyData.map((h, index) => (
                        <li key={h.id ?? index} className="rounded-md border px-3 py-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">
                              {h.original_tanggal_kembali} → {h.new_tanggal_kembali}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                h.kind === 'edit'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {h.kind === 'edit' ? 'Edit manual' : 'Perpanjangan'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {h.extended_at ?? ''}{h.reason ? ` • ${h.reason}` : ''}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
                      Tutup
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Borrower History Dialog */}
            <Dialog open={borrowerHistoryOpen} onOpenChange={setBorrowerHistoryOpen}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Riwayat Peminjam</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  {borrowerHistoryBorrowing && (
                    <p className="text-sm text-muted-foreground">
                      {borrowerHistoryBorrowing.nama}
                      {borrowerHistoryBorrowing.nis !== 0 ? ` — NIS ${borrowerHistoryBorrowing.nis}` : ''}
                      {borrowerHistoryBorrowing.kelas ? ` (${borrowerHistoryBorrowing.kelas})` : ''}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 font-medium">
                      Total: {borrowerStats.total}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">
                      Aktif: {borrowerStats.active}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 font-medium text-red-800">
                      Terlambat: {borrowerStats.overdue}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
                      Pernah diperpanjang: {borrowerStats.extended}
                    </span>
                  </div>
                  {borrowerHistory.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">Tidak ada riwayat peminjaman.</p>
                  ) : (
                    <ul className="max-h-64 space-y-2 overflow-y-auto">
                      {borrowerHistory.map((b) => (
                        <li key={b.id} className="rounded-md border px-3 py-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{b.nama_buku}</span>
                            <Badge
                              className={`text-xs shrink-0 ${
                                b.status === 'Dipinjam'
                                  ? 'bg-blue-500'
                                  : b.status === 'Terlambat' || b.status === 'Terlambat Dikembalikan'
                                    ? 'bg-red-500'
                                    : 'bg-green-500'
                              }`}
                            >
                              {b.status}
                            </Badge>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {b.tanggal_pinjam} → {b.tanggal_kembali} • {b.jumlah}x
                            {(b.extend_count ?? 0) > 0 ? ` • Diperpanjang ${b.extend_count}x` : ''}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setBorrowerHistoryOpen(false)}>
                      Tutup
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Import Report Dialog */}
            <Dialog open={importReportOpen} onOpenChange={setImportReportOpen}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Hasil Import Excel</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  {importReport && (
                    <>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 font-medium">
                          Total baris: {importReport.total}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
                          Berhasil: {importReport.imported}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 font-medium text-red-800">
                          Gagal: {importReport.errors}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
                          Duplikat dilewati: {importReport.skippedDuplicates}
                        </span>
                      </div>
                      {importReport.rowErrors.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          Semua baris berhasil diimpor tanpa error.
                        </p>
                      ) : (
                        <ul className="max-h-64 space-y-2 overflow-y-auto">
                          {importReport.rowErrors.map((rowError) => (
                            <li key={rowError.row} className="rounded-md border px-3 py-2 text-sm">
                              <div className="font-medium">Baris {rowError.row}</div>
                              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                                {rowError.errors.map((message, index) => (
                                  <li key={index}>{message}</li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setImportReportOpen(false)}>
                      Tutup
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
              <CardContent className="px-2 sm:px-4">
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Memuat data...</p>
                  </div>
                ) : (
                  <BorrowingTable
                    borrowings={paginatedBorrowings}
                    onEdit={handleEdit}
                    onBulkDelete={handleBulkDelete}
                    onReturn={handleReturn}
                    onExtend={handleExtend}
                    maxExtendCount={maxExtendCount}
                    onShowHistory={handleShowHistory}
                    onShowBorrowerHistory={handleShowBorrowerHistory}
                    onSelect={handleSelect}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    totalItems={filteredBorrowings.length}
                    onSort={handleSort}
                    onFilter={handleFilter}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    filters={filters}
                  />
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3 justify-center text-sm">
                  <span className="inline-flex items-center rounded-full bg-status-borrowed px-3 py-1 text-xs font-medium text-status-borrowed-foreground">
                    Dipinjam: {statusCounts.Dipinjam}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-status-returned px-3 py-1 text-xs font-medium text-status-returned-foreground">
                    Dikembalikan: {statusCounts.Dikembalikan}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-status-overdue px-3 py-1 text-xs font-medium text-status-overdue-foreground">
                    Terlambat: {statusCounts.Terlambat}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-status-overdue px-3 py-1 text-xs font-medium text-status-overdue-foreground">
                    Terlambat Dikembalikan: {statusCounts.TerlambatDikembalikan}
                  </span>
                </div>
              </CardContent>
            </Card>

            <AppCredit className="pt-2" />
    </div>
  );
}