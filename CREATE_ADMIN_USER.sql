-- Script untuk membuat user admin pertama
-- Jalankan script ini di Supabase SQL Editor

-- PENTING: Ganti 'your_password_here' dengan password yang diinginkan

DO $$
DECLARE
  new_user_id uuid;
  admin_password text := 'admin123'; -- GANTI PASSWORD INI!
BEGIN
  -- Cek apakah admin sudah ada
  IF EXISTS (SELECT 1 FROM saringan_user WHERE username = 'admin') THEN
    RAISE NOTICE 'Admin user already exists';
  ELSE
    -- Buat user di auth.users
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
      crypt(admin_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '{"username": "admin"}'::jsonb
    )
    RETURNING id INTO new_user_id;

    -- Buat user di saringan_user
    INSERT INTO saringan_user (nama, role, aktif, username, auth_id)
    VALUES ('Admin Saringan', 'admin', true, 'admin', new_user_id);

    RAISE NOTICE 'Admin user created successfully with username: admin';
  END IF;
END $$;

-- Buat juga user guru untuk testing (opsional)
DO $$
DECLARE
  new_user_id uuid;
  guru_password text := 'guru123'; -- GANTI PASSWORD INI!
BEGIN
  -- Cek apakah guru sudah ada
  IF EXISTS (SELECT 1 FROM saringan_user WHERE username = 'guru1') THEN
    RAISE NOTICE 'Guru user already exists';
  ELSE
    -- Buat user di auth.users
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
      'guru1@saringan.ppwb.my.id',
      crypt(guru_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '{"username": "guru1"}'::jsonb
    )
    RETURNING id INTO new_user_id;

    -- Buat user di saringan_user
    INSERT INTO saringan_user (nama, role, aktif, username, auth_id)
    VALUES ('Guru Test', 'guru', true, 'guru1', new_user_id);

    RAISE NOTICE 'Guru user created successfully with username: guru1';
  END IF;
END $$;

-- Verifikasi user yang dibuat
SELECT
  u.id,
  u.nama,
  u.username,
  u.role,
  u.aktif,
  a.email,
  a.email_confirmed_at IS NOT NULL as email_confirmed
FROM saringan_user u
LEFT JOIN auth.users a ON u.auth_id = a.id
ORDER BY u.nama;
