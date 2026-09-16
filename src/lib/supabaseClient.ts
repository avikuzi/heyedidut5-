import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readEnv(name: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const value = (import.meta.env[name] || '').trim();
  return value;
}

export function isSupabaseConfigured(): boolean {
  const url = readEnv('VITE_SUPABASE_URL');
  const key = readEnv('VITE_SUPABASE_ANON_KEY');
  if (!url || !key) return false;
  if (/YOUR_|placeholder|example\.supabase/i.test(url) || /YOUR_|placeholder/i.test(key)) {
    return false;
  }
  return url.startsWith('https://') || url.startsWith('http://');
}

export function getSupabaseUrl(): string {
  return readEnv('VITE_SUPABASE_URL');
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(readEnv('VITE_SUPABASE_URL'), readEnv('VITE_SUPABASE_ANON_KEY'), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return client;
}

export function getAdminEmail(): string {
  return (import.meta.env.VITE_ADMIN_EMAIL || '').trim();
}
