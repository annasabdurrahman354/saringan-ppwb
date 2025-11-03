/*
  # Create Saringan (Screening Test) Schema for Islamic Boarding School

  1. New Tables
    - `saringan_user`
      - `id` (uuid, primary key)
      - `nama` (varchar, user's full name)
      - `role` (varchar, either 'guru' or 'admin')
      - `aktif` (boolean, active status)
      - `username` (varchar, unique)
      - `auth_id` (uuid, references auth.users)
      - Timestamps
    
    - `saringan_periode`
      - `id` (varchar, format Ym like "202501")
      - `aktif` (boolean, only one can be active)
      - Timestamps
    
    - `saringan_peserta`
      - `id` (uuid, primary key)
      - `periode_id` (varchar, foreign key)
      - Student information fields (nispn, nama, etc.)
      - Test results fields (hasil_tes, hasil_tes_bacaan, hasil_tes_penyampaian)
      - `status_tes` (aktif/lulus/tidak_lulus)
      - Timestamps
    
    - `saringan_nilai_bacaan`
      - `id` (uuid, primary key)
      - `peserta_id` (uuid, foreign key)
      - `guru_id` (uuid, foreign key)
      - `nilai` (lulus/tidak_lulus)
      - Kekurangan fields (jsonb arrays)
      - `materi` and `catatan` fields
      - Timestamps
    
    - `saringan_nilai_penyampaian`
      - `id` (uuid, primary key)
      - `peserta_id` (uuid, foreign key)
      - `guru_id` (uuid, foreign key)
      - Four nilai fields (makna, keterangan, penjelasan, pemahaman)
      - `materi` and `catatan` fields
      - Timestamps

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
    
  3. Functions
    - `simpan_nilai_bacaan` - Atomic function to save bacaan scores and update results
    - `simpan_nilai_penyampaian` - Atomic function to save penyampaian scores and update results
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create saringan_user table
CREATE TABLE IF NOT EXISTS saringan_user (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('guru', 'admin')),
  aktif BOOLEAN DEFAULT true,
  username VARCHAR(100) UNIQUE NOT NULL,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saringan_periode table
CREATE TABLE IF NOT EXISTS saringan_periode (
  id VARCHAR(10) PRIMARY KEY,
  aktif BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saringan_peserta table
CREATE TABLE IF NOT EXISTS saringan_peserta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  periode_id VARCHAR(10) NOT NULL REFERENCES saringan_periode(id) ON DELETE CASCADE,
  nispn VARCHAR(50) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  nama_panggilan VARCHAR(100),
  jenis_kelamin VARCHAR(1) CHECK (jenis_kelamin IN ('L', 'P')),
  rfid VARCHAR(100),
  nomor_identitas VARCHAR(50),
  foto TEXT,
  nama_ayah VARCHAR(255),
  nama_ibu VARCHAR(255),
  tempat_lahir VARCHAR(255),
  tanggal_lahir DATE,
  alamat_lengkap TEXT,
  daerah_sambung VARCHAR(255),
  desa_sambung VARCHAR(255),
  kelompok_sambung VARCHAR(255),
  status_mondok VARCHAR(100),
  daerah_kiriman VARCHAR(255),
  pendidikan VARCHAR(100),
  jurusan VARCHAR(100),
  hasil_tes_penyampaian VARCHAR(50) DEFAULT 'belum_pengetesan' 
    CHECK (hasil_tes_penyampaian IN ('lulus', 'tidak_lulus', 'belum_pengetesan')),
  hasil_tes_bacaan VARCHAR(50) DEFAULT 'belum_pengetesan' 
    CHECK (hasil_tes_bacaan IN ('lulus', 'tidak_lulus', 'perlu_musyawarah', 'belum_pengetesan')),
  hasil_tes VARCHAR(50) DEFAULT 'belum_pengetesan' 
    CHECK (hasil_tes IN ('lulus', 'tidak_lulus', 'perlu_musyawarah', 'belum_pengetesan_bacaan', 'belum_pengetesan_penyampaian', 'belum_pengetesan')),
  status_tes VARCHAR(50) DEFAULT 'aktif' 
    CHECK (status_tes IN ('aktif', 'lulus', 'tidak_lulus')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(periode_id, nispn)
);

-- Create saringan_nilai_bacaan table
CREATE TABLE IF NOT EXISTS saringan_nilai_bacaan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  peserta_id UUID NOT NULL REFERENCES saringan_peserta(id) ON DELETE CASCADE,
  guru_id UUID NOT NULL REFERENCES saringan_user(id) ON DELETE CASCADE,
  nilai VARCHAR(20) NOT NULL CHECK (nilai IN ('lulus', 'tidak_lulus')),
  kekurangan_tajwid JSONB DEFAULT '[]'::jsonb,
  kekurangan_khusus JSONB DEFAULT '[]'::jsonb,
  kekurangan_keserasian JSONB DEFAULT '[]'::jsonb,
  kekurangan_kelancaran JSONB DEFAULT '[]'::jsonb,
  materi TEXT,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saringan_nilai_penyampaian table
CREATE TABLE IF NOT EXISTS saringan_nilai_penyampaian (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  peserta_id UUID NOT NULL REFERENCES saringan_peserta(id) ON DELETE CASCADE,
  guru_id UUID NOT NULL REFERENCES saringan_user(id) ON DELETE CASCADE,
  nilai_makna INTEGER NOT NULL CHECK (nilai_makna IN (60, 70, 80, 90)),
  nilai_keterangan INTEGER NOT NULL CHECK (nilai_keterangan IN (60, 70, 80, 90)),
  nilai_penjelasan INTEGER NOT NULL CHECK (nilai_penjelasan IN (60, 70, 80, 90)),
  nilai_pemahaman INTEGER NOT NULL CHECK (nilai_pemahaman IN (60, 70, 80, 90)),
  materi TEXT,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saringan_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE saringan_periode ENABLE ROW LEVEL SECURITY;
ALTER TABLE saringan_peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE saringan_nilai_bacaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE saringan_nilai_penyampaian ENABLE ROW LEVEL SECURITY;

-- Policies for saringan_user
CREATE POLICY "Users can view all users"
  ON saringan_user FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage users"
  ON saringan_user FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saringan_user
      WHERE saringan_user.auth_id = auth.uid()
      AND saringan_user.role = 'admin'
      AND saringan_user.aktif = true
    )
  );

-- Policies for saringan_periode
CREATE POLICY "Users can view all periods"
  ON saringan_periode FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage periods"
  ON saringan_periode FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saringan_user
      WHERE saringan_user.auth_id = auth.uid()
      AND saringan_user.role = 'admin'
      AND saringan_user.aktif = true
    )
  );

-- Policies for saringan_peserta
CREATE POLICY "Users can view all participants"
  ON saringan_peserta FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage participants"
  ON saringan_peserta FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saringan_user
      WHERE saringan_user.auth_id = auth.uid()
      AND saringan_user.role = 'admin'
      AND saringan_user.aktif = true
    )
  );

-- Policies for saringan_nilai_bacaan
CREATE POLICY "Users can view all bacaan scores"
  ON saringan_nilai_bacaan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Guru and Admin can insert bacaan scores"
  ON saringan_nilai_bacaan FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saringan_user
      WHERE saringan_user.auth_id = auth.uid()
      AND saringan_user.aktif = true
    )
  );

CREATE POLICY "Admins can manage bacaan scores"
  ON saringan_nilai_bacaan FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saringan_user
      WHERE saringan_user.auth_id = auth.uid()
      AND saringan_user.role = 'admin'
      AND saringan_user.aktif = true
    )
  );

-- Policies for saringan_nilai_penyampaian
CREATE POLICY "Users can view all penyampaian scores"
  ON saringan_nilai_penyampaian FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Guru and Admin can insert penyampaian scores"
  ON saringan_nilai_penyampaian FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saringan_user
      WHERE saringan_user.auth_id = auth.uid()
      AND saringan_user.aktif = true
    )
  );

CREATE POLICY "Admins can manage penyampaian scores"
  ON saringan_nilai_penyampaian FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saringan_user
      WHERE saringan_user.auth_id = auth.uid()
      AND saringan_user.role = 'admin'
      AND saringan_user.aktif = true
    )
  );

-- Function: simpan_nilai_bacaan
CREATE OR REPLACE FUNCTION public.simpan_nilai_bacaan(
  _peserta_id uuid,
  _guru_id uuid,
  _materi text,
  _nilai text,
  _kekurangan_tajwid jsonb,
  _kekurangan_khusus jsonb,
  _kekurangan_keserasian jsonb,
  _kekurangan_kelancaran jsonb,
  _catatan text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
  ins_row record;
  peserta_row record;
  penyampaian_latest jsonb;
  bacaan_latest jsonb;
  lulus_count int := 0;
  tidak_count int := 0;
  hasil_penyampaian text;
  hasil_bacaan text;
  final_hasil text;
  final_hasil_numeric numeric;
BEGIN
  INSERT INTO saringan_nilai_bacaan(
    peserta_id, guru_id, materi, nilai, 
    kekurangan_tajwid, kekurangan_khusus, kekurangan_keserasian, kekurangan_kelancaran,
    catatan
  )
  VALUES(
    _peserta_id, _guru_id, _materi, _nilai,
    _kekurangan_tajwid, _kekurangan_khusus, _kekurangan_keserasian, _kekurangan_kelancaran,
    _catatan
  )
  RETURNING * INTO ins_row;

  SELECT jsonb_agg(t) INTO penyampaian_latest
  FROM (
    SELECT DISTINCT ON (guru_id) guru_id, nilai_makna, nilai_keterangan, nilai_penjelasan, nilai_pemahaman, created_at
    FROM saringan_nilai_penyampaian
    WHERE peserta_id = _peserta_id
    ORDER BY guru_id, created_at DESC
  ) t;

  IF penyampaian_latest IS NULL OR jsonb_array_length(penyampaian_latest) = 0 THEN
    hasil_penyampaian := 'belum_pengetesan';
  ELSE
    SELECT avg((( (e->>'nilai_makna')::numeric + (e->>'nilai_keterangan')::numeric + (e->>'nilai_penjelasan')::numeric + (e->>'nilai_pemahaman')::numeric)/4 ))
    INTO final_hasil_numeric
    FROM jsonb_array_elements(penyampaian_latest) e;
    
    IF final_hasil_numeric >= 70 THEN
      hasil_penyampaian := 'lulus';
    ELSE
      hasil_penyampaian := 'tidak_lulus';
    END IF;
  END IF;

  SELECT jsonb_agg(t) INTO bacaan_latest
  FROM (
    SELECT DISTINCT ON (guru_id) guru_id, nilai, created_at
    FROM saringan_nilai_bacaan
    WHERE peserta_id = _peserta_id
    ORDER BY guru_id, created_at DESC
  ) t;

  IF bacaan_latest IS NULL OR jsonb_array_length(bacaan_latest) = 0 THEN
    hasil_bacaan := 'belum_pengetesan';
  ELSE
    SELECT
      COALESCE(COUNT(*) FILTER (WHERE elem->>'nilai' = 'lulus'),0)::int,
      COALESCE(COUNT(*) FILTER (WHERE elem->>'nilai' <> 'lulus'),0)::int
    INTO lulus_count, tidak_count
    FROM jsonb_array_elements(bacaan_latest) elem;

    IF lulus_count > tidak_count THEN
      hasil_bacaan := 'lulus';
    ELSIF tidak_count > lulus_count THEN
      hasil_bacaan := 'tidak_lulus';
    ELSE
      hasil_bacaan := 'perlu_musyawarah';
    END IF;
  END IF;

  IF hasil_penyampaian = 'belum_pengetesan' AND hasil_bacaan = 'belum_pengetesan' THEN
    final_hasil := 'belum_pengetesan';
  ELSIF hasil_penyampaian = 'lulus' AND hasil_bacaan = 'lulus' THEN
    final_hasil := 'lulus';
  ELSIF hasil_penyampaian = 'lulus' AND hasil_bacaan = 'tidak_lulus' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_penyampaian = 'tidak_lulus' AND hasil_bacaan = 'lulus' THEN
    final_hasil := 'lulus';
  ELSIF hasil_penyampaian = 'tidak_lulus' AND hasil_bacaan = 'tidak_lulus' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_penyampaian = 'lulus' AND hasil_bacaan = 'perlu_musyawarah' THEN
    final_hasil := 'perlu_musyawarah';
  ELSIF hasil_penyampaian = 'tidak_lulus' AND hasil_bacaan = 'perlu_musyawarah' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_bacaan = 'belum_pengetesan' THEN
    final_hasil := 'belum_pengetesan_bacaan';
  ELSIF hasil_penyampaian = 'belum_pengetesan' THEN
    final_hasil := 'belum_pengetesan_penyampaian';
  ELSE
    final_hasil := 'perlu_musyawarah';
  END IF;

  UPDATE saringan_peserta 
  SET hasil_tes_penyampaian = hasil_penyampaian, 
      hasil_tes_bacaan = hasil_bacaan, 
      hasil_tes = final_hasil,
      updated_at = NOW()
  WHERE id = _peserta_id 
  RETURNING * INTO peserta_row;

  RETURN jsonb_build_object('nilai', to_jsonb(ins_row), 'peserta', to_jsonb(peserta_row));
END;
$$;


-- Function: hapus_nilai_bacaan
CREATE OR REPLACE FUNCTION public.hapus_nilai_bacaan(
  _id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
  deleted_row record;
  peserta_row record;
  _peserta_id uuid;
  penyampaian_latest jsonb;
  bacaan_latest jsonb;
  lulus_count int := 0;
  tidak_count int := 0;
  hasil_penyampaian text;
  hasil_bacaan text;
  final_hasil text;
  final_hasil_numeric numeric;
BEGIN
  -- Hapus data dan ambil peserta_id
  DELETE FROM saringan_nilai_bacaan
  WHERE id = _id
  RETURNING * INTO deleted_row;

  IF deleted_row IS NULL THEN
    RAISE EXCEPTION 'Data nilai bacaan tidak ditemukan';
  END IF;

  _peserta_id := deleted_row.peserta_id;

  -- Hitung ulang hasil penyampaian
  SELECT jsonb_agg(t) INTO penyampaian_latest
  FROM (
    SELECT DISTINCT ON (guru_id) guru_id, nilai_makna, nilai_keterangan, nilai_penjelasan, nilai_pemahaman, created_at
    FROM saringan_nilai_penyampaian
    WHERE peserta_id = _peserta_id
    ORDER BY guru_id, created_at DESC
  ) t;

  IF penyampaian_latest IS NULL OR jsonb_array_length(penyampaian_latest) = 0 THEN
    hasil_penyampaian := 'belum_pengetesan';
  ELSE
    SELECT avg((( (e->>'nilai_makna')::numeric + (e->>'nilai_keterangan')::numeric + (e->>'nilai_penjelasan')::numeric + (e->>'nilai_pemahaman')::numeric)/4 ))
    INTO final_hasil_numeric
    FROM jsonb_array_elements(penyampaian_latest) e;
    
    IF final_hasil_numeric >= 70 THEN
      hasil_penyampaian := 'lulus';
    ELSE
      hasil_penyampaian := 'tidak_lulus';
    END IF;
  END IF;

  -- Hitung ulang hasil bacaan
  SELECT jsonb_agg(t) INTO bacaan_latest
  FROM (
    SELECT DISTINCT ON (guru_id) guru_id, nilai, created_at
    FROM saringan_nilai_bacaan
    WHERE peserta_id = _peserta_id
    ORDER BY guru_id, created_at DESC
  ) t;

  IF bacaan_latest IS NULL OR jsonb_array_length(bacaan_latest) = 0 THEN
    hasil_bacaan := 'belum_pengetesan';
  ELSE
    SELECT
      COALESCE(COUNT(*) FILTER (WHERE elem->>'nilai' = 'lulus'),0)::int,
      COALESCE(COUNT(*) FILTER (WHERE elem->>'nilai' <> 'lulus'),0)::int
    INTO lulus_count, tidak_count
    FROM jsonb_array_elements(bacaan_latest) elem;

    IF lulus_count > tidak_count THEN
      hasil_bacaan := 'lulus';
    ELSIF tidak_count > lulus_count THEN
      hasil_bacaan := 'tidak_lulus';
    ELSE
      hasil_bacaan := 'perlu_musyawarah';
    END IF;
  END IF;

  -- Tentukan hasil final
  IF hasil_penyampaian = 'belum_pengetesan' AND hasil_bacaan = 'belum_pengetesan' THEN
    final_hasil := 'belum_pengetesan';
  ELSIF hasil_penyampaian = 'lulus' AND hasil_bacaan = 'lulus' THEN
    final_hasil := 'lulus';
  ELSIF hasil_penyampaian = 'lulus' AND hasil_bacaan = 'tidak_lulus' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_penyampaian = 'tidak_lulus' AND hasil_bacaan = 'lulus' THEN
    final_hasil := 'lulus';
  ELSIF hasil_penyampaian = 'tidak_lulus' AND hasil_bacaan = 'tidak_lulus' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_penyampaian = 'lulus' AND hasil_bacaan = 'perlu_musyawarah' THEN
    final_hasil := 'perlu_musyawarah';
  ELSIF hasil_penyampaian = 'tidak_lulus' AND hasil_bacaan = 'perlu_musyawarah' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_bacaan = 'belum_pengetesan' THEN
    final_hasil := 'belum_pengetesan_bacaan';
  ELSIF hasil_penyampaian = 'belum_pengetesan' THEN
    final_hasil := 'belum_pengetesan_penyampaian';
  ELSE
    final_hasil := 'perlu_musyawarah';
  END IF;

  -- Update peserta
  UPDATE saringan_peserta 
  SET hasil_tes_penyampaian = hasil_penyampaian, 
      hasil_tes_bacaan = hasil_bacaan, 
      hasil_tes = final_hasil,
      updated_at = NOW()
  WHERE id = _peserta_id 
  RETURNING * INTO peserta_row;

  RETURN jsonb_build_object('deleted', to_jsonb(deleted_row), 'peserta', to_jsonb(peserta_row));
END;
$$;


-- Function: simpan_nilai_penyampaian
CREATE OR REPLACE FUNCTION public.simpan_nilai_penyampaian(
  _peserta_id uuid,
  _guru_id uuid,
  _materi text,
  _nilai_makna integer,
  _nilai_keterangan integer,
  _nilai_penjelasan integer,
  _nilai_pemahaman integer,
  _catatan text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
  ins_row record;
  peserta_row record;
  avg_val numeric;
  penyampaian_latest jsonb;
  bacaan_latest jsonb;
  lulus_count int := 0;
  tidak_count int := 0;
  hasil_penyampaian text;
  hasil_bacaan text;
  final_hasil text;
  nilai_elem jsonb;  -- Renamed to avoid conflict
BEGIN
  INSERT INTO saringan_nilai_penyampaian(
    peserta_id, guru_id, materi, 
    nilai_makna, nilai_keterangan, nilai_penjelasan, nilai_pemahaman, 
    catatan
  )
  VALUES(
    _peserta_id, _guru_id, _materi,
    _nilai_makna, _nilai_keterangan, _nilai_penjelasan, _nilai_pemahaman,
    _catatan
  )
  RETURNING * INTO ins_row;

  SELECT jsonb_agg(t) INTO penyampaian_latest
  FROM (
    SELECT DISTINCT ON (guru_id) guru_id, nilai_makna, nilai_keterangan, nilai_penjelasan, nilai_pemahaman, created_at
    FROM saringan_nilai_penyampaian
    WHERE peserta_id = _peserta_id
    ORDER BY guru_id, created_at DESC
  ) t;

  IF penyampaian_latest IS NULL OR jsonb_array_length(penyampaian_latest) = 0 THEN
    hasil_penyampaian := 'belum_pengetesan';
  ELSE
    -- Use a different alias in the SELECT query
    SELECT avg((( (x->>'nilai_makna')::numeric + (x->>'nilai_keterangan')::numeric + (x->>'nilai_penjelasan')::numeric + (x->>'nilai_pemahaman')::numeric)/4  ))
    INTO avg_val
    FROM jsonb_array_elements(penyampaian_latest) x;

    IF avg_val >= 70 THEN
      hasil_penyampaian := 'lulus';
    ELSE
      hasil_penyampaian := 'tidak_lulus';
    END IF;
  END IF;

  SELECT jsonb_agg(t) INTO bacaan_latest
  FROM (
    SELECT DISTINCT ON (guru_id) guru_id, nilai, created_at
    FROM saringan_nilai_bacaan
    WHERE peserta_id = _peserta_id
    ORDER BY guru_id, created_at DESC
  ) t;

  IF bacaan_latest IS NULL OR jsonb_array_length(bacaan_latest) = 0 THEN
    hasil_bacaan := 'belum_pengetesan';
  ELSE
    lulus_count := 0;
    tidak_count := 0;
    -- Use the declared variable in FOR loop
    FOR nilai_elem IN SELECT jsonb_array_elements(bacaan_latest) LOOP
      IF (nilai_elem->>'nilai') = 'lulus' THEN
        lulus_count := lulus_count + 1;
      ELSE
        tidak_count := tidak_count + 1;
      END IF;
    END LOOP;
    
    IF lulus_count > tidak_count THEN
      hasil_bacaan := 'lulus';
    ELSIF tidak_count > lulus_count THEN
      hasil_bacaan := 'tidak_lulus';
    ELSE
      hasil_bacaan := 'perlu_musyawarah';
    END IF;
  END IF;

  IF hasil_penyampaian = 'belum_pengetesan' AND hasil_bacaan = 'belum_pengetesan' THEN
    final_hasil := 'belum_pengetesan';
  ELSIF hasil_penyampaian = 'lulus' AND hasil_bacaan = 'lulus' THEN
    final_hasil := 'lulus';
  ELSIF hasil_penyampaian = 'lulus' AND hasil_bacaan = 'tidak_lulus' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_penyampaian = 'tidak_lulus' AND hasil_bacaan = 'lulus' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_penyampaian = 'tidak_lulus' AND hasil_bacaan = 'tidak_lulus' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_penyampaian = 'lulus' AND hasil_bacaan = 'perlu_musyawarah' THEN
    final_hasil := 'perlu_musyawarah';
  ELSIF hasil_penyampaian = 'tidak_lulus' AND hasil_bacaan = 'perlu_musyawarah' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_bacaan = 'belum_pengetesan' THEN
    final_hasil := 'belum_pengetesan_bacaan';
  ELSIF hasil_penyampaian = 'belum_pengetesan' THEN
    final_hasil := 'belum_pengetesan_penyampaian';
  ELSE
    final_hasil := 'perlu_musyawarah';
  END IF;

  UPDATE saringan_peserta 
  SET hasil_tes_penyampaian = hasil_penyampaian, 
      hasil_tes_bacaan = hasil_bacaan, 
      hasil_tes = final_hasil,
      updated_at = NOW()
  WHERE id = _peserta_id 
  RETURNING * INTO peserta_row;

  RETURN jsonb_build_object('nilai', to_jsonb(ins_row), 'peserta', to_jsonb(peserta_row));
END;
$$;

-- Function: hapus_nilai_penyampaian
CREATE OR REPLACE FUNCTION public.hapus_nilai_penyampaian(
  _id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
  deleted_row record;
  peserta_row record;
  _peserta_id uuid;
  avg_val numeric;
  penyampaian_latest jsonb;
  bacaan_latest jsonb;
  lulus_count int := 0;
  tidak_count int := 0;
  hasil_penyampaian text;
  hasil_bacaan text;
  final_hasil text;
  nilai_elem jsonb;  -- Renamed to avoid conflict
BEGIN
  DELETE FROM saringan_nilai_penyampaian
  WHERE id = _id
  RETURNING * INTO deleted_row;

  IF deleted_row IS NULL THEN
    RAISE EXCEPTION 'Data nilai penyampaian tidak ditemukan';
  END IF;

  _peserta_id := deleted_row.peserta_id;

  SELECT jsonb_agg(t) INTO penyampaian_latest
  FROM (
    SELECT DISTINCT ON (guru_id) guru_id, nilai_makna, nilai_keterangan, nilai_penjelasan, nilai_pemahaman, created_at
    FROM saringan_nilai_penyampaian
    WHERE peserta_id = _peserta_id
    ORDER BY guru_id, created_at DESC
  ) t;

  IF penyampaian_latest IS NULL OR jsonb_array_length(penyampaian_latest) = 0 THEN
    hasil_penyampaian := 'belum_pengetesan';
  ELSE
    -- Use a different alias in the SELECT query
    SELECT avg((( (x->>'nilai_makna')::numeric + (x->>'nilai_keterangan')::numeric + (x->>'nilai_penjelasan')::numeric + (x->>'nilai_pemahaman')::numeric)/4  ))
    INTO avg_val
    FROM jsonb_array_elements(penyampaian_latest) x;

    IF avg_val >= 70 THEN
      hasil_penyampaian := 'lulus';
    ELSE
      hasil_penyampaian := 'tidak_lulus';
    END IF;
  END IF;

  SELECT jsonb_agg(t) INTO bacaan_latest
  FROM (
    SELECT DISTINCT ON (guru_id) guru_id, nilai, created_at
    FROM saringan_nilai_bacaan
    WHERE peserta_id = _peserta_id
    ORDER BY guru_id, created_at DESC
  ) t;

  IF bacaan_latest IS NULL OR jsonb_array_length(bacaan_latest) = 0 THEN
    hasil_bacaan := 'belum_pengetesan';
  ELSE
    lulus_count := 0;
    tidak_count := 0;
    -- Use the declared variable in FOR loop
    FOR nilai_elem IN SELECT jsonb_array_elements(bacaan_latest) LOOP
      IF (nilai_elem->>'nilai') = 'lulus' THEN
        lulus_count := lulus_count + 1;
      ELSE
        tidak_count := tidak_count + 1;
      END IF;
    END LOOP;
    
    IF lulus_count > tidak_count THEN
      hasil_bacaan := 'lulus';
    ELSIF tidak_count > lulus_count THEN
      hasil_bacaan := 'tidak_lulus';
    ELSE
      hasil_bacaan := 'perlu_musyawarah';
    END IF;
  END IF;

  IF hasil_penyampaian = 'belum_pengetesan' AND hasil_bacaan = 'belum_pengetesan' THEN
    final_hasil := 'belum_pengetesan';
  ELSIF hasil_penyampaian = 'lulus' AND hasil_bacaan = 'lulus' THEN
    final_hasil := 'lulus';
  ELSIF hasil_penyampaian = 'lulus' AND hasil_bacaan = 'tidak_lulus' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_penyampaian = 'tidak_lulus' AND hasil_bacaan = 'lulus' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_penyampaian = 'tidak_lulus' AND hasil_bacaan = 'tidak_lulus' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_penyampaian = 'lulus' AND hasil_bacaan = 'perlu_musyawarah' THEN
    final_hasil := 'perlu_musyawarah';
  ELSIF hasil_penyampaian = 'tidak_lulus' AND hasil_bacaan = 'perlu_musyawarah' THEN
    final_hasil := 'tidak_lulus';
  ELSIF hasil_bacaan = 'belum_pengetesan' THEN
    final_hasil := 'belum_pengetesan_bacaan';
  ELSIF hasil_penyampaian = 'belum_pengetesan' THEN
    final_hasil := 'belum_pengetesan_penyampaian';
  ELSE
    final_hasil := 'perlu_musyawarah';
  END IF;

  UPDATE saringan_peserta 
  SET hasil_tes_penyampaian = hasil_penyampaian, 
      hasil_tes_bacaan = hasil_bacaan, 
      hasil_tes = final_hasil,
      updated_at = NOW()
  WHERE id = _peserta_id 
  RETURNING * INTO peserta_row;

  RETURN jsonb_build_object('deleted', to_jsonb(deleted_row), 'peserta', to_jsonb(peserta_row));
END;
$$;