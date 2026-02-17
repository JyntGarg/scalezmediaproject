import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fiyqfcpwdslopnifwgpm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpeXFmY3B3ZHNsb3BuaWZ3Z3BtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDE5NTEsImV4cCI6MjA4NjIxNzk1MX0.gjASnViO4m2pdTpIzLeCDdpZgFGvs_YlYWEYVIkEkgc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
