/*
  # Insert Sample Data for Testing

  1. Sample Data
    - Insert sample periode
    - Insert sample admin user (you'll need to create auth user separately)
    - Insert sample guru user (you'll need to create auth user separately)

  Note: Users need to be created through the application's signup flow
  or Supabase Auth dashboard with emails:
  - admin@saringan.ppwb.my.id (password: admin123)
  - guru1@saringan.ppwb.my.id (password: guru123)
*/

-- Insert sample periode
INSERT INTO saringan_periode (id, aktif) 
VALUES ('202501', true)
ON CONFLICT (id) DO NOTHING;

-- Note: To create users, you need to:
-- 1. Use the application's user creation feature (Admin > User > Tambah User)
-- 2. Or use Supabase Dashboard to create auth users with emails:
--    - admin@saringan.ppwb.my.id
--    - guru1@saringan.ppwb.my.id
-- 3. Then manually insert into saringan_user table with the auth_id

-- Example: After creating auth users, insert user records
-- Replace 'YOUR_AUTH_ID_HERE' with actual auth user IDs from auth.users table

-- INSERT INTO saringan_user (nama, role, aktif, username, auth_id)
-- VALUES 
--   ('Admin Test', 'admin', true, 'admin', 'YOUR_ADMIN_AUTH_ID_HERE'),
--   ('Guru Test', 'guru', true, 'guru1', 'YOUR_GURU_AUTH_ID_HERE')
-- ON CONFLICT (username) DO NOTHING;
