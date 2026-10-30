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

import { useEffect, useRef, useState } from 'react';
import { format, isValid, parse } from 'date-fns';
import { Borrowing } from '@/lib/types';
import { isOverdue } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
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
import { ChevronDown, ChevronLeft, ChevronRight, Trash2, ArrowUp, ArrowDown, RotateCcw, X } from 'lucide-react';
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
  selectableBorrowingIds?: number[];
  onEdit?: (borrowing: Borrowing) => void;
  onBulkDelete?: (ids: number[]) => Promise<void>;
  onReturn?: (id: number) => void;
  onExtend?: (id: number) => void;
  maxExtendCount?: number;
  onShowHistory?: (borrowing: Borrowing) => void;
  onShowBorrowerHistory?: (borrowing: Borrowing) => void;
  onSelect?: (borrowing: Borrowing) => void;
  readOnly?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (items: number) => void;
  totalItems?: number;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, string | string[]>) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: Record<string, string | string[]>;
}

const STATUS_OPTIONS = [
  'Dipinjam',
  'Dikembalikan',
  'Terlambat',
  'Terlambat Dikembalikan',
];

const JENIS_BUKU_OPTIONS = ['Pelajaran', 'Bacaan'];

const KELAS_OPTIONS = [
  'GURU/PEGAWAI',
  'X TKJ 1',
  'X TKJ 2',
  'X DPIB 1',
  'X DPIB 2',
  'X TO 1',
  'X TO 2',
  'XI TKJ 1',
  'XI TKJ 2',
  'XI DPIB 1',
  'XI DPIB 2',
  'XI TO 1',
  'XI TO 2',
  'XII TKJ 1',
  'XII TKJ 2',
  'XII DPIB 1',
  'XII DPIB 2',
  'XII TO 1',
  'XII TO 2',
];

function toSelectedArray(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.filter((v) => v !== '' && v !== 'all');
  if (value === '' || value === 'all') return [];
  return [value];
}

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  triggerClassName?: string;
  dropdownClassName?: string;
}

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  triggerClassName,
  dropdownClassName,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const allSelected = options.length > 0 && selected.length === options.length;

  return (
    <div ref={containerRef} className="relative min-w-0">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'h-8 min-w-0 w-full justify-between gap-2 text-xs font-normal',
          selected.length > 0 && 'border-primary/50 bg-primary/5',
          triggerClassName
        )}
      >
        <span className="truncate">
          {selected.length === 0
            ? label
            : selected.length === 1
              ? selected[0]
              : `${label} (${selected.length})`}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 opacity-60 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <div
          className={cn(
            'absolute left-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-md border bg-background shadow-lg',
            dropdownClassName
          )}
        >
          <div className="flex items-center justify-between border-b px-2 py-1.5">
            <button
              type="button"
              onClick={() => onChange(allSelected ? [] : [...options])}
              className="cursor-pointer text-[11px] font-medium text-primary hover:underline"
            >
              {allSelected ? 'Hapus semua' : 'Pilih semua'}
            </button>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="cursor-pointer text-[11px] text-muted-foreground hover:underline"
              >
                Bersihkan
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {options.map((option) => {
              const checked = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleValue(option)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-muted"
                >
                  <Checkbox
                    checked={checked}
                    tabIndex={-1}
                    className="pointer-events-none h-4 w-4"
                  />
                  <span className={cn('flex-1 truncate', checked && 'font-medium')}>{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function BorrowingTable({ 
  borrowings, 
  selectableBorrowingIds,
  onEdit, 
  onBulkDelete,
  onReturn, 
  onExtend,
  maxExtendCount = 1,
  onShowHistory,
  onShowBorrowerHistory,
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
  const allSelectableIds = selectableBorrowingIds ?? borrowings.flatMap((borrowing) =>
    borrowing.id === undefined ? [] : [borrowing.id]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(allSelectableIds));
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
    if (selectedInScopeIds.length === 0 || !onBulkDelete) return;

    try {
      await onBulkDelete(selectedInScopeIds);
      setSelectedIds(new Set());
    } catch {
      // Keep current selection when deletion fails.
    }
  };

  const handleSort = (field: string) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort?.(field, newDirection);
  };

  const handleFilterChange = (key: string, value: string[]) => {
    const newFilters = { ...filters, [key]: value };
    onFilter?.(newFilters);
  };

  const handleRemoveFilterValue = (key: string, value: string) => {
    if (key === 'tanggal_pinjam_range') {
      onFilter?.({ ...filters, tanggal_pinjam_from: [], tanggal_pinjam_to: [] });
      return;
    }
    const current = toSelectedArray(filters[key]);
    onFilter?.({ ...filters, [key]: current.filter((v) => v !== value) });
  };

  const clearFilters = () => {
    const clearedFilters: Record<string, string | string[]> = { ...filters };
    for (const key of Object.keys(clearedFilters)) {
      clearedFilters[key] = [];
    }
    clearedFilters.status = [];
    clearedFilters.jenis_buku = [];
    clearedFilters.kelas = [];
    onFilter?.(clearedFilters);
  };

  const selectedStatus = toSelectedArray(filters.status);
  const selectedJenis = toSelectedArray(filters.jenis_buku);
  const selectedKelas = toSelectedArray(filters.kelas);
  const startDate = toSelectedArray(filters.tanggal_pinjam_from)[0] ?? '';
  const endDate = toSelectedArray(filters.tanggal_pinjam_to)[0] ?? '';
  const hasDateRangeInput = Boolean(startDate || endDate);
  const isDateRangeActive = Boolean(startDate && endDate);
  const activeFilterCount = selectedStatus.length + selectedJenis.length + selectedKelas.length + Number(hasDateRangeInput);
  const activeFilterChips: { key: string; value: string }[] = [
    ...selectedStatus.map((value) => ({ key: 'status', value })),
    ...selectedJenis.map((value) => ({ key: 'jenis_buku', value })),
    ...selectedKelas.map((value) => ({ key: 'kelas', value })),
  ];
  if (isDateRangeActive) {
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
    const end = parse(endDate, 'yyyy-MM-dd', new Date());
    if (isValid(start) && isValid(end)) {
      activeFilterChips.push({
        key: 'tanggal_pinjam_range',
        value: `Tanggal pinjam: ${format(start, 'dd/MM/yyyy')} – ${format(end, 'dd/MM/yyyy')}`,
      });
    }
  }

  const selectedInScopeIds = allSelectableIds.filter((id) => selectedIds.has(id));
  const allSelected = allSelectableIds.length > 0 && selectedInScopeIds.length === allSelectableIds.length;
  const someSelected = selectedInScopeIds.length > 0 && !allSelected;

  return (
    <div className="space-y-3">
      {/* Filters */}
      {!readOnly && (
        <div className="space-y-3 rounded-lg border bg-muted/30 p-3 sm:p-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
              className="h-8 shrink-0 text-xs"
            >
              Reset Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <MultiSelectFilter
              label="Status"
              options={STATUS_OPTIONS}
              selected={selectedStatus}
              onChange={(value) => handleFilterChange('status', value)}
            />

            <MultiSelectFilter
              label="Jenis Buku"
              options={JENIS_BUKU_OPTIONS}
              selected={selectedJenis}
              onChange={(value) => handleFilterChange('jenis_buku', value)}
            />

            <MultiSelectFilter
              label="Kelas"
              options={KELAS_OPTIONS}
              selected={selectedKelas}
              onChange={(value) => handleFilterChange('kelas', value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              <span>Tanggal pinjam dari</span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) =>
                  handleFilterChange('tanggal_pinjam_from', event.target.value ? [event.target.value] : [])
                }
                className="h-8 w-full cursor-pointer rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              <span>Tanggal pinjam sampai</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) =>
                  handleFilterChange('tanggal_pinjam_to', event.target.value ? [event.target.value] : [])
                }
                className="h-8 w-full cursor-pointer rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          </div>

          {hasDateRangeInput && !isDateRangeActive && (
            <p className="text-xs text-muted-foreground">
              Pilih tanggal mulai dan sampai untuk menerapkan filter tanggal.
            </p>
          )}

          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t pt-2">
              {activeFilterChips.map(({ key, value }) => (
                <Badge
                  key={`${key}-${value}`}
                  variant="secondary"
                  className="inline-flex items-center gap-1 pr-1 text-[11px] font-normal"
                >
                  <span className="max-w-40 truncate">{value}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFilterValue(key, value)}
                    className="cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20"
                    aria-label={`Hapus filter ${value}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {selectedInScopeIds.length > 0 && (
            <div className="flex justify-end border-t pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Hapus {selectedInScopeIds.length} Data
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="cursor-pointer bg-muted/50">
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
                  {sortField === 'nama' && (sortDirection === 'asc'
                    ? <ArrowUp className="h-3 w-3" />
                    : <ArrowDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="hidden min-w-17.5 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70 md:table-cell"
                onClick={() => handleSort('nis')}
              >
                <div className="flex items-center gap-1">
                  NIS
                  {sortField === 'nis' && (sortDirection === 'asc'
                    ? <ArrowUp className="h-3 w-3" />
                    : <ArrowDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="hidden min-w-22.5 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70 md:table-cell"
                onClick={() => handleSort('kelas')}
              >
                <div className="flex items-center gap-1">
                  Kelas
                  {sortField === 'kelas' && (sortDirection === 'asc'
                    ? <ArrowUp className="h-3 w-3" />
                    : <ArrowDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-32.5 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('nama_buku')}
              >
                <div className="flex items-center gap-1">
                  Nama Buku
                  {sortField === 'nama_buku' && (sortDirection === 'asc'
                    ? <ArrowUp className="h-3 w-3" />
                    : <ArrowDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="hidden min-w-20 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70 md:table-cell"
                onClick={() => handleSort('jenis_buku')}
              >
                <div className="flex items-center gap-1">
                  Jenis
                  {sortField === 'jenis_buku' && (sortDirection === 'asc'
                    ? <ArrowUp className="h-3 w-3" />
                    : <ArrowDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead className="hidden min-w-20 py-2 px-3 text-xs font-semibold md:table-cell">Kode</TableHead>
              <TableHead 
                className="min-w-12.5 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('jumlah')}
              >
                <div className="flex items-center gap-1">
                  Jml
                  {sortField === 'jumlah' && (sortDirection === 'asc'
                    ? <ArrowUp className="h-3 w-3" />
                    : <ArrowDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-22.5 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('tanggal_pinjam')}
              >
                <div className="flex items-center gap-1">
                  Tgl Pinjam
                  {sortField === 'tanggal_pinjam' && (sortDirection === 'asc'
                    ? <ArrowUp className="h-3 w-3" />
                    : <ArrowDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-22.5 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('tanggal_kembali')}
              >
                <div className="flex items-center gap-1">
                  Tgl Kembali
                  {sortField === 'tanggal_kembali' && (sortDirection === 'asc'
                    ? <ArrowUp className="h-3 w-3" />
                    : <ArrowDown className="h-3 w-3" />)}
                </div>
              </TableHead>
              <TableHead 
                className="min-w-20 py-2 px-3 text-xs font-semibold cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === 'status' && (sortDirection === 'asc'
                    ? <ArrowUp className="h-3 w-3" />
                    : <ArrowDown className="h-3 w-3" />)}
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
                    <TableCell className="hidden py-2 px-3 text-sm md:table-cell">
                      {onShowBorrowerHistory ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onShowBorrowerHistory?.(borrowing);
                          }}
                          className="cursor-pointer font-medium text-blue-600 hover:underline"
                          title="Lihat riwayat peminjam"
                        >
                          {borrowing.nis === 0 ? '-' : borrowing.nis}
                        </button>
                      ) : (
                        <>{borrowing.nis === 0 ? '-' : borrowing.nis}</>
                      )}
                    </TableCell>
                    <TableCell className="hidden py-2 px-3 text-sm md:table-cell">{borrowing.kelas}</TableCell>
                    <TableCell className="py-2 px-3 text-sm">{borrowing.nama_buku}</TableCell>
                    <TableCell className="hidden py-2 px-3 text-sm md:table-cell">{borrowing.jenis_buku}</TableCell>
                    <TableCell className="hidden py-2 px-3 text-sm md:table-cell">{borrowing.kode_buku}</TableCell>
                    <TableCell className="py-2 px-3 text-sm">{borrowing.jumlah}</TableCell>
                    <TableCell className="py-2 px-3 text-sm">{borrowing.tanggal_pinjam}</TableCell>
                    <TableCell className={`py-2 px-3 text-sm ${overdue ? 'text-red-600 font-semibold' : ''}`}>
                      <div className="flex flex-col gap-1">
                        <span>
                          {borrowing.tanggal_kembali}
                          {overdue && ' ⚠'}
                        </span>
                        {!readOnly && (borrowing.extend_count ?? 0) > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onShowHistory?.(borrowing);
                            }}
                            className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 hover:bg-amber-200"
                            title="Lihat riwayat perpanjangan"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Diperpanjang {borrowing.extend_count}x
                          </button>
                        )}
                      </div>
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
                            onClick={(e: { stopPropagation: () => void; }) => {
                              e.stopPropagation();
                              onReturn?.(borrowing.id!);
                            }}
                            className="h-7 px-2 text-xs bg-orange-500 text-white hover:bg-orange-600"
                          >
                            Kembali
                          </Button>
                        )}
                        {borrowing.status === 'Dipinjam' && (borrowing.extend_count ?? 0) < maxExtendCount && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e: { stopPropagation: () => void; }) => {
                              e.stopPropagation();
                              onExtend?.(borrowing.id!);
                            }}
                            className="h-7 px-2 text-xs bg-blue-500 text-white hover:bg-blue-600"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Perpanjang
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e: { stopPropagation: () => void; }) => {
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
        <div className="flex flex-col gap-3 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
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
