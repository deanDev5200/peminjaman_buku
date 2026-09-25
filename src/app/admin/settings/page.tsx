'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AppCredit } from '@/components/app-credit';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    borrow_limit_pelajaran: 3,
    borrow_limit_bacaan: 7,
    borrow_limit_guru: 30,
    max_extend_count: 1,
    due_soon_days: 7,
    root_view_days: 30,
    app_title: 'Jnana Grha Mandara',
    app_subtitle: 'Sistem Peminjaman Buku',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (response.ok) {
        const parsedMaxExtend = parseInt(data.max_extend_count, 10);
        setSettings({
          borrow_limit_pelajaran: parseInt(data.borrow_limit_pelajaran, 10) || 3,
          borrow_limit_bacaan: parseInt(data.borrow_limit_bacaan, 10) || 7,
          borrow_limit_guru: parseInt(data.borrow_limit_guru, 10) || 30,
          max_extend_count: Number.isNaN(parsedMaxExtend) ? 1 : parsedMaxExtend,
          due_soon_days: parseInt(data.due_soon_days, 10) || 7,
          root_view_days: parseInt(data.root_view_days, 10) || 30,
          app_title: data.app_title ?? 'Jnana Grha Mandara',
          app_subtitle: data.app_subtitle ?? 'Sistem Peminjaman Buku',
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Gagal memuat pengaturan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchSettings();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Pengaturan berhasil disimpan!');
      } else {
        const data = await response.json();
        setError(data.error || 'Gagal menyimpan pengaturan.');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <Card className="shadow-sm">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Memuat pengaturan...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-10 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">Pengaturan Sistem</h1>
                  <p className="text-sm text-muted-foreground">
                    Atur batas peminjaman dan tampilan data.
                  </p>
                </div>
              </div>
            </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Konfigurasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="app_title">Judul Aplikasi</Label>
              <Input
                id="app_title"
                type="text"
                value={settings.app_title}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    app_title: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Nama aplikasi yang ditampilkan di bilah sisi dan halaman utama.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="app_subtitle">Subjudul Aplikasi</Label>
              <Input
                id="app_subtitle"
                type="text"
                value={settings.app_subtitle}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    app_subtitle: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Deskripsi singkat yang ditampilkan di bawah judul aplikasi.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="borrow_limit_pelajaran">Batas Pinjam Buku Pelajaran (hari)</Label>
              <Input
                id="borrow_limit_pelajaran"
                type="number"
                min="1"
                value={settings.borrow_limit_pelajaran}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    borrow_limit_pelajaran: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Jumlah hari default untuk peminjaman buku Pelajaran.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="borrow_limit_bacaan">Batas Pinjam Buku Bacaan (hari)</Label>
              <Input
                id="borrow_limit_bacaan"
                type="number"
                min="1"
                value={settings.borrow_limit_bacaan}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    borrow_limit_bacaan: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Jumlah hari default untuk peminjaman buku Bacaan.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="borrow_limit_guru">Batas Pinjam Guru/Pegawai (hari)</Label>
              <Input
                id="borrow_limit_guru"
                type="number"
                min="1"
                value={settings.borrow_limit_guru}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    borrow_limit_guru: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Jumlah hari pinjam untuk GURU/PEGAWAI.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_extend_count">Batas Perpanjangan per Peminjaman (kali)</Label>
              <Input
                id="max_extend_count"
                type="number"
                min="0"
                value={settings.max_extend_count}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_extend_count: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Jumlah maksimal perpanjangan untuk satu peminjaman. Isi 0 untuk menonaktifkan perpanjangan.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_soon_days">Batas Jatuh Tempo Segera (hari)</Label>
              <Input
                id="due_soon_days"
                type="number"
                min="1"
                value={settings.due_soon_days}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    due_soon_days: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Peminjaman yang jatuh tempo dalam rentang ini ditandai sebagai segera jatuh tempo di dasbor.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="root_view_days">Jangkauan Tampilan Halaman Utama (hari)</Label>
              <Input
                id="root_view_days"
                type="number"
                min="1"
                value={settings.root_view_days}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    root_view_days: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Jumlah hari terakhir yang ditampilkan di halaman utama.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <AppCredit />
    </div>
  );
}