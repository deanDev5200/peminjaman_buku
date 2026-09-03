'use client';

import { useState } from 'react';
import { Borrowing } from '@/lib/db';
import { isOverdue } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Trash2, ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface BorrowingTableProps {
  borrowings: Borrowing[];
  onEdit?: (borrowing: Borrowing) => void;
  onBulkDelete?: (ids: number[]) => Promise<void>;
  onReturn?: (id: number) => void;
  onSelect?: (borrowing: Borrowing) => void;
  readOnly?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (items: number) => void;
  totalItems?: number;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, string>) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, string>;
}

export function BorrowingTable({ 
  borrowings, 
  onEdit, 
  onBulkDelete,
  onReturn, 
  onSelect,
  readOnly = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  totalItems = 0,
  onSort,
  sortField,
  sortDirection,
  onFilter,
  filters = {}
}: BorrowingTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(borrowings.map(b => b.id!)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (visibleSelectedIds.size === 0 || !onBulkDelete) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${visibleSelectedIds.size} data ini?`)) return;

    try {
      await onBulkDelete(Array.from(visibleSelectedIds));
      setSelectedIds(new Set());
    } catch {
      // Keep current selection when deletion fails.
    }
  };

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort?.(field, newDirection);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    onFilter?.(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = Object.keys(filters).reduce((acc, key) => ({ ...acc, [key]: '' }), {});
    onFilter?.(clearedFilters);
  };

  const visibleSelectedIds = new Set(
    borrowings
      .map((borrowing) => borrowing.id)
      .filter((id): id is number => id !== undefined && selectedIds.has(id))
  );
  const allSelected = borrowings.length > 0 && visibleSelectedIds.size === borrowings.length;
  const someSelected = visibleSelectedIds.size > 0 && visibleSelectedIds.size < borrowings.length;

  return (
    <div className="space-y-3">
      {/* Filters */}
      {!readOnly && <div className="flex flex-wrap gap-3 items-center p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Filter:</span>
        </div>
        
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => handleFilterChange('status', value === 'all' || value == null ? '' : value)}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="Dipinjam">Dipinjam</SelectItem>
            <SelectItem value="Dikembalikan">Dikembalikan</SelectItem>
            <SelectItem value="Terlambat">Terlambat</SelectItem>
            <SelectItem value="Terlambat Dikembalikan">Terlambat Dikembalikan</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.jenis_buku || 'all'}
          onValueChange={(value) => handleFilterChange('jenis_buku', value === 'all' || value == null ? '' : value)}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Jenis Buku" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            <SelectItem value="Pelajaran">Pelajaran</SelectItem>
            <SelectItem value="Bacaan">Bacaan</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.kelas || 'all'}
          onValueChange={(value) => handleFilterChange('kelas', value === 'all' || value == null ? '' : value)}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kelas</SelectItem>
            <SelectItem value="GURU/PEGAWAI">GURU/PEGAWAI</SelectItem>
            <SelectItem value="X TKJ 1">X TKJ 1</SelectItem>
            <SelectItem value="X TKJ 2">X TKJ 2</SelectItem>
            <SelectItem value="X DPIB 1">X DPIB 1</SelectItem>
            <SelectItem value="X DPIB 2">X DPIB 2</SelectItem>
            <SelectItem value="X TO 1">X TO 1</SelectItem>
            <SelectItem value="X TO 2">X TO 2</SelectItem>
            <SelectItem value="XI TKJ 1">XI TKJ 1</SelectItem>
            <SelectItem value="XI TKJ 2">XI TKJ 2</SelectItem>
            <SelectItem value="XI DPIB 1">XI DPIB 1</SelectItem>
            <SelectItem value="XI DPIB 2">XI DPIB 2</SelectItem>
            <SelectItem value="XI TO 1">XI TO 1</SelectItem>
            <SelectItem value="XI TO 2">XI TO 2</SelectItem>
            <SelectItem value="XII TKJ 1">XII TKJ 1</SelectItem>
            <SelectItem value="XII TKJ 2">XII TKJ 2</SelectItem>
            <SelectItem value="XII DPIB 1">XII DPIB 1</SelectItem>
            <SelectItem value="XII DPIB 2">XII DPIB 2</SelectItem>
            <SelectItem value="XII TO 1">XII TO 1</SelectItem>
            <SelectItem value="XII TO 2">XII TO 2</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="h-8 text-xs"
        >
          Reset Filter
        </Button>

        <div className="flex-1" />

        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="h-8 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Hapus {selectedIds.size} Data
          </Button>
        )}
      </div>}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {!readOnly && <TableHead className="min-w-10 py-2 px-3 text-xs font-semibold">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                  className="h-4 w-4"
                />
              </TableHead>}
              <TableHead 
                className="min-w-25 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('nama')}
              >
                <div className="flex items-center gap-1">
                  Nama
                  {sortField === 'nama' && <ArrowUpDown className="h-3 w-3" />}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-17.5 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('nis')}
              >
                <div className="flex items-center gap-1">
                  NIS
                  {sortField === 'nis' && <ArrowUpDown className="h-3 w-3" />}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-22.5 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('kelas')}
              >
                <div className="flex items-center gap-1">
                  Kelas
                  {sortField === 'kelas' && <ArrowUpDown className="h-3 w-3" />}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-32.5 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('nama_buku')}
              >
                <div className="flex items-center gap-1">
                  Nama Buku
                  {sortField === 'nama_buku' && <ArrowUpDown className="h-3 w-3" />}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-20 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('jenis_buku')}
              >
                <div className="flex items-center gap-1">
                  Jenis
                  {sortField === 'jenis_buku' && <ArrowUpDown className="h-3 w-3" />}
                </div>
              </TableHead>
              <TableHead className="min-w-20 py-2 px-3 text-xs font-semibold">Kode</TableHead>
              <TableHead 
                className="min-w-12.5 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('jumlah')}
              >
                <div className="flex items-center gap-1">
                  Jml
                  {sortField === 'jumlah' && <ArrowUpDown className="h-3 w-3" />}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-22.5 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('tanggal_pinjam')}
              >
                <div className="flex items-center gap-1">
                  Tgl Pinjam
                  {sortField === 'tanggal_pinjam' && <ArrowUpDown className="h-3 w-3" />}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-22.5 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('tanggal_kembali')}
              >
                <div className="flex items-center gap-1">
                  Tgl Kembali
                  {sortField === 'tanggal_kembali' && <ArrowUpDown className="h-3 w-3" />}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-20 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === 'status' && <ArrowUpDown className="h-3 w-3" />}
                </div>
              </TableHead>
              {!readOnly && <TableHead className="sticky right-0 z-20 min-w-35 bg-muted/50 py-2 px-3 text-right text-xs font-semibold shadow-[-4px_0_8px_-6px_rgba(0,0,0,0.4)]">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {borrowings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={readOnly ? 10 : 12} className="text-center py-6 text-sm">
                  Tidak ada data peminjaman
                </TableCell>
              </TableRow>
            ) : (
              borrowings.map((borrowing) => {
                const overdue = isOverdue(borrowing.tanggal_kembali, borrowing.status);
                const isSelected = selectedIds.has(borrowing.id!);
                
                return (
                  <TableRow
                    key={borrowing.id}
                    className={`hover:bg-muted/50 ${overdue ? 'bg-red-50/50' : ''} ${isSelected ? 'bg-primary/5' : ''}`}
                    onClick={() => onSelect?.(borrowing)}
                  >
                    {!readOnly && <TableCell className="py-2 px-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(borrowing.id!, checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4"
                      />
                    </TableCell>}
                    <TableCell className="py-2 px-3 text-sm font-medium">{borrowing.nama}</TableCell>
                    <TableCell className="py-2 px-3 text-sm">{borrowing.nis}</TableCell>
                    <TableCell className="py-2 px-3 text-sm">{borrowing.kelas}</TableCell>
                    <TableCell className="py-2 px-3 text-sm">{borrowing.nama_buku}</TableCell>
                    <TableCell className="py-2 px-3 text-sm">{borrowing.jenis_buku}</TableCell>
                    <TableCell className="py-2 px-3 text-sm">{borrowing.kode_buku}</TableCell>
                    <TableCell className="py-2 px-3 text-sm">{borrowing.jumlah}</TableCell>
                    <TableCell className="py-2 px-3 text-sm">{borrowing.tanggal_pinjam}</TableCell>
                    <TableCell className={`py-2 px-3 text-sm ${overdue ? 'text-red-600 font-semibold' : ''}`}>
                      {borrowing.tanggal_kembali}
                      {overdue && ' ⚠'}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-sm">
                      <Badge
                        variant={borrowing.status === 'Dikembalikan' || borrowing.status === 'Terlambat Dikembalikan' ? 'secondary' : 'default'}
                        className={`text-xs ${
                          borrowing.status === 'Dipinjam'
                            ? 'bg-blue-500'
                            : borrowing.status === 'Terlambat' || borrowing.status === 'Terlambat Dikembalikan'
                              ? 'bg-red-500'
                              : 'bg-green-500'
                        }`}
                      >
                        {borrowing.status}
                      </Badge>
                    </TableCell>
                    {!readOnly && <TableCell className="sticky right-0 z-10 bg-background py-2 px-3 text-right shadow-[-4px_0_8px_-6px_rgba(0,0,0,0.4)]">
                      <div className="flex gap-1 justify-end">
                        {(borrowing.status === 'Dipinjam' || borrowing.status === 'Terlambat') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReturn?.(borrowing.id!);
                            }}
                            className="h-7 px-2 text-xs bg-orange-500 text-white hover:bg-orange-600"
                          >
                            Kembali
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(borrowing);
                          }}
                          className="h-7 px-2 text-xs bg-green-500 text-white hover:bg-green-600"
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {(totalPages > 1 || onItemsPerPageChange) && (
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Halaman {currentPage} dari {totalPages}
            </span>
            <span className="text-xs">
              ({totalItems} total data)
            </span>
          </div>
          <div className="flex items-center gap-3">
            {onItemsPerPageChange && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Tampilkan:</span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(value) => onItemsPerPageChange(Number(value))}
                >
                  <SelectTrigger className="h-8 w-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {onPageChange && totalPages > 1 && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 px-2 text-xs"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className="h-8 w-8 text-xs"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2 text-xs"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
