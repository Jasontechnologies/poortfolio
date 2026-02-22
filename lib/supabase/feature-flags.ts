import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export type FeatureFlagKey =
  | 'chat_enabled'
  | 'signup_enabled'
  | 'products_enabled'
  | 'blog_enabled'
  | 'analytics_enabled';

export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlagKey, boolean> = {
  chat_enabled: true,
  signup_enabled: true,
  products_enabled: true,
  blog_enabled: true,
  analytics_enabled: false
};

export async function getFeatureFlags(supabase?: SupabaseClient) {
  const client = supabase ?? (await createClient());
  const { data, error } = await client.from('feature_flags').select('key,enabled');

  if (error || !data) {
    return { ...FEATURE_FLAG_DEFAULTS };
  }

  const flags = { ...FEATURE_FLAG_DEFAULTS };
  for (const item of data) {
    const key = item.key as FeatureFlagKey;
    if (key in flags) {
      flags[key] = Boolean(item.enabled);
    }
  }
  return flags;
}

export async function isFeatureEnabled(key: FeatureFlagKey, supabase?: SupabaseClient) {
  const flags = await getFeatureFlags(supabase);
  return flags[key];
}

export async function upsertFeatureFlag(
  supabase: SupabaseClient,
  key: FeatureFlagKey,
  enabled: boolean,
  updatedBy?: string
) {
  const { error } = await supabase
    .from('feature_flags')
    .upsert(
      {
        key,
        enabled,
        updated_by: updatedBy ?? null
      },
      { onConflict: 'key' }
    );

  if (error) {
    throw new Error(error.message);
  }
}
