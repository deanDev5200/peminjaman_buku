export interface Borrowing {
  id?: number;
  nama: string;
  nis: number;
  kelas: string;
  nama_buku: string;
  jenis_buku: string;
  kode_buku: string;
  jumlah: number;
  tanggal_pinjam: string;
  tanggal_kembali: string;
  status: string;
  extend_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BorrowingHistory {
  id?: number;
  borrowing_id: number;
  original_tanggal_kembali: string;
  new_tanggal_kembali: string;
  extended_at?: string;
  reason?: string;
  kind?: string;
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at?: string;
}

export interface Settings {
  borrow_limit_pelajaran: string;
  borrow_limit_bacaan: string;
  borrow_limit_guru: string;
  max_extend_count: string;
  due_soon_days: string;
  root_view_days: string;
  app_title: string;
  app_subtitle: string;
}

export type SecurityEventType = 'login' | 'logout';

export interface SecurityLog {
  id?: number;
  event_type: SecurityEventType;
  ip_address: string;
  user_agent: string;
  device_type: string;
  device_name: string;
  browser: string;
  os: string;
  created_at?: string;
}

export interface SecurityLogInput {
  event_type: SecurityEventType;
  ip_address: string;
  user_agent: string;
  device_type: string;
  device_name: string;
  browser: string;
  os: string;
}