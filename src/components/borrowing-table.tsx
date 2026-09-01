'use client';

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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BorrowingTableProps {
  borrowings: Borrowing[];
  onEdit: (borrowing: Borrowing) => void;
  onDelete: (id: number) => void;
  onReturn: (id: number) => void;
  onSelect: (borrowing: Borrowing) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (items: number) => void;
  totalItems?: number;
}

export function BorrowingTable({ 
  borrowings, 
  onEdit, 
  onDelete, 
  onReturn, 
  onSelect,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  totalItems = 0
}: BorrowingTableProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="min-w-[100px] py-2 px-3 text-xs font-semibold">Nama</TableHead>
              <TableHead className="min-w-[70px] py-2 px-3 text-xs font-semibold">NIS</TableHead>
              <TableHead className="min-w-[90px] py-2 px-3 text-xs font-semibold">Kelas</TableHead>
              <TableHead className="min-w-[130px] py-2 px-3 text-xs font-semibold">Nama Buku</TableHead>
              <TableHead className="min-w-[80px] py-2 px-3 text-xs font-semibold">Jenis</TableHead>
              <TableHead className="min-w-[80px] py-2 px-3 text-xs font-semibold">Kode</TableHead>
              <TableHead className="min-w-[50px] py-2 px-3 text-xs font-semibold">Jml</TableHead>
              <TableHead className="min-w-[90px] py-2 px-3 text-xs font-semibold">Tgl Pinjam</TableHead>
              <TableHead className="min-w-[90px] py-2 px-3 text-xs font-semibold">Tgl Kembali</TableHead>
              <TableHead className="min-w-[80px] py-2 px-3 text-xs font-semibold">Status</TableHead>
              <TableHead className="min-w-[180px] py-2 px-3 text-xs font-semibold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {borrowings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-6 text-sm">
                  Tidak ada data peminjaman
                </TableCell>
              </TableRow>
            ) : (
              borrowings.map((borrowing) => {
                const overdue = isOverdue(borrowing.tanggal_kembali, borrowing.status);
                
                return (
                  <TableRow
                    key={borrowing.id}
                    className={`hover:bg-muted/50 ${overdue ? 'bg-red-50/50' : ''}`}
                    onClick={() => onSelect(borrowing)}
                  >
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
                        variant={borrowing.status === 'Dipinjam' ? 'default' : 'secondary'}
                        className={`text-xs ${borrowing.status === 'Dipinjam' ? 'bg-blue-500' : 'bg-green-500'}`}
                      >
                        {borrowing.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {borrowing.status === 'Dipinjam' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReturn(borrowing.id!);
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
                            onEdit(borrowing);
                          }}
                          className="h-7 px-2 text-xs bg-green-500 text-white hover:bg-green-600"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(borrowing.id!);
                          }}
                          className="h-7 px-2 text-xs bg-red-500 text-white hover:bg-red-600"
                        >
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
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
