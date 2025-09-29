import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frtvdjcdzcapswhilkfw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZydHZkamNkemNhcHN3aGlsa2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NjEyNTEsImV4cCI6MjA3MjEzNzI1MX0.QxhJL40T8U6WEJc068nieUeJVWs3-EsBdVg2rYE7h_8';

export const supabase = createClient(supabaseUrl, supabaseKey);
