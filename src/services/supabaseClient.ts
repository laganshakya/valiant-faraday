import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  const g = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
  if (g.process && g.process.env && g.process.env[key]) {
    return g.process.env[key] as string;
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key] as string;
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://oyunveiwwnknengdahox.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dW52ZWl3d25rbmVuZ2RhaG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NzQwOTksImV4cCI6MjEwNTQ1MDA5OX0.hcSf01_zTGNuEzTMmg1w1N-3nR6sNZK7XcoqCS-C07g';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
