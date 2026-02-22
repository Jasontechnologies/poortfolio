import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFeatureFlags } from '@/lib/supabase/feature-flags';

export async function GET() {
  const supabase = await createClient();
  const flags = await getFeatureFlags(supabase);
  return NextResponse.json({ flags });
}
