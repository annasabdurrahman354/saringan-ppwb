export interface User {
  id: string;
  nama: string;
  role: 'guru' | 'admin';
  aktif: boolean;
  username: string;
  auth_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Periode {
  id: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Peserta {
  id: string;
  periode_id: string;
  nispn: string;
  nama: string;
  nama_panggilan: string | null;
  jenis_kelamin: 'L' | 'P';
  rfid: string | null;
  nomor_identitas: string | null;
  foto: string | null;
  nama_ayah: string | null;
  nama_ibu: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat_lengkap: string | null;
  daerah_sambung: string | null;
  desa_sambung: string | null;
  kelompok_sambung: string | null;
  status_mondok: string | null;
  daerah_kiriman: string | null;
  pendidikan: string | null;
  jurusan: string | null;
  kelas: 'saringan' | 'bacaan' | 'penyampaian';
  hasil_tes_penyampaian: 'lulus' | 'tidak_lulus' | 'belum_pengetesan';
  hasil_tes_bacaan: 'lulus' | 'tidak_lulus' | 'perlu_musyawarah' | 'belum_pengetesan';
  hasil_tes: 'lulus' | 'tidak_lulus' | 'perlu_musyawarah' | 'belum_pengetesan_bacaan' | 'belum_pengetesan_penyampaian' | 'belum_pengetesan';
  status_tes: 'aktif' | 'lulus' | 'tidak_lulus';
  created_at: string;
  updated_at: string;
}

export interface NilaiBacaan {
  id: string;
  peserta_id: string;
  guru_id: string;
  nilai: 'lulus' | 'tidak_lulus';
  kekurangan_tajwid: string[];
  kekurangan_khusus: string[];
  kekurangan_keserasian: string[];
  kekurangan_kelancaran: string[];
  materi: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface NilaiPenyampaian {
  id: string;
  peserta_id: string;
  guru_id: string;
  nilai_makna: number;
  nilai_keterangan: number;
  nilai_penjelasan: number;
  nilai_pemahaman: number;
  materi: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiwayatEntry {
  nama: string;
  tanggal_masuk: string;
  status: number | string;
}

export interface ApiStudent {
  nispn: string;
  nis: string | null;
  nik: string;
  kk: string | null;
  rfid: string;
  nama: string;
  jenis_kelamin: 'L' | 'P' | string;
  nama_ayah: string | null;
  nama_ibu: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string;
  umur: number | null;
  rt: string | null;
  rw: string | null;
  desa_kel: string | null;
  kecamatan: string | null;
  kota_kab: string | null;
  provinsi: string | null;
  kode_pos: string | null;
  alamat_lengkap: string | null;
  foto_siswa: string;
  pendidikan: string | null;
  jurusan: string | null;
  kelompok_sambung: string | null;
  desa_sambung: string | null;
  daerah_sambung: string | null;
  status_mondok: string | null;
  daerah_kiriman: string | null;
  kelas: string | null;
  kelas_id: number | null;
  kelompok: string | null;
  kelompok_id: number | null;
  tanggal_masuk_kelas: string | null;
  tanggal_masuk_kelompok: string | null;
  tanggal_mendaftar: string | null;
  riwayat_ponpes: RiwayatEntry[];
  riwayat_kelas: RiwayatEntry[];
  riwayat_kelompok: RiwayatEntry[];
}

export type ApiStudentResponse = ApiStudent[];
