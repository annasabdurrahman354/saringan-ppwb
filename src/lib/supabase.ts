import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pfwzumovbdtocimrotsu.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd3p1bW92YmR0b2NpbXJvdHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMzc0ODIsImV4cCI6MjA2MzkxMzQ4Mn0.wEiHUVU6bInwFphqpMUR00zOw0Kdl2geh7DZh3vfcOQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
