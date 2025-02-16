
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qpscqpbnbdpnacgfvbfr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwc2NxcGJuYmRwbmFjZ2Z2YmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MzkwMTEsImV4cCI6MjA1NTIxNTAxMX0.WsmIKeiePxl8YKkThO5LNo1LXa9mHmpWOfcKUVBstic';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
