'use client';

import { useState } from 'react';
import { Borrowing } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateReturnDate, getCurrentDate } from '@/lib/date-utils';

type BorrowingFormValue = {
  nama: string;
  nis: string;
  kelas: string;
  nama_buku: string;
  jenis_buku: string;
  kode_buku: string;
  jumlah: string;
  tanggal_pinjam: string;
  tanggal_kembali: string;
  status: string;
};

type BorrowingSubmitData = Omit<Borrowing, 'id' | 'created_at' | 'updated_at'>;

interface BorrowingFormProps {
  onSubmit: (data: BorrowingSubmitData) => void;
  initialData?: Partial<BorrowingSubmitData>;
  onCancel?: () => void;
  isEdit?: boolean;
}

const CLASS_OPTIONS = [
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
  'XII TO 2'
];

export function BorrowingForm({ onSubmit, initialData, onCancel, isEdit = false }: BorrowingFormProps) {
  const [formData, setFormData] = useState<BorrowingFormValue>({
    nama: initialData?.nama || '',
    nis: initialData?.nis !== undefined ? String(initialData.nis) : '',
    kelas: initialData?.kelas || '',
    nama_buku: initialData?.nama_buku || '',
    jenis_buku: initialData?.jenis_buku || '',
    kode_buku: initialData?.kode_buku || '',
    jumlah: initialData?.jumlah !== undefined ? String(initialData.jumlah) : '',
    tanggal_pinjam: initialData?.tanggal_pinjam || getCurrentDate(),
    tanggal_kembali: initialData?.tanggal_kembali || calculateReturnDate(initialData?.tanggal_pinjam || getCurrentDate(), initialData?.jenis_buku || 'Pelajaran'),
    status: initialData?.status || 'Dipinjam'
  });

  const handleChange = <K extends keyof BorrowingFormValue>(field: K, value: BorrowingFormValue[K]) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Auto-calculate return date when not in edit mode
    if (!isEdit && (field === 'jenis_buku' || field === 'tanggal_pinjam')) {
      const newReturnDate = calculateReturnDate(
        newFormData.tanggal_pinjam,
        newFormData.jenis_buku
      );
      setFormData({ ...newFormData, tanggal_kembali: newReturnDate });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isTeacherOrStaff = formData.kelas === 'GURU/PEGAWAI';

    // Validate
    if (!formData.nama || !formData.kelas ||
        !formData.nama_buku || !formData.jenis_buku || !formData.kode_buku ||
        !formData.jumlah || !formData.tanggal_pinjam) {
      alert('Semua field harus diisi!');
      return;
    }

    if (!isTeacherOrStaff && !formData.nis) {
      alert('NIS harus diisi untuk siswa!');
      return;
    }

    if (isNaN(parseInt(formData.jumlah)) || (!isTeacherOrStaff && isNaN(parseInt(formData.nis)))) {
      alert('NIS dan Jumlah harus berupa angka!');
      return;
    }

    if (!isTeacherOrStaff) {
      const nis = parseInt(formData.nis, 10);
      if (nis < 1000 || nis > 4999) {
        alert('NIS tidak valid!');
        return;
      }
    }

    onSubmit({
      nama: formData.nama,
      nis: isTeacherOrStaff ? 0 : Number.parseInt(formData.nis, 10),
      kelas: formData.kelas,
      nama_buku: formData.nama_buku,
      jenis_buku: formData.jenis_buku,
      kode_buku: formData.kode_buku,
      jumlah: Number.parseInt(formData.jumlah, 10),
      tanggal_pinjam: formData.tanggal_pinjam,
      tanggal_kembali: formData.tanggal_kembali,
      status: formData.status,
    });
  };

  const handleReset = () => {
    setFormData({
      nama: '',
      nis: '',
      kelas: '',
      nama_buku: '',
      jenis_buku: '',
      kode_buku: '',
      jumlah: '',
      tanggal_pinjam: getCurrentDate(),
      tanggal_kembali: calculateReturnDate(getCurrentDate(), 'Pelajaran'),
      status: 'Dipinjam'
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Data Peminjaman' : 'Form Peminjaman Buku'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => handleChange('nama', e.target.value)}
                placeholder="Masukkan nama"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nis">NIS{formData.kelas === 'GURU/PEGAWAI' ? ' (opsional)' : ''}</Label>
              <Input
                id="nis"
                type="number"
                value={formData.nis}
                onChange={(e) => handleChange('nis', e.target.value)}
                placeholder={formData.kelas === 'GURU/PEGAWAI' ? 'Tidak wajib diisi' : 'Masukkan NIS'}
                disabled={formData.kelas === 'GURU/PEGAWAI'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kelas">Kelas</Label>
            <Select
              value={formData.kelas}
              onValueChange={(value) => {
                const nextValue = value ?? '';
                if (nextValue === 'GURU/PEGAWAI') {
                  setFormData((current) => ({ ...current, kelas: nextValue, nis: '' }));
                  return;
                }

                handleChange('kelas', nextValue);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih kelas" />
              </SelectTrigger>
              <SelectContent>
                {CLASS_OPTIONS.map((kelas) => (
                  <SelectItem key={kelas} value={kelas}>
                    {kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nama_buku">Nama Buku</Label>
            <Input
              id="nama_buku"
              value={formData.nama_buku}
              onChange={(e) => handleChange('nama_buku', e.target.value)}
              placeholder="Masukkan nama buku"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jenis_buku">Jenis Buku</Label>
              <Select
                value={formData.jenis_buku}
                onValueChange={(value) => handleChange('jenis_buku', value ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis buku" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pelajaran">Pelajaran</SelectItem>
                  <SelectItem value="Bacaan">Bacaan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kode_buku">Kode Buku</Label>
              <Input
                id="kode_buku"
                value={formData.kode_buku}
                onChange={(e) => handleChange('kode_buku', e.target.value)}
                placeholder="Masukkan kode buku"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jumlah">Jumlah</Label>
              <Input
                id="jumlah"
                type="number"
                value={formData.jumlah}
                onChange={(e) => handleChange('jumlah', e.target.value)}
                placeholder="Masukkan jumlah"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggal_pinjam">Tanggal Pinjam</Label>
              <Input
                id="tanggal_pinjam"
                type="date"
                value={formData.tanggal_pinjam.split('/').reverse().join('-')}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    return;
                  }

                  handleChange('tanggal_pinjam', value.split('-').reverse().join('/'));
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tanggal_kembali">
              {isEdit ? 'Tanggal Kembali' : 'Tanggal Kembali (Otomatis)'}
            </Label>
            <Input
              id="tanggal_kembali"
              type={isEdit ? 'date' : 'text'}
              value={isEdit ? formData.tanggal_kembali.split('/').reverse().join('-') : formData.tanggal_kembali}
              disabled={!isEdit}
              className={!isEdit ? 'bg-gray-100' : ''}
              onChange={isEdit ? (e) => {
                const value = e.target.value;
                if (!value) {
                  return;
                }
                handleChange('tanggal_kembali', value.split('-').reverse().join('/'));
              } : undefined}
            />
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dipinjam">Dipinjam</SelectItem>
                  <SelectItem value="Dikembalikan">Dikembalikan</SelectItem>
                  <SelectItem value="Terlambat">Terlambat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {isEdit ? 'Update Data' : 'Simpan Data'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Batal
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
