import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oatnbctncepofnrkjuta.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hdG5iY3RuY2Vwb2ZucmtqdXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NzQzOTIsImV4cCI6MjA1NTU1MDM5Mn0.MtwbpPn7Mjq9hOZH3fl8V-ssbYQb-VsdbRX2B-8MhQU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
