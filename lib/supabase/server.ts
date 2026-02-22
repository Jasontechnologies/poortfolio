import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPublicSupabaseEnv } from '@/lib/env';

export async function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getPublicSupabaseEnv();

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        // In Server Components, Next.js disallows mutating cookies.
        // Route Handlers / Server Actions can still set them successfully.
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // No-op by design: middleware/route handlers handle refresh persistence.
        }
      }
    }
  });
}
