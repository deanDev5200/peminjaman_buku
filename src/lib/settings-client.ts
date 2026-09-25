import { Settings } from '@/lib/types';

export const DEFAULT_SETTINGS: Settings = {
  borrow_limit_pelajaran: '3',
  borrow_limit_bacaan: '7',
  borrow_limit_guru: '30',
  max_extend_count: '1',
  due_soon_days: '7',
  root_view_days: '30',
  app_title: 'Jnana Grha Mandara',
  app_subtitle: 'Sistem Peminjaman Buku',
};

export async function fetchAppSettings(): Promise<Settings> {
  try {
    const response = await fetch('/api/settings', { cache: 'no-store' });
    if (!response.ok) {
      return { ...DEFAULT_SETTINGS };
    }
    const data = await response.json();
    return {
      borrow_limit_pelajaran: data.borrow_limit_pelajaran ?? DEFAULT_SETTINGS.borrow_limit_pelajaran,
      borrow_limit_bacaan: data.borrow_limit_bacaan ?? DEFAULT_SETTINGS.borrow_limit_bacaan,
      borrow_limit_guru: data.borrow_limit_guru ?? DEFAULT_SETTINGS.borrow_limit_guru,
      max_extend_count: data.max_extend_count ?? DEFAULT_SETTINGS.max_extend_count,
      due_soon_days: data.due_soon_days ?? DEFAULT_SETTINGS.due_soon_days,
      root_view_days: data.root_view_days ?? DEFAULT_SETTINGS.root_view_days,
      app_title: data.app_title ?? DEFAULT_SETTINGS.app_title,
      app_subtitle: data.app_subtitle ?? DEFAULT_SETTINGS.app_subtitle,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
