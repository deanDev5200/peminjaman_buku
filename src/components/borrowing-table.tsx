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

interface BorrowingTableProps {
  borrowings: Borrowing[];
  onEdit: (borrowing: Borrowing) => void;
  onDelete: (id: number) => void;
  onReturn: (id: number) => void;
  onSelect: (borrowing: Borrowing) => void;
}

export function BorrowingTable({ borrowings, onEdit, onDelete, onReturn, onSelect }: BorrowingTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>NIS</TableHead>
            <TableHead>Kelas</TableHead>
            <TableHead>Nama Buku</TableHead>
            <TableHead>Jenis Buku</TableHead>
            <TableHead>Kode Buku</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Tanggal Pinjam</TableHead>
            <TableHead>Tanggal Kembali</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {borrowings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-8">
                Tidak ada data peminjaman
              </TableCell>
            </TableRow>
          ) : (
            borrowings.map((borrowing) => {
              const overdue = isOverdue(borrowing.tanggal_kembali, borrowing.status);
              
              return (
                <TableRow
                  key={borrowing.id}
                  className={overdue ? 'bg-red-50' : ''}
                  onClick={() => onSelect(borrowing)}
                >
                  <TableCell className="font-medium">{borrowing.nama}</TableCell>
                  <TableCell>{borrowing.nis}</TableCell>
                  <TableCell>{borrowing.kelas}</TableCell>
                  <TableCell>{borrowing.nama_buku}</TableCell>
                  <TableCell>{borrowing.jenis_buku}</TableCell>
                  <TableCell>{borrowing.kode_buku}</TableCell>
                  <TableCell>{borrowing.jumlah}</TableCell>
                  <TableCell>{borrowing.tanggal_pinjam}</TableCell>
                  <TableCell className={overdue ? 'text-red-600 font-semibold' : ''}>
                    {borrowing.tanggal_kembali}
                    {overdue && ' (Terlambat)'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={borrowing.status === 'Dipinjam' ? 'default' : 'secondary'}
                      className={borrowing.status === 'Dipinjam' ? 'bg-blue-500' : 'bg-green-500'}
                    >
                      {borrowing.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {borrowing.status === 'Dipinjam' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReturn(borrowing.id!);
                          }}
                          className="bg-orange-500 text-white hover:bg-orange-600"
                        >
                          Kembalikan
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(borrowing);
                        }}
                        className="bg-green-500 text-white hover:bg-green-600"
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
                        className="bg-red-500 text-white hover:bg-red-600"
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
  );
}
