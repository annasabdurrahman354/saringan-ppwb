import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://idyrzipjfcoludwcnscm.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkeXJ6aXBqZmNvbHVkd2Nuc2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNzA2MjEsImV4cCI6MjA3NTY0NjYyMX0.fXxi5aJJnSqzUwNP1VgD6ZRoBiGiW4qtyakpGCq4DkA';

export const supabase = createClient(supabaseUrl, supabaseKey);
