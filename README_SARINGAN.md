# Saringan PPWB - Sistem Penilaian Pondok Pesantren Wali Barokah

Aplikasi komprehensif untuk mengelola tes saringan (screening test) santri di Pondok Pesantren Wali Barokah dengan sistem role-based access untuk guru dan administrator.

## Fitur Utama

### Untuk Guru
- **Nilai Penyampaian**: Input penilaian makna, keterangan, penjelasan, dan pemahaman
- **Nilai Bacaan**: Input penilaian bacaan dengan kategori kekurangan (tajwid, khusus, keserasian, kelancaran)
- **Daftar Peserta**: Lihat semua peserta dengan filter gender
- **Detail Peserta**: Lihat profil lengkap dan riwayat penilaian peserta

### Untuk Admin
- **Kelola Periode**: CRUD periode pengetesan (format: Ym, contoh: 202501)
- **Kelola Peserta**: CRUD peserta dengan fitur sinkronisasi dari API eksternal
- **Kelola Nilai Bacaan**: Lihat semua nilai bacaan dengan filter
- **Kelola Nilai Penyampaian**: Lihat semua nilai penyampaian dengan filter
- **Kelola User**: CRUD user (guru dan admin)

## Setup Awal

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Pastikan file `.env` sudah berisi:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Database schema sudah otomatis dibuat melalui migration. Tabel yang dibuat:
- `saringan_user` - Data user (guru dan admin)
- `saringan_periode` - Periode pengetesan
- `saringan_peserta` - Data peserta
- `saringan_nilai_bacaan` - Nilai bacaan
- `saringan_nilai_penyampaian` - Nilai penyampaian

### 4. Membuat User Pertama (Admin)

Karena aplikasi menggunakan Supabase Auth, Anda perlu membuat user admin pertama:

**Opsi A: Melalui Supabase Dashboard**
1. Buka Supabase Dashboard > Authentication > Users
2. Klik "Add User"
3. Email: `admin@saringan.ppwb.my.id`
4. Password: (pilih password Anda)
5. Confirm Email: Ya
6. Setelah user dibuat, catat `id` dari user tersebut
7. Buka SQL Editor dan jalankan:
```sql
INSERT INTO saringan_user (nama, role, aktif, username, auth_id)
VALUES ('Admin', 'admin', true, 'admin', 'USER_ID_DARI_AUTH_USERS');
```

**Opsi B: Melalui SQL Script**
1. Buka SQL Editor di Supabase Dashboard
2. Jalankan script berikut (ganti password sesuai keinginan):
```sql
-- Create auth user
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users (this requires admin privileges)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    raw_user_meta_data
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@saringan.ppwb.my.id',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '{"username": "admin"}'::jsonb
  )
  RETURNING id INTO new_user_id;

  -- Insert into saringan_user
  INSERT INTO saringan_user (nama, role, aktif, username, auth_id)
  VALUES ('Admin', 'admin', true, 'admin', new_user_id);
END $$;
```

### 5. Membuat Periode Aktif
Setelah login sebagai admin:
1. Pergi ke Admin Panel > Periode
2. Klik "Tambah Periode"
3. Isi ID Periode (format: Ym, contoh: 202501)
4. Centang "Aktif"
5. Klik "Simpan"

### 6. Sinkronisasi Data Peserta
Setelah membuat periode:
1. Pergi ke Admin Panel > Peserta
2. Klik "Sinkronisasi Peserta"
3. Pilih periode yang diinginkan
4. Klik "Sinkronisasi"
5. Aplikasi akan mengambil data dari API: `https://tes.ppwb.my.id/api/siswa-ppwb/peserta-saringan`

## Penggunaan

### Login
- URL: `/`
- Gunakan username (bukan email) untuk login
- Format: `admin` atau `guru1` (tanpa @domain)
- Password: sesuai yang diset saat pembuatan user

### Flow Penilaian

#### Nilai Penyampaian
1. Guru masuk ke menu "Nilai Penyampaian"
2. Pilih peserta dari daftar
3. Isi form penilaian:
   - Nilai Makna (60, 70, 80, 90)
   - Nilai Keterangan (60, 70, 80, 90)
   - Nilai Penjelasan (60, 70, 80, 90)
   - Nilai Pemahaman (60, 70, 80, 90)
   - Materi (opsional)
   - Catatan (opsional)
4. Klik "Simpan"
5. Sistem akan otomatis menghitung:
   - Rata-rata per guru
   - Hasil penyampaian peserta (lulus/tidak lulus)
   - Hasil tes final peserta

#### Nilai Bacaan
1. Guru masuk ke menu "Nilai Bacaan"
2. Pilih peserta dari daftar
3. Isi form penilaian:
   - Nilai (Lulus/Tidak Lulus)
   - Kekurangan Tajwid (multiple choice)
   - Kekurangan Khusus (multiple choice)
   - Kekurangan Keserasian (multiple choice)
   - Kekurangan Kelancaran (multiple choice)
   - Materi (opsional)
   - Catatan (opsional)
4. Klik "Simpan"
5. Sistem akan otomatis menghitung:
   - Hasil bacaan per peserta (voting mayoritas dari guru)
   - Hasil tes final peserta

### Logika Hasil Tes
Sistem menghitung hasil tes peserta berdasarkan kombinasi:
- **Hasil Penyampaian**: Rata-rata nilai >= 70 = Lulus
- **Hasil Bacaan**: Mayoritas voting dari guru
- **Hasil Tes Final**: Kombinasi kedua hasil di atas

## Teknologi

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: shadcn/ui + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Routing**: React Router DOM v6
- **State Management**: React Hooks

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Lint
npm run lint
```

## Struktur Folder

```
src/
├── components/         # Reusable components
│   ├── ui/            # shadcn/ui components
│   └── ProtectedRoute.tsx
├── contexts/          # React contexts
│   └── AuthContext.tsx
├── layouts/           # Layout components
│   ├── GuruLayout.tsx
│   └── AdminLayout.tsx
├── lib/              # Utility functions
│   ├── supabase.ts
│   ├── helpers.ts
│   └── utils.ts
├── pages/            # Page components
│   ├── guru/         # Guru pages
│   ├── admin/        # Admin pages
│   └── LoginPage.tsx
├── types/            # TypeScript types
│   └── database.types.ts
├── App.tsx
└── main.tsx
```

## Security

- Row Level Security (RLS) enabled di semua tabel
- Policy berdasarkan role (guru/admin)
- Authentication menggunakan Supabase Auth
- Password di-hash otomatis oleh Supabase

## API External

Aplikasi terintegrasi dengan API PPWB:
- Endpoint: `https://tes.ppwb.my.id/api/siswa-ppwb/peserta-saringan`
- Digunakan untuk sinkronisasi data peserta
- Mapping otomatis dari API response ke database

## Troubleshooting

### User tidak bisa login
- Pastikan user sudah dibuat di `auth.users` dan `saringan_user`
- Pastikan `auth_id` di `saringan_user` sesuai dengan `id` di `auth.users`
- Pastikan user memiliki `aktif = true`

### Data peserta tidak muncul
- Pastikan periode sudah dibuat dan diset aktif
- Jalankan sinkronisasi peserta dari menu Admin > Peserta

### Nilai tidak tersimpan
- Cek console browser untuk error
- Pastikan guru memiliki `aktif = true`
- Pastikan peserta masih dalam status `aktif`

## Support

Untuk bantuan lebih lanjut, hubungi tim IT PPWB.
