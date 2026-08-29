import { dbOperations } from '@/lib/db';

const PASSWORD_KEY = 'app_password';

export function getStoredPassword(): string {
  const storedPassword = dbOperations.getSetting(PASSWORD_KEY);
  if (storedPassword) {
    return storedPassword;
  }

  const fallbackPassword = process.env.APP_PASSWORD?.trim();
  if (fallbackPassword) {
    return fallbackPassword;
  }

  throw new Error('APP_PASSWORD is not configured. Set it in .env.local or .env.production.');
}

export function setStoredPassword(newPassword: string): void {
  if (!newPassword.trim()) {
    throw new Error('Password baru tidak boleh kosong');
  }

  dbOperations.setSetting(PASSWORD_KEY, newPassword.trim());
}
