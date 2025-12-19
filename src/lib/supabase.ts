
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fflidmuxxibutcplvvcj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbGlkbXV4eGlidXRjcGx2dmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjM2MTEsImV4cCI6MjA4MTY5OTYxMX0.y1h7nsUduEVXogmO-p5T7RgGYQ0vihXwOLxoX_eJwK8';



if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
