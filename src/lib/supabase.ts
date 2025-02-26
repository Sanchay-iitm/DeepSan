import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://knmzxgmcxlqnriphmhqw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubXp4Z21jeGxxbnJpcGhtaHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1ODE4MDAsImV4cCI6MjA1NjE1NzgwMH0.Hrie-_DGq1qGAOELfUSK7NAtVxymctuwZMdd1Tn5oiQ';

export const supabase = createClient(supabaseUrl, supabaseKey);