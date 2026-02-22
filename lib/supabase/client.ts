import { createBrowserClient } from '@supabase/ssr';
import { getPublicSupabaseEnv } from '@/lib/env';

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
