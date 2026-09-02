'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LockKeyhole, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AppCredit } from '@/components/app-credit';

type SecurityLog = {
  id?: number;
  event_type: 'login' | 'logout';
  ip_address: string;
  user_agent: string;
  device_type: string;
  device_name: string;
  browser: string;
  os: string;
  created_at?: string;
};

export default function SecurityAdminPage() {
  const [configured, setConfigured] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState<SecurityLog[]>([]);

  const checkAccess = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/security/unlock');
      const data = (await response.json()) as {
        configured?: boolean;
        unlocked?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error || 'Gagal memeriksa akses developer.');
        return;
      }

      setConfigured(Boolean(data.configured));
      setUnlocked(Boolean(data.unlocked));
    } catch (fetchError) {
      console.error('Failed to check developer access:', fetchError);
      setError('Gagal memeriksa akses developer.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/security/logs');
      const data = (await response.json()) as { logs?: SecurityLog[]; error?: string };

      if (!response.ok) {
        setError(data.error || 'Gagal memuat log keamanan.');
        return;
      }

      setLogs(data.logs ?? []);
    } catch (fetchError) {
      console.error('Failed to fetch security logs:', fetchError);
      setError('Gagal memuat log keamanan.');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkAccess();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [checkAccess]);

  useEffect(() => {
    if (unlocked) {
      const timeoutId = window.setTimeout(() => {
        void fetchLogs();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [unlocked, fetchLogs]);

  const handleUnlock = async (event: FormEvent) => {
    event.preventDefault();
    setUnlockLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/security/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || 'Developer access key salah.');
        return;
      }

      setUnlocked(true);
      setAccessKey('');
      await fetchLogs();
    } catch (unlockError) {
      console.error('Failed to unlock developer access:', unlockError);
      setError('Gagal membuka akses developer.');
    } finally {
      setUnlockLoading(false);
    }
  };

  const formatTimestamp = (value?: string) => {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-muted/40 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Security Logs</h1>
            <p className="text-sm text-muted-foreground">
              Riwayat sesi login/logout untuk administrator/developer.
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </Link>
        </div>

        {loading ? (
          <Card className="shadow-sm">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Memuat akses developer...
            </CardContent>
          </Card>
        ) : !configured ? (
          <Card className="shadow-sm">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Developer access belum dikonfigurasi. Tambahkan `DEVELOPER_ACCESS_KEY` di environment server.
            </CardContent>
          </Card>
        ) : !unlocked ? (
          <Card className="shadow-sm max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Developer Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUnlock} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Halaman ini hanya dapat diakses dengan developer access key.
                </p>
                <div className="space-y-2">
                  <label htmlFor="accessKey" className="text-sm font-medium text-muted-foreground">
                    Developer Access Key
                  </label>
                  <Input
                    id="accessKey"
                    type="password"
                    value={accessKey}
                    onChange={(event) => setAccessKey(event.target.value)}
                    placeholder="Masukkan developer access key"
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" className="w-full gap-2" disabled={unlockLoading}>
                  <LockKeyhole className="h-4 w-4" />
                  {unlockLoading ? 'Memverifikasi...' : 'Buka Akses'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Session Activity</CardTitle>
              <Button variant="outline" size="sm" onClick={() => void fetchLogs()} disabled={logsLoading}>
                <RefreshCw className={`h-4 w-4 ${logsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Waktu</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>User Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-sm text-muted-foreground">
                          Belum ada log sesi.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatTimestamp(log.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                log.event_type === 'login'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-slate-500 text-white'
                              }
                            >
                              {log.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-mono">{log.ip_address}</TableCell>
                          <TableCell className="text-sm">
                            <div>{log.device_name}</div>
                            <div className="text-xs text-muted-foreground capitalize">{log.device_type}</div>
                          </TableCell>
                          <TableCell className="text-sm">{log.browser}</TableCell>
                          <TableCell className="text-sm">{log.os}</TableCell>
                          <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={log.user_agent}>
                            {log.user_agent}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <AppCredit />
      </div>
    </div>
  );
}
