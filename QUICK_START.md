# Quick Start Guide - Saringan PPWB

## Langkah 1: Setup Database

1. Buka Supabase SQL Editor
2. Jalankan script `CREATE_ADMIN_USER.sql` untuk membuat user admin dan guru testing
3. **PENTING**: Edit password di script sebelum dijalankan!

## Langkah 2: Verifikasi User

Jalankan query berikut untuk memastikan user berhasil dibuat:

```sql
SELECT
  u.id,
  u.nama,
  u.username,
  u.role,
  u.aktif,
  a.email
FROM saringan_user u
LEFT JOIN auth.users a ON u.auth_id = a.id;
```

## Langkah 3: Login sebagai Admin

1. Buka aplikasi di browser
2. Login dengan:
   - Username: `admin`
   - Password: (sesuai yang diset di script)

## Langkah 4: Buat Periode

1. Setelah login, klik menu "Periode"
2. Klik "Tambah Periode"
3. Isi ID Periode dengan format `Ym` (contoh: `202501` untuk Januari 2025)
4. Centang "Aktif" ✓
5. Klik "Simpan"

## Langkah 5: Sinkronisasi Peserta

1. Klik menu "Peserta"
2. Klik tombol "Sinkronisasi Peserta"
3. Pilih periode yang baru dibuat
4. Klik "Sinkronisasi"
5. Tunggu proses selesai

## Langkah 6: Testing sebagai Guru

1. Logout dari admin
2. Login sebagai guru:
   - Username: `guru1`
   - Password: (sesuai yang diset di script)
3. Klik menu "Nilai Penyampaian" atau "Nilai Bacaan"
4. Pilih peserta
5. Isi form penilaian
6. Klik "Simpan"

## Langkah 7: Verifikasi Hasil

1. Login kembali sebagai admin
2. Lihat hasil di menu:
   - "Nilai Penyampaian" untuk melihat semua nilai penyampaian
   - "Nilai Bacaan" untuk melihat semua nilai bacaan
3. Atau login sebagai guru dan klik "Daftar Peserta" untuk melihat detail per peserta

## Kredensial Default

Setelah menjalankan script `CREATE_ADMIN_USER.sql`:

**Admin**
- Username: `admin`
- Password: `admin123` (atau sesuai yang Anda set)
- Email: `admin@saringan.ppwb.my.id`

**Guru (Testing)**
- Username: `guru1`
- Password: `guru123` (atau sesuai yang Anda set)
- Email: `guru1@saringan.ppwb.my.id`

## Membuat User Guru Baru

1. Login sebagai admin
2. Klik menu "User"
3. Klik "Tambah User"
4. Isi form:
   - Nama: Nama lengkap guru
   - Username: username untuk login (huruf kecil, tanpa spasi)
   - Password: password untuk login
   - Role: Pilih "Guru"
   - Aktif: Centang ✓
5. Klik "Simpan"

## Tips

- **Username untuk Login**: Gunakan username saja (contoh: `admin`), bukan email lengkap
- **Format Periode**: Gunakan format `Ym` (Year+Month), contoh:
  - `202501` = Januari 2025
  - `202512` = Desember 2025
- **Hanya 1 Periode Aktif**: Sistem hanya mengizinkan 1 periode aktif pada satu waktu
- **Sinkronisasi**: Data peserta akan diupdate jika NISPN sudah ada, atau dibuat baru jika belum ada

## Troubleshooting

### Tidak bisa login
- Pastikan menggunakan username (bukan email)
- Pastikan password benar
- Pastikan user memiliki status "Aktif"

### Data peserta kosong
- Pastikan periode sudah dibuat dan aktif
- Jalankan sinkronisasi peserta
- Cek koneksi internet (untuk API eksternal)

### Nilai tidak bisa disimpan
- Pastikan peserta masih dalam status "Aktif"
- Cek console browser untuk error
- Pastikan semua field yang wajib sudah diisi

## Support

Jika mengalami masalah:
1. Cek console browser (F12)
2. Cek Supabase logs
3. Hubungi tim IT PPWB
