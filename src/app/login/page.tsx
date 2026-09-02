'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import { AppCredit } from '@/components/app-credit';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = (await response.json().catch(() => ({ error: 'Login gagal' }))) as { error?: string };

      if (!response.ok) {
        setError(data.error || 'Password salah');
        return;
      }

      const redirectTarget = searchParams.get('redirect') || '/admin/peminjaman';
      router.push(redirectTarget);
      router.refresh();
    } catch (submitError) {
      console.error('Login failed:', submitError);
      setError('Gagal login. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center gap-3">
            <Image src="/library_logo.png" alt="Library Logo" width={48} height={48} className="h-12 w-12 object-contain" />
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Jnana Grha Mandara</p>
            <h1 className="text-2xl font-semibold">Login Akses</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <ShieldCheck className="h-4 w-4" />
            {loading ? 'Memeriksa...' : 'Masuk'}
          </button>
        </form>
      </div>
      <AppCredit className="mt-6" />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-100 p-4"><div className="text-sm text-slate-600">Memuat halaman login...</div></main>}>
      <LoginForm />
    </Suspense>
  );
}
