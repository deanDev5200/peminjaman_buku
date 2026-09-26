'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppCredit } from '@/components/app-credit';
import type { BorrowingHistoryEntry } from '@/lib/types';

export default function AuditPage() {
  const [entries, setEntries] = useState<BorrowingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [kindFilter, setKindFilter] = useState('all');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/borrowings/history?limit=200');
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Gagal memuat riwayat.');
        return;
      }
      setEntries(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      console.error('Failed to fetch borrowing history:', fetchError);
      setError('Gagal memuat riwayat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchHistory();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchHistory]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return entries.filter((entry) => {
      if (kindFilter === 'extend' && entry.kind !== 'extend') return false;
      if (kindFilter === 'edit' && entry.kind === 'extend') return false;
      if (!term) return true;
      return (
        (entry.nama ?? '').toLowerCase().includes(term) ||
        String(entry.nis ?? '').includes(term) ||
        (entry.nama_buku ?? '').toLowerCase().includes(term)
      );
    });
  }, [entries, searchTerm, kindFilter]);

  const formatTimestamp = (value?: string) => {
    if (!value) return '-';
    // Stored as UTC "YYYY-MM-DD HH:MM:SS" without a timezone marker.
    const date = new Date(value.endsWith('Z') ? value : `${value.replace(' ', 'T')}Z`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-10 px-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Riwayat Perubahan</h1>
        <p className="text-sm text-muted-foreground">
          Audit log perpanjangan dan edit tanggal kembali di semua peminjaman (200 terbaru).
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Aktivitas</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void fetchHistory()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIS, atau buku..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9"
              />
            </div>
            <Select value={kindFilter} onValueChange={(value) => setKindFilter(value ?? 'all')}>
              <SelectTrigger className="h-9 w-44 text-xs">
                <SelectValue placeholder="Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="extend">Perpanjangan</SelectItem>
                <SelectItem value="edit">Edit Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full min-w-180 caption-bottom text-sm">
              <thead>
                <TableRow className="bg-muted/50">
                  <TableHead>Waktu</TableHead>
                  <TableHead>Peminjam</TableHead>
                  <TableHead>Buku</TableHead>
                  <TableHead>Perubahan</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Alasan</TableHead>
                </TableRow>
              </thead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                      Memuat riwayat...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                      Belum ada riwayat perubahan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatTimestamp(entry.extended_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium">{entry.nama ?? '-'}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.nis ? `NIS ${entry.nis}` : ''}{entry.nis && entry.kelas ? ' • ' : ''}{entry.kelas ?? ''}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{entry.nama_buku ?? '-'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {entry.original_tanggal_kembali} → {entry.new_tanggal_kembali}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            entry.kind === 'edit'
                              ? 'bg-slate-500 text-white'
                              : 'bg-amber-500 text-white'
                          }
                        >
                          {entry.kind === 'edit' ? 'Edit manual' : 'Perpanjangan'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground">
                        {entry.reason || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AppCredit />
    </div>
  );
}
