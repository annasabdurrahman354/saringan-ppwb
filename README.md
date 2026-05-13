# Saringan PPWB - Sistem Penilaian Screening Test

Aplikasi yang dirancang khusus untuk mengelola, memvalidasi, dan mengalkulasi hasil *screening test* (saringan) santri di lingkungan **Pondok Pesantren Wali Barokah (PPWB)**. Sistem ini memisahkan alur kerja antarmuka secara aman antara tenaga pendidik (*Guru*) dan pengurus sistem (*Administrator*) melalui implementasi *Role-Based Access Control* (RBAC) yang ketat.

---

## 🚀 Fitur Utama

### 👥 Modul Pendidik / Guru (`/guru/*`)

#### 📋 Daftar & Penelusuran Peserta

- Direktori peserta santri
- Filter dinamis berdasarkan:
  - Laki-laki
  - Perempuan
  - Semua peserta

#### 👤 Profil & Riwayat Santri

- Tampilan berbasis *tabs*
- Riwayat penilaian historis
- Tracking penilaian antar penguji

#### 🧠 Form Penilaian Penyampaian

Parameter penilaian berbobot:

- Makna
- Keterangan
- Penjelasan
- Pemahaman

Dengan nilai standar:

- 60
- 70
- 80
- 90

#### 📖 Form Penilaian Bacaan

- Penentuan status:
  - Lulus
  - Tidak Lulus
- Matriks kekurangan:
  - Tajwid
  - Khusus
  - Keserasian
  - Kelancaran

#### 🕒 History Tracking

- Log aktivitas penguji
- Timestamp otomatis
- Riwayat sesi penilaian

---

### 👑 Modul Administrator (`/admin/*`)

#### 📅 Manajemen Periode Aktif

- CRUD periode tes
- Format periode:

```txt
YYYYMM
```

Contoh:

```txt
202501
```

Fitur keamanan:

- Hanya satu periode aktif dalam satu waktu

---

#### 🔄 Sinkronisasi Peserta Terpusat

Integrasi otomatis dengan API eksternal PPWB:

```txt
https://tes.ppwb.my.id/api/siswa-ppwb/peserta-saringan
```

Fungsi:

- Sinkronisasi peserta
- Update data berkala
- Insert/update berbasis NISPN

---

#### 📊 Konsol Pemantauan Nilai

- Rekap nilai bacaan
- Rekap nilai penyampaian
- Filter tingkat lanjut
- Monitoring seluruh penguji

---

#### 👥 Manajemen Pengguna & Akses

- Pembuatan akun guru/admin
- Integrasi Supabase Auth
- Role management

---

#### 🖨️ Cetak Lembar Hasil

- Output HTML murni
- Rekap individu
- Rekap seluruh peserta
- Layout siap cetak

---

# 🔄 Logika Bisnis & Matriks Kelulusan

Sistem menerapkan kalkulasi otomatis secara *real-time* untuk menentukan status kelulusan peserta.

---

## 1️⃣ Hasil Tes Penyampaian

Sistem mengambil nilai terakhir dari masing-masing guru penguji kemudian menghitung rata-rata individu.

Rumus perhitungan:

:contentReference[oaicite:0]{index=0}

### Ketentuan Kelulusan

- **Lulus** → skor rata-rata ≥ 70
- **Tidak Lulus** → skor rata-rata < 70

---

## 2️⃣ Hasil Tes Bacaan

Menggunakan sistem *smart majority voting*:

- Suara terbanyak menentukan hasil akhir
- Jika suara seimbang:
  - Status otomatis menjadi **Perlu Musyawarah**

---

## 3️⃣ Matriks Kelulusan Final

| Hasil Penyampaian | Hasil Bacaan | Status Final |
|---|---|---|
| Lulus | Lulus | Lulus |
| Lulus | Tidak Lulus | Tidak Lulus |
| Tidak Lulus | Lulus | Lulus |
| Tidak Lulus | Tidak Lulus | Tidak Lulus |
| Lulus | Perlu Musyawarah | Perlu Musyawarah |
| Tidak Lulus | Perlu Musyawarah | Tidak Lulus |

---

# 🛠️ Arsitektur & Teknologi (*Tech Stack*)

Sistem dibangun menggunakan ekosistem modern dengan fokus pada keamanan, konsistensi tipe data, dan performa tinggi.

---

## ⚛️ Frontend Core

| Teknologi | Fungsi |
|---|---|
| React 18.3.1 | Library UI utama |
| TypeScript 5.5 | Pengetikan statis |
| Vite 5.4 | Bundler & dev server |

---

## 🧭 Routing & Proteksi

| Teknologi | Fungsi |
|---|---|
| react-router-dom v7 | Routing aplikasi |
| ProtectedRoute | Validasi sesi & role |

---

## 🎨 UI & Desain Antarmuka

| Teknologi | Fungsi |
|---|---|
| Tailwind CSS 3.4 | Utility-first styling |
| shadcn/ui | Komponen UI modern |
| lucide-react | Ikon antarmuka |

### 🎨 Tema Warna

Menggunakan nuansa:

- Islamic Green `#166534`
- Green Accent `#15803d`

---

## 🧾 Form & Validasi

| Teknologi | Fungsi |
|---|---|
| react-hook-form | Form management |
| zod | Validasi schema |

---

## 📊 Visualisasi Data

| Teknologi | Fungsi |
|---|---|
| recharts | Dashboard analytics |

---

## 🗄️ Database & Backend

| Teknologi | Fungsi |
|---|---|
| Supabase | PostgreSQL + Auth |
| @supabase/supabase-js | Client SDK |

---

## 🌐 Integrasi API Eksternal

Endpoint sinkronisasi:

```txt
https://tes.ppwb.my.id/api/siswa-ppwb/peserta-saringan
```

Digunakan untuk:

- Sinkronisasi data peserta
- Pemutakhiran data otomatis
- Pemetaan berdasarkan NISPN

---

# 🗄️ Skema Basis Data (PostgreSQL)

Keamanan data dijaga menggunakan:

- Row Level Security (RLS)
- Atomic PostgreSQL Functions
- Relasi berbasis UUID

---

## 📋 Entitas Utama

| Tabel | Fungsi |
|---|---|
| `saringan_user` | Role & identitas internal |
| `saringan_periode` | Data periode tes |
| `saringan_peserta` | Biodata peserta |
| `saringan_nilai_bacaan` | Hasil tes bacaan |
| `saringan_nilai_penyampaian` | Hasil tes penyampaian |

---

# 📂 Struktur Proyek

```text
project/
├── src/
│   ├── components/
│   │   ├── print/                 # Template cetak HTML
│   │   ├── ui/                    # Komponen shadcn/ui
│   │   └── ProtectedRoute.tsx     # Middleware proteksi role
│   ├── contexts/
│   │   └── AuthContext.tsx        # Global auth state
│   ├── layouts/
│   │   ├── AdminLayout.tsx
│   │   └── GuruLayout.tsx
│   ├── lib/
│   │   ├── helpers.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── admin/
│   │   ├── guru/
│   │   └── LoginPage.tsx
│   ├── types/
│   │   └── database.types.ts
│   └── App.tsx
├── CREATE_ADMIN_USER.sql
├── PROJECT_SUMMARY.md
├── QUICK_START.md
└── README_SARINGAN.md
```

---

# ⚙️ Petunjuk Persiapan & Pemasangan Lokal

## 1️⃣ Prasyarat Sistem

Pastikan lingkungan pengembangan telah memiliki:

- Node.js v20.x atau v22.x
- npm

---

## 2️⃣ Instalasi Dependensi

```bash
git clone <URL_REPOSITORI_ANDA>
cd saringan-ppwb
npm install
```

---

## 3️⃣ Konfigurasi Environment Variables

Salin file konfigurasi:

```bash
cp .env.example .env
```

Isi file `.env`:

```env
VITE_SUPABASE_URL=https://id-proyek-anda.supabase.co
VITE_SUPABASE_ANON_KEY=kunci-anon-publik-anda
```

---

## 4️⃣ Inisialisasi Akun Administrator Pertama

Karena autentikasi menggunakan Supabase Auth, akun admin awal wajib dibuat secara manual.

### Langkah-langkah

1. Buka Supabase Dashboard
2. Masuk ke menu **SQL Editor**
3. Jalankan isi file:

```txt
CREATE_ADMIN_USER.sql
```

4. Sesuaikan password default bila diperlukan.

Fungsi skrip:

- Membuat user pada `auth.users`
- Menambahkan role admin pada `saringan_user`

---

## 5️⃣ Menjalankan Development Server

```bash
npm run dev
```

Aplikasi dapat diakses melalui:

```txt
http://localhost:5173
```

---

# 📜 Daftar Skrip NPM

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan development server |
| `npm run build` | Build produksi |
| `npm run typecheck` | Validasi TypeScript tanpa emit |
| `npm run lint` | Pemeriksaan ESLint |
| `npm run preview` | Preview hasil build produksi |

---

# 🔒 Keamanan Sistem

Sistem menerapkan beberapa lapisan keamanan:

- Role-Based Access Control (RBAC)
- Protected Routes
- Supabase Auth
- Row Level Security (RLS)
- Validasi schema menggunakan Zod
- Atomic database functions PostgreSQL

---

# 📈 Analitik & Pelaporan

Fitur analitik meliputi:

- Rekap kelulusan peserta
- Statistik performa penguji
- Distribusi nilai bacaan
- Distribusi nilai penyampaian
- Status musyawarah

---

# 📱 Dukungan Responsif

Antarmuka dioptimalkan untuk:

- Desktop
- Tablet
- Smartphone

Dengan pendekatan desain:

- Islamic dashboard UI
- Responsive layout
- Smooth transitions
- Modular reusable components

---

# 📄 Lisensi

Proyek ini dikembangkan untuk kebutuhan internal sistem screening test santri PPWB.
