'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateReturnDate, getCurrentDate } from '@/lib/date-utils';

interface BorrowingFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  onCancel?: () => void;
  isEdit?: boolean;
}

export function BorrowingForm({ onSubmit, initialData, onCancel, isEdit = false }: BorrowingFormProps) {
  const [formData, setFormData] = useState({
    nama: initialData?.nama || '',
    nis: initialData?.nis || '',
    kelas: initialData?.kelas || '',
    nama_buku: initialData?.nama_buku || '',
    jenis_buku: initialData?.jenis_buku || '',
    kode_buku: initialData?.kode_buku || '',
    jumlah: initialData?.jumlah || '',
    tanggal_pinjam: initialData?.tanggal_pinjam || getCurrentDate()
  });

  const [returnDate, setReturnDate] = useState(
    initialData?.tanggal_kembali || calculateReturnDate(formData.tanggal_pinjam, formData.jenis_buku)
  );

  const handleChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Recalculate return date when relevant fields change
    if (field === 'jenis_buku' || field === 'tanggal_pinjam') {
      const newReturnDate = calculateReturnDate(
        newFormData.tanggal_pinjam,
        newFormData.jenis_buku
      );
      setReturnDate(newReturnDate);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.nama || !formData.nis || !formData.kelas || 
        !formData.nama_buku || !formData.jenis_buku || !formData.kode_buku ||
        !formData.jumlah || !formData.tanggal_pinjam) {
      alert('Semua field harus diisi!');
      return;
    }

    if (isNaN(parseInt(formData.nis)) || isNaN(parseInt(formData.jumlah))) {
      alert('NIS dan Jumlah harus berupa angka!');
      return;
    }

    onSubmit({
      ...formData,
      nis: parseInt(formData.nis),
      jumlah: parseInt(formData.jumlah),
      tanggal_kembali: returnDate
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
      tanggal_pinjam: getCurrentDate()
    });
    setReturnDate(calculateReturnDate(getCurrentDate(), 'Pelajaran'));
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
              <Label htmlFor="nis">NIS</Label>
              <Input
                id="nis"
                type="number"
                value={formData.nis}
                onChange={(e) => handleChange('nis', e.target.value)}
                placeholder="Masukkan NIS"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kelas">Kelas</Label>
            <Input
              id="kelas"
              value={formData.kelas}
              onChange={(e) => handleChange('kelas', e.target.value)}
              placeholder="Masukkan kelas"
            />
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
                onValueChange={(value) => handleChange('jenis_buku', value)}
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
                onChange={(e) => handleChange('tanggal_pinjam', e.target.value.split('-').reverse().join('/'))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tanggal_kembali">Tanggal Kembali (Otomatis)</Label>
            <Input
              id="tanggal_kembali"
              value={returnDate}
              disabled
              className="bg-gray-100"
            />
          </div>

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
